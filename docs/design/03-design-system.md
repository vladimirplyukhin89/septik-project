# High-fi design system — «Мой септик» (тёмная канва)

Референс компоновки: [systeme.ru](https://systeme.ru/). Реализация: `web/src/styles/global.css` + компоненты.

## Палитра

```css
--color-ink: #edf2f7;          /* основной текст */
--color-ink-muted: #9aa8b8;    /* вторичный текст */
--color-paper: #080c14;        /* канва страницы */
--color-paper-deep: #121a28;   /* приподнятые карточки */
--color-soil: #070b12;         /* hero / footer / video */
--color-accent: #0b6e99;       /* стальной синий — свой, не Systeme teal */
--color-accent-hover: #1a8fbf;
--color-rust: #e06a2e;         /* цена / тёплый акцент */
--color-line: #2a384c;
--color-on-light: #122033;     /* текст на белых кнопках и бейджах */
--color-success: #3dba6c;
```

Акцент Systeme (`#00AC86` Techno Green) не копируем. Берём ритм тёмной канвы и сетку блоков.

## Типографика

- **UI / headings:** `Manrope` (400–800)
- H1 ~2.75–3.75rem, H2 ~2–3rem, body 1rem–1.125rem
- Kickers: uppercase, tracking широкий, `accent`

## Паттерны как у Systeme

1. **Тёмная канва** — страница, шапка и секции на одном почти-чёрном фоне
2. **Split header** — `.section-head`: крупный H2 слева, лид справа
3. **Карточки** — `paper-deep` + тонкая светлая обводка `white/10`, без тяжёлой тени
4. **Фото-карточки** — full-bleed медиа, градиентный оверлей, подпись снизу
5. **Header** — тёмный, белый текст, телефон + «Обратный звонок»
6. **CTA** — стальной `accent`, белая кнопка только на тёмных панелях (`text-on-light`)

## Motion

1. `fade-up` секций
2. Hover карточки: лёгкий подъём + border accent
3. CTA: смена оттенка accent
