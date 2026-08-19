/** Горизонтальная история преимуществ в духе блока «О компании» / s-adv у Евролос. */
export function initAdvantagesStory() {
  const root = document.querySelector<HTMLElement>('[data-advantages-story]')
  if (!root) return

  const scroller = root.querySelector<HTMLElement>('[data-advantages-scroller]')
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-advantages-slide]'))
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-advantages-dot]'))
  const prevButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-advantages-prev]'))
  const nextButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-advantages-next]'))
  const fill = root.querySelector<HTMLElement>('[data-advantages-fill]')
  const video = root.querySelector<HTMLVideoElement>('[data-advantages-video]')
  if (!scroller || slides.length < 2) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let index = 0
  let autoTimer: number | null = null
  let inView = false

  const clampIndex = (value: number) => (value + slides.length) % slides.length

  const setActive = (nextIndex: number, scroll = true) => {
    index = clampIndex(nextIndex)
    slides.forEach((slide, i) => {
      const active = i === index
      slide.classList.toggle('is-active', active)
      slide.setAttribute('aria-current', active ? 'true' : 'false')
    })
    dots.forEach((dot, i) => {
      const active = i === index
      dot.classList.toggle('is-active', active)
      dot.setAttribute('aria-selected', active ? 'true' : 'false')
    })
    if (fill) fill.style.width = `${((index + 1) / slides.length) * 100}%`
    if (scroll) {
      slides[index].scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        inline: 'start',
        block: 'nearest',
      })
    }
  }

  const stopAuto = () => {
    if (autoTimer === null) return
    window.clearInterval(autoTimer)
    autoTimer = null
  }

  const startAuto = () => {
    stopAuto()
    if (reduceMotion || !inView) return
    autoTimer = window.setInterval(() => setActive(index + 1), 5600)
  }

  const syncFromScroll = () => {
    const left = scroller.scrollLeft
    let nearest = 0
    let best = Number.POSITIVE_INFINITY
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.offsetLeft - left)
      if (dist < best) {
        best = dist
        nearest = i
      }
    })
    if (nearest !== index) setActive(nearest, false)
  }

  scroller.addEventListener('scroll', syncFromScroll, { passive: true })

  if (!reduceMotion) {
    scroller.addEventListener(
      'wheel',
      (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
        const max = scroller.scrollWidth - scroller.clientWidth
        const atStart = scroller.scrollLeft <= 2
        const atEnd = scroller.scrollLeft >= max - 2
        if ((event.deltaY > 0 && atEnd) || (event.deltaY < 0 && atStart)) return
        event.preventDefault()
        scroller.scrollLeft += event.deltaY
        startAuto()
      },
      { passive: false },
    )
  }

  prevButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActive(index - 1)
      startAuto()
    })
  })
  nextButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActive(index + 1)
      startAuto()
    })
  })
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      setActive(i)
      startAuto()
    })
  })

  scroller.addEventListener('pointerdown', startAuto)
  root.addEventListener('mouseenter', () => stopAuto())
  root.addEventListener('mouseleave', () => startAuto())
  root.addEventListener('focusin', stopAuto)
  root.addEventListener('focusout', startAuto)

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActive(index + 1)
      startAuto()
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActive(index - 1)
      startAuto()
    }
  })

  const setVideoPlaying = (play: boolean) => {
    if (!video || reduceMotion) return
    if (play) {
      const run = video.play()
      if (run) run.catch(() => {})
      return
    }
    video.pause()
  }

  const viewObserver = new IntersectionObserver(
    (entries) => {
      inView = entries.some((entry) => entry.isIntersecting)
      setVideoPlaying(inView)
      if (inView) startAuto()
      else stopAuto()
    },
    { threshold: 0.28 },
  )
  viewObserver.observe(root)

  if (reduceMotion) {
    video?.remove()
  }

  setActive(0, false)
}
