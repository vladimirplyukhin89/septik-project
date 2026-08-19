/** Sticky revolver: вертикальный скролл крутит барабан преимуществ. */
export function initAdvantagesStory() {
  const root = document.querySelector<HTMLElement>('[data-advantages-story]')
  if (!root) return

  const stage = root.querySelector<HTMLElement>('[data-advantages-stage]')
  const drum = root.querySelector<HTMLElement>('[data-advantages-drum]')
  const video = root.querySelector<HTMLVideoElement>('[data-advantages-video]')
  const chambers = Array.from(root.querySelectorAll<HTMLElement>('[data-advantages-chamber]'))
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-advantages-card]'))
  const ticks = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-advantages-tick]'))
  const count = chambers.length
  if (!stage || !drum || count < 2) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const stepDeg = 360 / count
  const startRot = 180

  if (reduceMotion) {
    root.classList.add('is-static')
    video?.remove()
    cards.forEach((card) => {
      card.classList.add('is-active')
      card.setAttribute('aria-hidden', 'false')
    })
    return
  }

  let target = 0
  let current = 0
  let index = -1
  let raf = 0
  let inView = false

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

  const setActive = (next: number) => {
    if (next === index) return
    index = next
    chambers.forEach((el, i) => el.classList.toggle('is-active', i === index))
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

  const applyRot = (progress: number) => {
    const pos = progress * (count - 1)
    drum.style.setProperty('--rot', `${startRot - pos * stepDeg}deg`)
    setActive(Math.round(pos))
  }

  const render = () => {
    current += (target - current) * 0.18
    if (Math.abs(target - current) < 0.0004) current = target
    applyRot(current)

    if (inView || Math.abs(target - current) > 0.0004) {
      raf = window.requestAnimationFrame(render)
      return
    }
    raf = 0
  }

  const kick = () => {
    target = readProgress()
    if (!raf) raf = window.requestAnimationFrame(render)
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

  window.addEventListener('scroll', kick, { passive: true })
  window.addEventListener('resize', kick)

  const viewObserver = new IntersectionObserver(
    (entries) => {
      inView = entries.some((entry) => entry.isIntersecting)
      setVideoPlaying(inView)
      if (inView) kick()
    },
    { threshold: 0.08 },
  )
  viewObserver.observe(root)

  kick()
}
