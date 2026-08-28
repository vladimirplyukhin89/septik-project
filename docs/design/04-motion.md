# Motion — «Мой септик»

Сдержанная система анимации (manufacturer-motion).

## Слои

1. **Hero entrance** — kicker → заголовок → CTA → stats (`hero-reveal`, once)
2. **Stats count-up** — 1 / 5 / цена «от N ₽» (~900 ms, ease-out)
3. **Scroll fade-up** — заголовки секций
4. **Stagger cards** — продукция, преимущества, сценарии, галерея (`--reveal-i`)
5. **Partners live** — пульс «официальные представители», count-up масштаба, ticker линеек, сеть узлов
6. **Hero video** — particle-loop на первом экране, play/pause по видимости; при reduced-motion — постер
7. **Header shadow** — `.site-header.is-scrolled` после 12 px
8. **Hover** — карточки `-translateY(2px)`, галерея zoom 1.03
9. **Form** — `.is-loading` на кнопке отправки
10. **FAQ** — плавный аккордеон (`grid-template-rows` + fade текста), один открытый пункт

## Доступность

`prefers-reduced-motion: reduce` — без transform/count-up, контент сразу видим.

Инициализация: [`web/src/components/MotionInit.astro`](../../web/src/components/MotionInit.astro)
