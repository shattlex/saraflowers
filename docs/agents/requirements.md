# Mini Plan (Subagents-Orchestrator)

## Scope

1. Личный кабинет с базой заказов (PostgreSQL).
2. Авторизация: пароль, SMS, Google OAuth, Yandex OAuth.
3. Оформление заказа с разделением на плательщика и получателя.
4. Статусы заказа в ЛК: получен, собран, передан на доставку, вручен.
5. PDF-чек по оплаченному заказу.
6. Telegram после оплаты: букет (текст + фото), адрес, контакты плательщика/получателя.

## Workstreams

1. Backend stream:
- PostgreSQL schema (`users`, `sms_codes`, `orders`)
- Auth API (`/api/auth/*`)
- Order history API (`/api/orders/my`)
- Payment API + webhook (`/api/payments/create`, `/api/payments/webhook`)
- PDF receipt generation + static serve (`/receipts/*`)

2. Frontend stream:
- Новый экран `/account`
- Формы login/register/sms + OAuth start
- История заказов и статусы
- Скачивание PDF чека
- Checkout: выбор получателя + передача полных данных в API

3. Ops/docs stream:
- Расширенный `.env.example`
- Обновленный `INTEGRATIONS.md` по Postgres/SMS/OAuth/Telegram/YooKassa

## Acceptance Criteria

1. Пользователь может зарегистрироваться/войти и увидеть свои прошлые заказы.
2. В checkout можно выбрать: получатель = плательщик или другой человек.
3. После `payment.succeeded`:
- заказ сохраняется как `paid` и `received`
- создается PDF чек
- в Telegram уходит сообщение с букетом, фото (если URL), адресом и контактами
4. В ЛК отображаются статусы заказа и ссылка на PDF чек.
5. Сборка фронта проходит без ошибок.
