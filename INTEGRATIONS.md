# Integrations Setup (RU)

## Что реализовано

- Личный кабинет с базой заказов (PostgreSQL)
- Регистрация/вход:
  - пароль (email/телефон + пароль)
  - SMS-код (через sms.ru, либо DEV-режим)
  - Google OAuth
  - Яндекс OAuth
- Оформление заказа с разделением:
  - плательщик
  - получатель (может быть другим человеком)
- Статусы заказа в ЛК:
  - `received` — Заказ получен
  - `assembled` — Собран
  - `out_for_delivery` — Передан на доставку
  - `delivered` — Вручен
- PDF-чек по оплаченному заказу (доступен в ЛК)
- Telegram уведомление после `payment.succeeded`:
  - букет (список)
  - фото букета (если есть URL)
  - адрес доставки
  - контакты плательщика и получателя
- Bitrix24 заявка из формы «Напишите нам»

## 1) PostgreSQL

Обязательно заполните в `.env`:

- `DATABASE_URL=postgres://user:password@host:5432/dbname`
- `JWT_SECRET=...`

При старте API таблицы создаются автоматически.

## 2) Bitrix24 (форма контактов)

1. Создайте входящий webhook с правами CRM.
2. Заполните:
   - `BITRIX24_WEBHOOK_URL=https://<portal>.bitrix24.ru/rest/<user_id>/<webhook_key>`

Форма `Контакты` отправляет POST на `/api/contact`, сервер создает лид через `crm.lead.add.json`.

## 3) YooKassa (оплата для РФ)

Заполните:

- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `PUBLIC_BASE_URL=https://sara-flowers.ru`

В YooKassa настройте webhook:

- URL: `https://sara-flowers.ru/api/payments/webhook`
- событие: `payment.succeeded`

## 4) Telegram Bot

Заполните:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

После успешной оплаты API отправит сообщение/фото в Telegram.

## 5) SMS авторизация (sms.ru)

Заполните:

- `SMSRU_API_ID`

Если `SMSRU_API_ID` пустой, в DEV-режиме код возвращается в ответе API как `devCode`.

## 6) OAuth (Google и Яндекс)

Заполните:

- Google:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI=https://sara-flowers.ru/api/auth/oauth/google/callback`
- Яндекс:
  - `YANDEX_CLIENT_ID`
  - `YANDEX_CLIENT_SECRET`
  - `YANDEX_REDIRECT_URI=https://sara-flowers.ru/api/auth/oauth/yandex/callback`

После OAuth пользователь возвращается в `/account` уже авторизованным.

## 7) Опционально: защита ручного обновления статуса

Для endpoint `PATCH /api/orders/:orderId/status` заполните:

- `ADMIN_API_TOKEN`

И передавайте заголовок `x-admin-token`.

## Локальный запуск

1. Скопируйте `.env.example` -> `.env` и заполните ключи.
2. Запустите API:
   - `npm run dev:api`
3. Запустите фронт:
   - `npm run dev`

Vite проксирует `/api/*` на `http://127.0.0.1:8787`.
