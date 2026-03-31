import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.API_PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

function normalizeBitrixWebhookBase(raw) {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('.json')) {
    const idx = trimmed.lastIndexOf('/');
    return idx > -1 ? trimmed.slice(0, idx) : trimmed;
  }
  return trimmed;
}

function toRubAmount(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return '0.00';
  return numberValue.toFixed(2);
}

async function sendTelegramMessage(text) {
  const token = requireEnv('TELEGRAM_BOT_TOKEN');
  const chatId = requireEnv('TELEGRAM_CHAT_ID');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${body}`);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'sara-flowers-api' });
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body ?? {};
    if (!name || (!phone && !email) || !message) {
      return res.status(400).json({ ok: false, error: 'Заполните имя, сообщение и телефон или email.' });
    }

    const bitrixBase = normalizeBitrixWebhookBase(requireEnv('BITRIX24_WEBHOOK_URL'));
    const bitrixUrl = `${bitrixBase}/crm.lead.add.json`;

    const leadPayload = {
      fields: {
        TITLE: `Заявка с сайта Sara Flowers: ${String(name).trim()}`,
        NAME: String(name).trim(),
        PHONE: phone ? [{ VALUE: String(phone).trim(), VALUE_TYPE: 'WORK' }] : [],
        EMAIL: email ? [{ VALUE: String(email).trim(), VALUE_TYPE: 'WORK' }] : [],
        COMMENTS: String(message).trim(),
        SOURCE_ID: 'WEB'
      },
      params: { REGISTER_SONET_EVENT: 'Y' }
    };

    const bitrixResponse = await fetch(bitrixUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload)
    });

    const bitrixData = await bitrixResponse.json().catch(() => ({}));
    if (!bitrixResponse.ok || bitrixData.error) {
      return res.status(502).json({
        ok: false,
        error: 'Bitrix24 вернул ошибку',
        details: bitrixData
      });
    }

    return res.json({ ok: true, leadId: bitrixData.result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/payments/create', async (req, res) => {
  try {
    const { customer, items, total, orderComment } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Корзина пуста.' });
    }

    const totalValue = Number(total);
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      return res.status(400).json({ ok: false, error: 'Некорректная сумма заказа.' });
    }

    const shopId = requireEnv('YOOKASSA_SHOP_ID');
    const secretKey = requireEnv('YOOKASSA_SECRET_KEY');
    const publicBaseUrl = requireEnv('PUBLIC_BASE_URL');
    const orderId = `SF-${Date.now()}`;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const idempotenceKey = crypto.randomUUID();

    const safeItems = items.map((item) => ({
      name: String(item?.name ?? 'Букет'),
      quantity: Number(item?.quantity ?? 1),
      price: Number(item?.price ?? 0)
    }));

    const paymentPayload = {
      amount: {
        value: toRubAmount(totalValue),
        currency: 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${publicBaseUrl.replace(/\/+$/, '')}/checkout?payment=success&orderId=${encodeURIComponent(orderId)}`
      },
      description: `Оплата заказа ${orderId} (Sara Flowers)`,
      metadata: {
        order_id: orderId,
        customer_name: String(customer?.name ?? ''),
        customer_phone: String(customer?.phone ?? ''),
        customer_email: String(customer?.email ?? ''),
        customer_address: String(customer?.address ?? ''),
        order_comment: String(orderComment ?? ''),
        order_items_json: JSON.stringify(safeItems).slice(0, 4000)
      }
    };

    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await yookassaResponse.json().catch(() => ({}));
    if (!yookassaResponse.ok) {
      return res.status(502).json({
        ok: false,
        error: 'Не удалось создать платеж в YooKassa',
        details: paymentData
      });
    }

    return res.json({
      ok: true,
      orderId,
      paymentId: paymentData.id,
      confirmationUrl: paymentData?.confirmation?.confirmation_url ?? null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const event = req.body?.event;
    const paymentObject = req.body?.object ?? {};
    if (event !== 'payment.succeeded') {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const metadata = paymentObject?.metadata ?? {};
    const amount = paymentObject?.amount?.value ?? '';
    const currency = paymentObject?.amount?.currency ?? 'RUB';
    const orderId = metadata?.order_id || paymentObject?.id || 'unknown';

    let itemsText = 'Состав недоступен';
    try {
      const parsedItems = JSON.parse(metadata?.order_items_json || '[]');
      if (Array.isArray(parsedItems) && parsedItems.length) {
        itemsText = parsedItems
          .map((item) => `• ${item.name} x${item.quantity} (${item.price} ₽)`)
          .join('\n');
      }
    } catch {
      itemsText = 'Состав недоступен';
    }

    const message =
      `<b>Оплачен заказ ${orderId}</b>\n` +
      `Сумма: <b>${amount} ${currency}</b>\n` +
      `Клиент: ${metadata?.customer_name || '—'}\n` +
      `Телефон: ${metadata?.customer_phone || '—'}\n` +
      `Адрес: ${metadata?.customer_address || '—'}\n\n` +
      `<b>Букеты:</b>\n${itemsText}`;

    await sendTelegramMessage(message);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server started on http://127.0.0.1:${PORT}`);
});
