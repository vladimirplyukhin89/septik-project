/** Sticky advantages: scroll swaps copy over a full-bleed video. */
export function initAdvantagesStory() {
  const root = document.querySelector<HTMLElement>('[data-advantages-story]')
  if (!root) return

  const stage = root.querySelector<HTMLElement>('[data-advantages-stage]')
  const video = root.querySelector<HTMLVideoElement>('[data-advantages-video]')
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-advantages-card]'))
  const ticks = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-advantages-tick]'))
  const count = cards.length
  if (!stage || count < 2) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) {
    root.classList.add('is-static')
    video?.closest('.advantages-bg')?.remove()
    cards.forEach((card) => {
      card.classList.add('is-active')
      card.setAttribute('aria-hidden', 'false')
    })
    return
  }

  let index = -1

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

  const setActive = (next: number) => {
    if (next === index) return
    index = next
    cards.forEach((el, i) => {
      const on = i === index
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-hidden', on ? 'false' : 'true')
    })
    ticks.forEach((el, i) => {
      el.classList.toggle('is-active', i === index)
      el.setAttribute('aria-selected', i === index ? 'true' : 'false')
    })
  }

  const pinnedTop = () => {
    const top = Number.parseFloat(getComputedStyle(stage).top)
    return Number.isFinite(top) ? top : 0
  }

  const readProgress = () => {
    const range = root.offsetHeight - stage.offsetHeight
    if (range <= 0) return 0
    return clamp((pinnedTop() - root.getBoundingClientRect().top) / range, 0, 1)
  }

  const sync = () => {
    const pos = readProgress() * (count - 1)
    setActive(Math.round(pos))
  }

  const setVideoPlaying = (play: boolean) => {
    if (!video) return
    if (play) {
      const run = video.play()
      if (run) run.catch(() => {})
      return
    }
    video.pause()
  }

  const scrollToIndex = (next: number) => {
    const range = root.offsetHeight - stage.offsetHeight
    const top =
      window.scrollY +
      root.getBoundingClientRect().top -
      pinnedTop() +
      (next / (count - 1)) * range
    window.scrollTo({ top, behavior: 'smooth' })
  }

  ticks.forEach((tick, i) => {
    tick.addEventListener('click', () => scrollToIndex(i))
  })

  window.addEventListener('scroll', sync, { passive: true })
  window.addEventListener('resize', sync)

  const viewObserver = new IntersectionObserver(
    (entries) => {
      const inView = entries.some((entry) => entry.isIntersecting)
      setVideoPlaying(inView)
      if (inView) sync()
    },
    { threshold: 0.08 },
  )
  viewObserver.observe(root)

  sync()
}
