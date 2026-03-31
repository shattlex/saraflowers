# Mini Plan (Subagents-Orchestrator)

## Scope

1. Интеграция формы `Контакты -> Bitrix24`.
2. Интеграция `Checkout (успешная оплата) -> Telegram bot`.
3. Интеграция онлайн-оплаты для РФ через YooKassa.

## Workstreams

1. Backend integration stream:
- `POST /api/contact` -> Bitrix24 `crm.lead.add`.
- `POST /api/payments/create` -> YooKassa payment creation.
- `POST /api/payments/webhook` -> Telegram notification on `payment.succeeded`.

2. Frontend integration stream:
- Contacts form submit to `/api/contact`.
- Checkout card payment flow to `/api/payments/create` + redirect to confirmation URL.
- Success state after return URL `/checkout?payment=success&orderId=...`.

3. Config & ops stream:
- `.env.example` with required keys.
- `INTEGRATIONS.md` setup steps.
- Vite proxy `/api` -> backend API.

## Acceptance Criteria

1. При отправке формы контактов создается лид в Bitrix24.
2. При успешной оплате в YooKassa приходит Telegram-уведомление с составом заказа.
3. На checkout при выборе "Карта онлайн" создается реальный платеж в RUB и происходит редирект в YooKassa.
4. Сборка фронта проходит без ошибок.
