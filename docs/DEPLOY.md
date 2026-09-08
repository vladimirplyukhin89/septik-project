# Перенос домена мойсептик72.рф

## Шаги

1. Собрать и задеплоить Astro (`web`) на хостинг с Node (или сменить adapter на Cloudflare/Vercel).
2. В панели DNS домена указать A/CNAME на хостинг.
3. Включить HTTPS (Let's Encrypt / Cloudflare).
4. Проверить `https://мойсептик72.рф` и `https://www.…` — один канонический хост + редирект.
5. Добавить сайт в [Яндекс.Вебмастер](https://webmaster.yandex.ru/) и Google Search Console (punycode: `xn--72-mlcmdikqlsn.xn--p1ai`).
6. Указать sitemap: `/sitemap-index.xml`.
7. Sanity Studio: `npx sanity deploy` → отдельный URL `*.sanity.studio` (не на основном домене).
8. После смены вёрстки — 301 со старых якорей Tilda не критичны (одностраничник); сохранить телефон и NAP в футере.

## Переменные на проде

Скопировать из `web/.env.example`: Sanity IDs, Telegram bot, amoCRM, Метрика.
