import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT_DIR, 'public', 'receipts');

if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const app = express();
const PORT = Number(process.env.API_PORT || 8787);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const DB_SSL_REQUIRED = process.env.DATABASE_URL?.includes('sslmode=require');
const PG_SSL_REJECT_UNAUTHORIZED =
  String(process.env.PG_SSL_REJECT_UNAUTHORIZED ?? 'true').trim().toLowerCase() !== 'false';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: DB_SSL_REQUIRED ? { rejectUnauthorized: PG_SSL_REJECT_UNAUTHORIZED } : undefined
});

const ORDER_STATUSES = {
  received: 'Заказ получен',
  assembled: 'Собран',
  out_for_delivery: 'Передан на доставку',
  delivered: 'Вручен'
};

app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use('/receipts', express.static(RECEIPTS_DIR));

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

function toRubAmount(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num.toFixed(2) : '0.00';
}

function signAuthToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

function authOptional(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice('Bearer '.length);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId };
  } catch {
    req.user = undefined;
  }
  return next();
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Требуется авторизация.' });
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId };
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Сессия истекла. Войдите снова.' });
  }
}

function normalizePhone(raw) {
  return String(raw || '')
    .replace(/[^+\d]/g, '')
    .replace(/^8(\d{10})$/, '+7$1');
}

function normalizeEmail(raw) {
  const value = String(raw || '').trim().toLowerCase();
  return value || null;
}

function normalizeBitrixWebhookBase(raw) {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('.json')) {
    const idx = trimmed.lastIndexOf('/');
    return idx > -1 ? trimmed.slice(0, idx) : trimmed;
  }
  return trimmed;
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
      parse_mode: 'HTML'
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${await response.text()}`);
  }
}

async function sendTelegramPhoto(photoUrl, caption = '') {
  const token = requireEnv('TELEGRAM_BOT_TOKEN');
  const chatId = requireEnv('TELEGRAM_CHAT_ID');

  if (photoUrl.startsWith('data:image/')) {
    const match = photoUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URI image format');
    }

    const mimeType = match[1];
    const base64Payload = match[2];
    const binary = Buffer.from(base64Payload, 'base64');

    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }
    formData.append('photo', new Blob([binary], { type: mimeType }), 'order-image.jpg');

    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Telegram sendPhoto failed: ${await response.text()}`);
    }
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      caption
        ? {
            chat_id: chatId,
            photo: photoUrl,
            caption,
            parse_mode: 'HTML'
          }
        : {
            chat_id: chatId,
            photo: photoUrl
          }
    )
  });

  if (!response.ok) {
    throw new Error(`Telegram sendPhoto failed: ${await response.text()}`);
  }
}

async function sendTelegramDocument(filePath, caption) {
  const token = requireEnv('TELEGRAM_BOT_TOKEN');
  const chatId = requireEnv('TELEGRAM_CHAT_ID');
  const fileBuffer = await fs.promises.readFile(filePath);
  const fileName = path.basename(filePath);

  const formData = new FormData();
  formData.append('chat_id', chatId);
  if (caption) {
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
  }
  formData.append('document', new Blob([fileBuffer], { type: 'application/pdf' }), fileName);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Telegram sendDocument failed: ${await response.text()}`);
  }
}

function getOrderPhotoList(order) {
  const photos = [];
  const items = Array.isArray(order?.items_json) ? order.items_json : [];

  for (const item of items) {
    const rawImage = typeof item?.image === 'string' ? item.image.trim() : '';
    if (!rawImage) continue;

    const image = rawImage.startsWith('/') ? `${PUBLIC_BASE_URL}${rawImage}` : rawImage;
    const hasSupportedImage =
      image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:image/');
    if (!hasSupportedImage) continue;

    const quantity = Math.max(1, Number.parseInt(String(item?.quantity ?? 1), 10) || 1);
    for (let i = 0; i < quantity; i += 1) {
      photos.push(image);
    }
  }

  if (photos.length > 0) return photos;

  const rawImage = typeof order?.first_image === 'string' ? order.first_image.trim() : '';
  if (!rawImage) return photos;

  const image = rawImage.startsWith('/') ? `${PUBLIC_BASE_URL}${rawImage}` : rawImage;
  const hasSupportedImage =
    image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:image/');
  if (hasSupportedImage) {
    photos.push(image);
  }

  return photos;
}

async function sendOrderTelegramNotification(order, message) {
  const photos = getOrderPhotoList(order);
  const captionLimit = 1024;
  const caption = message.length > captionLimit ? `${message.slice(0, captionLimit - 1)}...` : message;

  // Send all bouquet photos according to ordered quantities.
  if (photos.length > 0) {
    await sendTelegramPhoto(photos[0], caption);
    for (let i = 1; i < photos.length; i += 1) {
      await sendTelegramPhoto(photos[i]);
    }
    return;
  }

  await sendTelegramMessage(message);
}

async function sendSmsCode(phone, code) {
  const apiId = process.env.SMSRU_API_ID?.trim();
  const text = `Sara Flowers: код входа ${code}`;

  if (!apiId) {
    // Dev fallback: no provider configured
    // eslint-disable-next-line no-console
    console.warn(`[SMS DEV] ${phone}: ${code}`);
    return { devMode: true };
  }

  const url = new URL('https://sms.ru/sms/send');
  url.searchParams.set('api_id', apiId);
  url.searchParams.set('to', phone);
  url.searchParams.set('msg', text);
  url.searchParams.set('json', '1');

  const response = await fetch(url, { method: 'POST' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.status !== 'OK') {
    throw new Error('Не удалось отправить SMS код. Проверьте SMSRU_API_ID.');
  }

  return { devMode: false };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatOrderItems(orderItems) {
  if (!Array.isArray(orderItems)) return 'Состав не указан';
  return orderItems
    .map((item) => `• ${item.name} x${item.quantity} (${Number(item.price).toLocaleString('ru-RU')} ₽)`)
    .join('\n');
}

function buildTelegramOrderMessage(order, options = {}) {
  const { paid = true } = options;
  const itemsText = formatOrderItems(order.items_json);
  const recipientLine = order.recipient_mode === 'other'
    ? `${order.recipient_name || '—'}, ${order.recipient_phone || '—'}, ${order.recipient_email || '—'}`
    : `${order.payer_name || '—'}, ${order.payer_phone || '—'}, ${order.payer_email || '—'}`;

  return [
    paid ? `<b>Оплачен заказ ${escapeHtml(order.id)}</b>` : `<b>Новый заказ (наличные) ${escapeHtml(order.id)}</b>`,
    `Сумма: <b>${Number(order.total).toLocaleString('ru-RU')} ₽</b>`,
    paid ? 'Статус оплаты: <b>Оплачен</b>' : 'Статус оплаты: <b>Не оплачен (наличные)</b>',
    '',
    `<b>Букет(ы):</b>`,
    escapeHtml(itemsText),
    '',
    `<b>Адрес доставки:</b> ${escapeHtml(order.delivery_address || '—')}`,
    `<b>Плательщик:</b> ${escapeHtml(order.payer_name || '—')} / ${escapeHtml(order.payer_phone || '—')} / ${escapeHtml(order.payer_email || '—')}`,
    `<b>Получатель:</b> ${escapeHtml(recipientLine)}`,
    order.comment ? `<b>Комментарий:</b> ${escapeHtml(order.comment)}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

async function createReceiptPdf(order) {
  const fileName = `${order.id}.pdf`;
  const filePath = path.join(RECEIPTS_DIR, fileName);
  const preferredFonts = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    'C:\\Windows\\Fonts\\arial.ttf'
  ];
  const unicodeFont = preferredFonts.find((fontPath) => fs.existsSync(fontPath));

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    if (unicodeFont) {
      doc.font(unicodeFont);
    }
    doc.fontSize(20).text('Sara Flowers — Кассовый чек');
    doc.moveDown();

    doc.fontSize(12).text(`Заказ: ${order.id}`);
    doc.text(`Дата: ${new Date().toLocaleString('ru-RU')}`);
    doc.text(`Статус: ${ORDER_STATUSES[order.status] || order.status}`);
    doc.moveDown();

    doc.fontSize(14).text('Позиции:');
    doc.moveDown(0.5);

    for (const item of order.items_json || []) {
      doc.fontSize(12).text(`${item.name} x${item.quantity} — ${Number(item.price).toLocaleString('ru-RU')} ₽`);
    }

    doc.moveDown();
    doc.fontSize(12).text(`Итого: ${Number(order.total).toLocaleString('ru-RU')} ₽`);
    doc.text(`Адрес доставки: ${order.delivery_address || '—'}`);
    doc.text(`Плательщик: ${order.payer_name || '—'}, ${order.payer_phone || '—'}, ${order.payer_email || '—'}`);

    if (order.recipient_mode === 'other') {
      doc.text(`Получатель: ${order.recipient_name || '—'}, ${order.recipient_phone || '—'}, ${order.recipient_email || '—'}`);
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return `/receipts/${fileName}`;
}

async function upsertOAuthUser({ provider, providerUserId, email, name }) {
  const existing = await pool.query(
    `SELECT * FROM users WHERE auth_provider = $1 AND provider_user_id = $2 LIMIT 1`,
    [provider, providerUserId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  if (email) {
    const byEmail = await pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
    if (byEmail.rows[0]) {
      const updated = await pool.query(
        `UPDATE users
         SET auth_provider = $1, provider_user_id = $2, updated_at = NOW(), name = COALESCE(NULLIF($3, ''), name)
         WHERE id = $4
         RETURNING *`,
        [provider, providerUserId, name || '', byEmail.rows[0].id]
      );
      return updated.rows[0];
    }
  }

  const inserted = await pool.query(
    `INSERT INTO users (id, name, email, auth_provider, provider_user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [crypto.randomUUID(), name || '', email, provider, providerUserId]
  );

  return inserted.rows[0];
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      default_delivery_address TEXT,
      password_hash TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'password',
      provider_user_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS default_delivery_address TEXT;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sms_codes (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'received',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payer_name TEXT,
      payer_phone TEXT,
      payer_email TEXT,
      recipient_mode TEXT NOT NULL DEFAULT 'self',
      recipient_name TEXT,
      recipient_phone TEXT,
      recipient_email TEXT,
      delivery_address TEXT,
      comment TEXT,
      items_json JSONB NOT NULL,
      total NUMERIC(12,2) NOT NULL,
      first_image TEXT,
      payment_id TEXT,
      receipt_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'sara-flowers-api', db: 'ok' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'db error' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, default_delivery_address, auth_provider, created_at FROM users WHERE id = $1 LIMIT 1`,
      [req.user.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ ok: false, error: 'Пользователь не найден.' });
    }

    return res.json({ ok: true, user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.patch('/api/auth/profile', authRequired, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const normalizedEmail = normalizeEmail(req.body?.email);
    const normalizedPhone = normalizePhone(req.body?.phone);
    const defaultDeliveryAddressRaw = req.body?.defaultDeliveryAddress;
    const defaultDeliveryAddress = typeof defaultDeliveryAddressRaw === 'string'
      ? defaultDeliveryAddressRaw.trim()
      : '';

    if (!name || (!normalizedEmail && !normalizedPhone)) {
      return res.status(400).json({ ok: false, error: 'Укажите имя и телефон или email.' });
    }

    if (defaultDeliveryAddress.length > 500) {
      return res.status(400).json({ ok: false, error: 'Address is too long.' });
    }

    const existing = await pool.query(
      `SELECT id FROM users
       WHERE id <> $1 AND (email = $2 OR phone = $3)
       LIMIT 1`,
      [req.user.userId, normalizedEmail, normalizedPhone || null]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ ok: false, error: 'Пользователь с таким email или телефоном уже существует.' });
    }

    const updated = await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           phone = $3,
           default_delivery_address = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, phone, default_delivery_address, auth_provider, created_at`,
      [name, normalizedEmail, normalizedPhone || null, defaultDeliveryAddress || null, req.user.userId]
    );

    if (!updated.rows[0]) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }

    return res.json({ ok: true, user: updated.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!name || !password || (!normalizedEmail && !normalizedPhone)) {
      return res.status(400).json({ ok: false, error: 'Укажите имя, пароль и телефон или email.' });
    }

    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
      [normalizedEmail, normalizedPhone || null]
    );

    if (existing.rows[0]) {
      return res.status(409).json({ ok: false, error: 'Пользователь уже существует.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const userId = crypto.randomUUID();

    const inserted = await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, auth_provider)
       VALUES ($1, $2, $3, $4, $5, 'password')
       RETURNING id, name, email, phone, default_delivery_address, auth_provider, created_at`,
      [userId, String(name).trim(), normalizedEmail, normalizedPhone || null, passwordHash]
    );

    const token = signAuthToken(inserted.rows[0]);
    return res.json({ ok: true, token, user: inserted.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body ?? {};
    if (!login || !password) {
      return res.status(400).json({ ok: false, error: 'Укажите логин и пароль.' });
    }

    const normalizedLogin = String(login).trim().toLowerCase();
    const normalizedPhone = normalizePhone(normalizedLogin);

    const found = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
      [normalizedLogin, normalizedPhone || null]
    );

    const user = found.rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ ok: false, error: 'Неверный логин или пароль.' });
    }

    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Неверный логин или пароль.' });
    }

    const token = signAuthToken(user);
    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        default_delivery_address: user.default_delivery_address,
        auth_provider: user.auth_provider,
        created_at: user.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/auth/sms/request', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Укажите телефон в формате +7...' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO sms_codes (phone, code, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (phone)
       DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
      [phone, code, expiresAt]
    );

    const result = await sendSmsCode(phone, code);

    return res.json({
      ok: true,
      message: 'Код отправлен',
      ...(result.devMode && process.env.NODE_ENV !== 'production' ? { devCode: code } : {})
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/auth/sms/verify', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || '').trim();
    const name = String(req.body?.name || '').trim();

    if (!phone || !code) {
      return res.status(400).json({ ok: false, error: 'Укажите телефон и код.' });
    }

    const dbCode = await pool.query(
      `SELECT code, expires_at FROM sms_codes WHERE phone = $1 LIMIT 1`,
      [phone]
    );

    if (!dbCode.rows[0] || dbCode.rows[0].code !== code) {
      return res.status(401).json({ ok: false, error: 'Неверный код подтверждения.' });
    }

    if (new Date(dbCode.rows[0].expires_at).getTime() < Date.now()) {
      return res.status(401).json({ ok: false, error: 'Код истек, запросите новый.' });
    }

    await pool.query(`DELETE FROM sms_codes WHERE phone = $1`, [phone]);

    const existing = await pool.query(`SELECT * FROM users WHERE phone = $1 LIMIT 1`, [phone]);
    let user = existing.rows[0];

    if (!user) {
      const inserted = await pool.query(
        `INSERT INTO users (id, name, phone, auth_provider)
         VALUES ($1, $2, $3, 'sms')
         RETURNING *`,
        [crypto.randomUUID(), name || 'Клиент', phone]
      );
      user = inserted.rows[0];
    }

    const token = signAuthToken(user);
    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        default_delivery_address: user.default_delivery_address,
        auth_provider: user.auth_provider,
        created_at: user.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.get('/api/auth/oauth/:provider/start', (req, res) => {
  try {
    const { provider } = req.params;
    const state = crypto.randomUUID();

    if (provider === 'google') {
      const clientId = requireEnv('GOOGLE_CLIENT_ID');
      const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      return res.json({ ok: true, url: authUrl.toString() });
    }

    if (provider === 'yandex') {
      const clientId = requireEnv('YANDEX_CLIENT_ID');
      const redirectUri = requireEnv('YANDEX_REDIRECT_URI');
      const authUrl = new URL('https://oauth.yandex.ru/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'login:email');
      authUrl.searchParams.set('state', state);
      return res.json({ ok: true, url: authUrl.toString() });
    }

    return res.status(400).json({ ok: false, error: 'Неподдерживаемый OAuth провайдер.' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.get('/api/auth/oauth/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const code = String(req.query.code || '');
    if (!code) {
      return res.status(400).send('Missing OAuth code');
    }

    let profile = null;

    if (provider === 'google') {
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: requireEnv('GOOGLE_CLIENT_ID'),
          client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
          redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
          grant_type: 'authorization_code'
        })
      });
      const tokenData = await tokenResp.json();

      const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResp.json();
      profile = {
        providerUserId: String(userData.id || ''),
        email: normalizeEmail(userData.email),
        name: String(userData.name || '')
      };
    } else if (provider === 'yandex') {
      const redirectUri = requireEnv('YANDEX_REDIRECT_URI');
      const tokenResp = await fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: requireEnv('YANDEX_CLIENT_ID'),
          client_secret: requireEnv('YANDEX_CLIENT_SECRET')
        })
      });
      const tokenData = await tokenResp.json();

      const userResp = await fetch('https://login.yandex.ru/info?format=json', {
        headers: { Authorization: `OAuth ${tokenData.access_token}` }
      });
      const userData = await userResp.json();
      profile = {
        providerUserId: String(userData.id || ''),
        email: normalizeEmail(userData.default_email),
        name: String(userData.real_name || userData.display_name || '')
      };
    } else {
      return res.status(400).send('Unsupported provider');
    }

    if (!profile?.providerUserId) {
      return res.status(400).send('OAuth profile is invalid');
    }

    const user = await upsertOAuthUser({ provider, ...profile });
    const token = signAuthToken(user);
    return res.redirect(`${PUBLIC_BASE_URL}/account?authToken=${encodeURIComponent(token)}`);
  } catch (error) {
    return res.status(500).send(error instanceof Error ? error.message : 'OAuth error');
  }
});

app.get('/api/orders/my', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, status, payment_status, total, delivery_address, created_at, updated_at,
              receipt_path, items_json, payer_name, recipient_mode, recipient_name
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    return res.json({
      ok: true,
      orders: result.rows.map((order) => ({
        ...order,
        status_label: ORDER_STATUSES[order.status] || order.status
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const apiToken = process.env.ADMIN_API_TOKEN?.trim();
    if (!apiToken || req.headers['x-admin-token'] !== apiToken) {
      return res.status(401).json({ ok: false, error: 'Unauthorized.' });
    }

    const { orderId } = req.params;
    const nextStatus = String(req.body?.status || '');

    if (!ORDER_STATUSES[nextStatus]) {
      return res.status(400).json({ ok: false, error: 'Недопустимый статус.' });
    }

    const updated = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [nextStatus, orderId]
    );

    if (!updated.rows[0]) {
      return res.status(404).json({ ok: false, error: 'Заказ не найден.' });
    }

    return res.json({ ok: true, order: updated.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
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
      return res.status(502).json({ ok: false, error: 'Bitrix24 вернул ошибку', details: bitrixData });
    }

    return res.json({ ok: true, leadId: bitrixData.result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/orders/create-cash', authOptional, async (req, res) => {
  try {
    const { payer, recipient, recipientMode, items, total, deliveryAddress, orderComment } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Корзина пуста.' });
    }

    const totalValue = Number(total);
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      return res.status(400).json({ ok: false, error: 'Некорректная сумма заказа.' });
    }

    if (!deliveryAddress || !String(deliveryAddress).trim()) {
      return res.status(400).json({ ok: false, error: 'Укажите адрес доставки.' });
    }

    if (!payer?.name || !payer?.phone) {
      return res.status(400).json({ ok: false, error: 'Укажите данные плательщика.' });
    }

    if (recipientMode === 'other' && (!recipient?.name || !recipient?.phone)) {
      return res.status(400).json({ ok: false, error: 'Укажите данные получателя.' });
    }

    const orderId = `SF-${Date.now()}`;
    const safeItems = items.map((item) => ({
      id: String(item?.id || crypto.randomUUID()),
      name: String(item?.name || 'Букет'),
      quantity: Number(item?.quantity || 1),
      price: Number(item?.price || 0),
      image: typeof item?.image === 'string' ? item.image : ''
    }));

    const firstImage = safeItems.find((item) => item.image)?.image || null;

    const insertedOrder = await pool.query(
      `INSERT INTO orders (
        id, user_id, status, payment_status,
        payer_name, payer_phone, payer_email,
        recipient_mode, recipient_name, recipient_phone, recipient_email,
        delivery_address, comment, items_json, total, first_image
      ) VALUES (
        $1, $2, 'received', 'pending',
        $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12::jsonb, $13, $14
      )
      RETURNING *`,
      [
        orderId,
        req.user?.userId || null,
        String(payer.name).trim(),
        normalizePhone(payer.phone),
        normalizeEmail(payer.email),
        recipientMode === 'other' ? 'other' : 'self',
        recipientMode === 'other' ? String(recipient.name || '').trim() : null,
        recipientMode === 'other' ? normalizePhone(recipient.phone) : null,
        recipientMode === 'other' ? normalizeEmail(recipient.email) : null,
        String(deliveryAddress).trim(),
        String(orderComment || '').trim(),
        JSON.stringify(safeItems),
        toRubAmount(totalValue),
        firstImage
      ]
    );

    const createdOrder = insertedOrder.rows[0];
    if (createdOrder) {
      let receiptPath = null;
      try {
        receiptPath = await createReceiptPdf(createdOrder);
        await pool.query(`UPDATE orders SET receipt_path = $1, updated_at = NOW() WHERE id = $2`, [receiptPath, createdOrder.id]);
      } catch (receiptError) {
        // eslint-disable-next-line no-console
        console.error('Receipt generation failed for cash order:', receiptError);
      }

      const message = buildTelegramOrderMessage(createdOrder, { paid: false });
      try {
        await sendOrderTelegramNotification(createdOrder, message);
        if (receiptPath) {
          const receiptFilePath = path.join(RECEIPTS_DIR, path.basename(receiptPath));
          await sendTelegramDocument(receiptFilePath, `<b>PDF-чек (наличные)</b> по заказу ${escapeHtml(createdOrder.id)}`);
        }
      } catch (telegramError) {
        // eslint-disable-next-line no-console
        console.error('Telegram notification failed for cash order:', telegramError);
      }
    }

    return res.json({ ok: true, orderId });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

app.post('/api/payments/create', authOptional, async (req, res) => {
  try {
    const { payer, recipient, recipientMode, items, total, deliveryAddress, orderComment } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Корзина пуста.' });
    }

    const totalValue = Number(total);
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      return res.status(400).json({ ok: false, error: 'Некорректная сумма заказа.' });
    }

    if (!deliveryAddress || !String(deliveryAddress).trim()) {
      return res.status(400).json({ ok: false, error: 'Укажите адрес доставки.' });
    }

    if (!payer?.name || !payer?.phone) {
      return res.status(400).json({ ok: false, error: 'Укажите данные плательщика.' });
    }

    if (recipientMode === 'other' && (!recipient?.name || !recipient?.phone)) {
      return res.status(400).json({ ok: false, error: 'Укажите данные получателя.' });
    }

    const orderId = `SF-${Date.now()}`;
    const safeItems = items.map((item) => ({
      id: String(item?.id || crypto.randomUUID()),
      name: String(item?.name || 'Букет'),
      quantity: Number(item?.quantity || 1),
      price: Number(item?.price || 0),
      image: typeof item?.image === 'string' ? item.image : ''
    }));

    const firstImage = safeItems.find((item) => item.image)?.image || null;

    await pool.query(
      `INSERT INTO orders (
        id, user_id, status, payment_status,
        payer_name, payer_phone, payer_email,
        recipient_mode, recipient_name, recipient_phone, recipient_email,
        delivery_address, comment, items_json, total, first_image
      ) VALUES (
        $1, $2, 'received', 'pending',
        $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12::jsonb, $13, $14
      )`,
      [
        orderId,
        req.user?.userId || null,
        String(payer.name).trim(),
        normalizePhone(payer.phone),
        normalizeEmail(payer.email),
        recipientMode === 'other' ? 'other' : 'self',
        recipientMode === 'other' ? String(recipient.name || '').trim() : null,
        recipientMode === 'other' ? normalizePhone(recipient.phone) : null,
        recipientMode === 'other' ? normalizeEmail(recipient.email) : null,
        String(deliveryAddress).trim(),
        String(orderComment || '').trim(),
        JSON.stringify(safeItems),
        toRubAmount(totalValue),
        firstImage
      ]
    );

    const shopId = requireEnv('YOOKASSA_SHOP_ID');
    const secretKey = requireEnv('YOOKASSA_SECRET_KEY');
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const paymentPayload = {
      amount: { value: toRubAmount(totalValue), currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${PUBLIC_BASE_URL}/checkout?payment=success&orderId=${encodeURIComponent(orderId)}`
      },
      description: `Оплата заказа ${orderId} (Sara Flowers)`,
      metadata: {
        order_id: orderId
      }
    };

    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID()
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await yookassaResponse.json().catch(() => ({}));
    if (!yookassaResponse.ok) {
      return res.status(502).json({ ok: false, error: 'Не удалось создать платеж в YooKassa', details: paymentData });
    }

    await pool.query(
      `UPDATE orders SET payment_id = $1, updated_at = NOW() WHERE id = $2`,
      [paymentData.id || null, orderId]
    );

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

    const orderId = paymentObject?.metadata?.order_id;
    if (!orderId) {
      return res.status(400).json({ ok: false, error: 'Missing order id in metadata.' });
    }

    const updatedOrder = await pool.query(
      `UPDATE orders
       SET payment_status = 'paid', status = 'received', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId]
    );

    const order = updatedOrder.rows[0];
    if (!order) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }

    const receiptPath = await createReceiptPdf(order);
    await pool.query(`UPDATE orders SET receipt_path = $1, updated_at = NOW() WHERE id = $2`, [receiptPath, orderId]);

    const message = buildTelegramOrderMessage(order, { paid: true });
    await sendOrderTelegramNotification(order, message);
    const receiptFilePath = path.join(RECEIPTS_DIR, path.basename(receiptPath));
    await sendTelegramDocument(receiptFilePath, `<b>PDF-чек</b> по заказу ${escapeHtml(order.id)}`);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
  }
});

async function start() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for account/order features.');
    }

    await migrate();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API server started on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start API:', error);
    process.exit(1);
  }
}

start();
