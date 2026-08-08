/** Интерактивная галерея: stage + thumbnails + стрелки (поддерживает несколько на странице). */
export function initExamplesGallery() {
  const roots = document.querySelectorAll<HTMLElement>('[data-examples-gallery]')
  roots.forEach((root) => initGalleryRoot(root))
}

function initGalleryRoot(root: HTMLElement) {
  const main = root.querySelector<HTMLImageElement>('[data-examples-main]')
  const caption = root.querySelector<HTMLElement>('[data-examples-caption]')
  const counter = root.querySelector<HTMLElement>('[data-examples-counter]')
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-examples-thumb]'))
  const prev = root.querySelector<HTMLButtonElement>('[data-examples-prev]')
  const next = root.querySelector<HTMLButtonElement>('[data-examples-next]')

  if (!main || !thumbs.length) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let index = 0
  let autoTimer: number | null = null

  const setActive = (nextIndex: number, animate = true) => {
    index = (nextIndex + thumbs.length) % thumbs.length
    const thumb = thumbs[index]
    const src = thumb.dataset.src
    const text = thumb.dataset.caption || ''
    if (!src) return

    const apply = () => {
      main.src = src
      main.alt = text
      if (caption) caption.textContent = text
      if (counter) counter.textContent = `${index + 1} / ${thumbs.length}`
      thumbs.forEach((btn, i) => {
        const active = i === index
        btn.classList.toggle('is-active', active)
        btn.setAttribute('aria-selected', active ? 'true' : 'false')
      })
    }

    if (!animate || reduceMotion) {
      apply()
      return
    }

    main.classList.add('is-switching')
    window.setTimeout(() => {
      apply()
      main.classList.remove('is-switching')
    }, 160)
  }

  const stopAuto = () => {
    if (autoTimer !== null) {
      window.clearInterval(autoTimer)
      autoTimer = null
    }
  }

  const startAuto = () => {
    stopAuto()
    if (reduceMotion || thumbs.length < 2) return
    autoTimer = window.setInterval(() => setActive(index + 1), 5200)
  }

  thumbs.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      setActive(i)
      startAuto()
    })
  })

  prev?.addEventListener('click', () => {
    setActive(index - 1)
    startAuto()
  })

  next?.addEventListener('click', () => {
    setActive(index + 1)
    startAuto()
  })

  root.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent)) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActive(index - 1)
      startAuto()
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActive(index + 1)
      startAuto()
    }
  })

  root.addEventListener('mouseenter', stopAuto)
  root.addEventListener('mouseleave', startAuto)
  root.addEventListener('focusin', stopAuto)
  root.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return
    startAuto()
  })

  setActive(0, false)
  startAuto()
}
