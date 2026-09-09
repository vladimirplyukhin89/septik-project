# Мой септик — лендинг

SEO-лендинг изготовления и монтажа септиков в Тюмени (ООО «АРМАДА»).

## Стек

- **web/** — Astro 7 + Tailwind 4 + Node adapter (SSG страница + API заявок)
- **studio/** — Sanity Studio (админка контента)
- Контент: локальный fallback + опционально Sanity по `PUBLIC_SANITY_PROJECT_ID`

## Быстрый старт

```bash
# сайт
cd web && cp .env.example .env && npm install && npm run dev

# админка (нужен Sanity project id)
cd studio && cp .env.example .env && npm install
# укажите SANITY_STUDIO_PROJECT_ID в .env
npm run dev
```

Корень монорепо:

```bash
npm install
npm run dev        # лендинг
npm run dev:studio # Sanity
```

## Заявки

`POST /api/lead` принимает `{ name, phone, message? }`.

Переменные:

- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — доставка в Telegram
- `AMOCRM_SUBDOMAIN` + `AMOCRM_ACCESS_TOKEN` — сделка/неразобранное в amoCRM
- без Telegram и amoCRM заявки логируются (demo mode)`
- `PUBLIC_YANDEX_METRIKA_ID` — Метрика + цель `lead_submit`

Антиспам: скрытое honeypot-поле и лимит 5 заявок с IP / номера за 10 минут.

## Деплой

1. **Сайт:** Node standalone (`npm run build` → `node ./dist/server/entry.mjs`) или платформа с Node/Astro adapter (Vercel/Cloudflare — сменить adapter).
2. **Studio:** `cd studio && npx sanity deploy` → `*.sanity.studio` (бесплатный хостинг Sanity).
3. Домен `armada-septik.ru`: DNS на хостинг, после запуска — Вебмастер/Search Console.

## Дизайн

См. [docs/design/](docs/design/): moodboard, wireframes, design system.

## Документация для заказчика

[docs/CLIENT-HANDOFF.md](docs/CLIENT-HANDOFF.md)
