# Integrations Setup (RU)

## 1) Bitrix24: заявки из формы "Напишите нам"

1. Создайте входящий webhook в Bitrix24 с правами CRM.
2. Возьмите base URL вида:
   `https://<portal>.bitrix24.ru/rest/<user_id>/<webhook_key>`
3. В `.env` заполните:
   `BITRIX24_WEBHOOK_URL=<base_url>`
4. Форма контактов отправляет POST на `/api/contact`, сервер создает лид через:
   `crm.lead.add.json`

## 2) YooKassa: онлайн-оплата для РФ

Выбран сервис: **YooKassa** (рабочий вариант для клиентов РФ, карты/СБП/кошельки в зависимости от настроек магазина).

1. Получите `shopId` и `secretKey` в кабинете YooKassa.
2. В `.env` заполните:
   - `YOOKASSA_SHOP_ID`
   - `YOOKASSA_SECRET_KEY`
   - `PUBLIC_BASE_URL` (домен фронта, напр. `https://flowers.example.ru`)
3. На checkout при "Карта онлайн" фронт вызывает `/api/payments/create`, затем редиректит пользователя на `confirmation_url`.
4. В YooKassa добавьте webhook URL:
   `https://<your-domain>/api/payments/webhook`
   Событие: `payment.succeeded`.

## 3) Telegram Bot: уведомление о оплаченных букетах

1. Создайте Telegram-бота через BotFather.
2. Получите `TELEGRAM_BOT_TOKEN`.
3. Добавьте бота в нужный чат/группу и получите `TELEGRAM_CHAT_ID`.
4. В `.env` заполните:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. После webhook `payment.succeeded` сервер отправляет сообщение в Telegram:
   - номер заказа
   - сумма
   - клиент
   - состав букетов

## Local run

1. Скопируйте `.env.example` -> `.env` и заполните ключи.
2. Запустите API:
   `npm run dev:api`
3. В другом терминале запустите фронт:
   `npm run dev`

Vite proxy проксирует `/api/*` на `http://127.0.0.1:8787` (или `VITE_API_BASE_URL`).
