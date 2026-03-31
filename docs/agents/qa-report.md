QA REPORT:
- Risk Level: Medium
- Findings:
  1. Нет автотестов интеграций с внешними сервисами (Bitrix24/YooKassa/Telegram), проверка сейчас smoke/manual.
  2. Нет верификации подлинности webhook от YooKassa на уровне подписи; используется событие и payload без дополнительной криптопроверки.
  3. Хранение состояния заказа без БД (метаданные в YooKassa), что достаточно для MVP, но ограничивает аудит/повторные проверки.
- Suggested Fix:
  - Добавить интеграционные тесты с моками внешних API.
  - Добавить проверку доверенного источника webhook (IP allowlist YooKassa + reverse proxy restrictions).
  - В следующем этапе внедрить persistent storage заказов (PostgreSQL) и связь payment_id -> order.
- Test Scenarios:
  - Preconditions: заполнены `.env` ключи Bitrix24/YooKassa/Telegram, backend поднят.
  - Steps: отправить форму контактов.
  - Expected Result: ответ API 200, лид в Bitrix24.
  - Priority: High

  - Preconditions: корзина содержит >=1 товар, валидные ключи YooKassa.
  - Steps: checkout -> "Карта онлайн" -> редирект в YooKassa -> успешная оплата.
  - Expected Result: возврат на `/checkout?payment=success&orderId=...`, webhook вызывает Telegram-уведомление.
  - Priority: High

  - Preconditions: невалидный/пустой ключ любого внешнего сервиса.
  - Steps: вызвать соответствующий endpoint.
  - Expected Result: контролируемая ошибка API с понятным сообщением.
  - Priority: Medium
- Production Impact:
  - Решение готово для пилота/MVP с реальными платежами в РФ и CRM/Telegram интеграциями.
  - Для полноценных production SLA рекомендуются меры из Suggested Fix.
