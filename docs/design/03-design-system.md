# High-fi design system — «Мой септик» (Eurolos-inspired)

Эталон структуры: [eurolos.ru](https://eurolos.ru/). Реализация: `web/src/styles/global.css` + компоненты.

## Палитра

```css
--color-ink: #122033;
--color-ink-muted: #5a6573;
--color-paper: #ffffff;
--color-paper-deep: #f4f6f8;
--color-soil: #0f1c2e;      /* тёмные блоки */
--color-accent: #0b6e99;    /* стальной синий */
--color-accent-hover: #095a7d;
--color-rust: #c45c26;      /* цена / тёплый акцент */
--color-line: #e2e8ee;
--color-success: #1f7a45;
```

## Типографика

- **UI / headings:** `Manrope` (400–700)
- H1 ~2.75–3.25rem, H2 ~1.75–2rem, body 1rem–1.0625rem
- Без Literata — чистый manufacturer look

## Паттерны как у Евролос

1. **Stats strip** — 3–4 крупные цифры под hero  
2. **Product cards** — медиа, бейдж, цена «от», specs, CTA  
3. **Advantages** — нумерация 01… в сетке  
4. **Header** — лого, якорное меню, телефон, «Заказать звонок»  
5. **Светлые секции** чередуются с `#f4f6f8`
6. **Партнёры** — featured-панель Евролос (мощь/масштаб) + карточки Евробион/Топас

## Motion

1. `fade-up` секций  
2. Hover карточки: лёгкая тень + border accent  
3. CTA: смена оттенка accent
