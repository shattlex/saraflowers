QA REPORT:
- Risk Level: Medium
- Findings:
  1. OAuth (Google/Yandex) и SMS требуют внешние провайдеры и валидные ключи в `.env`; без них соответствующие методы входа недоступны.
  2. Проверка подлинности webhook YooKassa пока минимальная (по payload/event), без дополнительной криптоподписи на уровне приложения.
  3. Endpoint смены статуса заказа (`PATCH /api/orders/:orderId/status`) защищен `x-admin-token`; при слабом токене есть риск несанкционированных изменений.
- Suggested Fix:
  - Настроить прод-ключи OAuth/SMS и проверить callback URL на боевом домене.
  - Усилить валидацию webhook (источник/IP allowlist и ограничения reverse-proxy).
  - Сгенерировать длинный случайный `ADMIN_API_TOKEN` и хранить только в `.env`.
- Test Scenarios:
  - Preconditions: заполнены `DATABASE_URL`, `JWT_SECRET`, `YOOKASSA_*`, `TELEGRAM_*`.
  - Steps: оформить заказ онлайн, выбрать `получатель = другой человек`, оплатить.
  - Expected Result: заказ появляется в ЛК, статус `Заказ получен`, есть PDF чек, в Telegram приходит букет+фото+адрес+плательщик/получатель.
  - Priority: High

  - Preconditions: OAuth и SMS ключи заполнены.
  - Steps: пройти логин через SMS/Google/Yandex.
  - Expected Result: успешная авторизация, переход в `/account`, отображение профиля/заказов.
  - Priority: High

  - Preconditions: есть заказ и `ADMIN_API_TOKEN`.
  - Steps: отправить `PATCH /api/orders/:orderId/status` по цепочке `received -> assembled -> out_for_delivery -> delivered`.
  - Expected Result: в ЛК меняется текст статуса.
  - Priority: Medium
- Production Impact:
  - Решение готово как production MVP после заполнения `.env` и включения PostgreSQL.
  - Основные пользовательские сценарии (личный кабинет, история заказов, статусы, чеки, Telegram после оплаты) покрыты.
