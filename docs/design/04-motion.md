# Motion — «Мой септик»

Сдержанная система анимации (manufacturer-motion).

## Слои

1. **Hero entrance** — kicker → заголовок → CTA → stats (`hero-reveal`, once)
2. **Stats count-up** — 1 / 5 / цена «от N ₽» (~900 ms, ease-out)
3. **Scroll fade-up** — заголовки секций
4. **Stagger cards** — продукция, преимущества, сценарии, галерея (`--reveal-i`)
5. **Header shadow** — `.site-header.is-scrolled` после 12 px
6. **Hover** — карточки `-translateY(2px)`, галерея zoom 1.03
7. **Form** — `.is-loading` на кнопке отправки  
8. **FAQ** — плавный аккордеон (`grid-template-rows` + fade текста), один открытый пункт

## Доступность

`prefers-reduced-motion: reduce` — без transform/count-up, контент сразу видим.

Инициализация: [`web/src/components/MotionInit.astro`](../../web/src/components/MotionInit.astro)
