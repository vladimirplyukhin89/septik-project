# Производительность лендинга

Дата проверки: 1 сентября 2026.  
Сборка: `npm run build` (Astro 7, prerender главной).  
Аудит: Lighthouse 12, production `index.html` с `web/dist/client`.  
Локальный сервер без gzip и cache-заголовков — на Vercel сжатие и CDN улучшат TTFB и вес текста, но не LCP от видео.

## Сводка Lighthouse

| Категория | Mobile | Desktop |
|-----------|--------|---------|
| Performance | **52** | **57** |
| Accessibility | 96 | — |
| Best Practices | 100 | — |
| SEO | 100 | — |

### Core Web Vitals (симуляция Lighthouse)

| Метрика | Mobile | Desktop | Цель |
|---------|--------|---------|------|
| FCP | 3.4 с | 2.2 с | ≤ 1.8 с |
| LCP | **7.2 с** | **6.7 с** | ≤ 2.5 с |
| TBT | 520 мс | 150 мс | ≤ 200 мс |
| CLS | **0** | **0** | ≤ 0.1 |
| Speed Index | 5.5 с | 3.1 с | ≤ 3.4 с |
| TTI | 7.2 с | 6.7 с | — |

**LCP-элемент:** `video.hero-stage__video`. 94% времени LCP — render delay, пока видео готово к кадру. CLS в порядке: вёрстка не прыгает.

Общий transfer на первом экране аудита: **~3.0 MB / 21 запрос**. Из них **1.97 MB** — `particles-water.mp4`.

---

## Что уже хорошо

- Главная статическая (`prerender: true`), HTML отдаётся сразу.
- JS разрезан: Motion `animate` 60 KB / **21 KB gzip**, `MotionInit` 16 / 5 KB, nav/partners/problems — по 1–4 KB. Чанки секций грузятся по мере показа.
- CSS 69 KB / **12.5 KB gzip**.
- CLS = 0.
- Большинство фото: `loading="lazy"` + `decoding="async"`.
- Видео: `preload="metadata"`, `playsinline`, poster 39 KB.
- SEO 100, Best Practices 100.
- Accessibility 96 (см. ниже).

---

## Вес ассетов (исходники)

| Файл | Размер | Роль |
|-------|--------|------|
| `videos/particles-water.mp4` | **1970 KB** | фон hero, LCP |
| `photo-example-1…5.jpg` | 267–457 KB каждое | работы |
| `topol-eco.png` | 177 KB | лого партнёра |
| `septik-mini-1.jpg` | 114 KB | каталог, eager |
| `armada-logo.png` | 58 KB | лого в хедере |
| Остальные mini JPG | 42–69 KB | каталог / форматы |
| Poster видео | 39 KB | poster hero |

JS+CSS после gzip на проде: порядка **~40 KB**. Узкое место не скрипты, а медиа.

---

## Главные проблемы (по влиянию на LCP/вес)

### 1. Видео в hero — LCP и 2 MB

Автоплей качает весь mp4. На медленном 4G это главный удар по Performance.

Что делать (по приоритету):

1. На мобиле не грузить mp4: только poster / короткий webm, `matchMedia` или `<source media>`.
2. Сжать ролик (короче, меньше битрейт, 720p, `faststart`).
3. Либо заменить фон картинкой + лёгким CSS/canvas.

### 2. Первое фото работ грузится сразу

`Works.astro`: `loading={i === 0 ? 'eager' : 'lazy'}`. Блок далеко под fold, Lighthouse считает **407 KB offscreen**. Первую плитку тоже лучше `lazy` (или `fetchpriority="low"`).

### 3. Картинки не в современном формате и без srcset

Lighthouse: **~313 KB** на responsive, **~360 KB** на WebP/AVIF.

- `topol-eco.png` 177 KB для маленького лого.
- `armada-logo.png` 58 KB в хедере (LCP-сосед).
- JPG без `srcset`/`sizes`.

Имеет смысл: AVIF/WebP + 1x/2x, SVG/маленький PNG для логотипов.

### 4. Google Fonts блокируют отрисовку

`Manrope` 400–800 (пять начертаний) с Google. Preconnect есть, `display=swap` тоже, но CSS с fonts.googleapis.com всё равно render-blocking.

Самохостинг woff2 (2–3 начертания) или `&text=` не нужен — достаточно 500/700/800.

### 5. Gzip на аудите

«Est. 156 KB» на HTML/CSS/JS — артефакт `python http.server`. На Vercel сжатие будет. На оценку LCP видео это не влияет.

### 6. Первая карточка каталога eager

`septik-mini-1.jpg` 114 KB eager — оправдано, если каталог в первом экране на длинном мобильном вьюпорте нет. На телефоне hero высокий, карточка скорее below the fold → можно `lazy`.

---

## Accessibility (96)

- `article.product-card` с `role="button"` — ARIA role на несовместимом элементе. Лучше настоящая кнопка/ссылка.
- Контраст: `.section-kicker` и `.partner-role` на тёмном фоне чуть бледные.

SEO и Best Practices без падений.

---

## Порядок работ, если поднимать балл

1. Не качать mp4 на узком вьюпорте / ужать ролик. Ожидаемый скачок Performance самый большой.
2. `lazy` на первое фото работ.
3. WebP/AVIF + уменьшение логотипов.
4. Самохостинг 2–3 начертаний Manrope.
5. По желанию: `fetchpriority="high"` на poster hero, если LCP станет картинкой.

После п.1 на мобиле реалистично уйти из «красной» зоны LCP; JS уже не главный тормоз.
