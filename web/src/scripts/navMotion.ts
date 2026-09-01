import { animate, hover, stagger } from 'motion'
import { lockScroll, unlockScroll } from './scrollLock'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const SPRING = { type: 'spring' as const, stiffness: 380, damping: 26 }

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function circleFrom(toggle: HTMLElement, open: boolean) {
  const rect = toggle.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = open
    ? Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      ) + 24
    : 0
  return `circle(${radius}px at ${x}px ${y}px)`
}

export function initSiteNav() {
  const header = document.querySelector<HTMLElement>('[data-site-header]')
  const toggle = header?.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  const panel = document.querySelector<HTMLElement>('[data-nav-panel]')
  if (!header || !toggle || !panel) return

  const items = [...panel.querySelectorAll<HTMLElement>('[data-nav-item]')]
  const first = panel.querySelector<HTMLElement>('[data-nav-first]')
  const desktop = window.matchMedia('(min-width: 1280px)')

  let open = false
  let token = 0
  let hoversBound = false
  const playing: { stop: () => void }[] = []

  const stopPlaying = () => {
    while (playing.length) {
      playing.pop()?.stop()
    }
  }

  const clipStart = (willOpen: boolean) => {
    const computed = getComputedStyle(panel).clipPath
    if (computed && computed !== 'none') return computed
    return circleFrom(toggle, !willOpen)
  }

  const lock = () => {
    lockScroll()
    document.documentElement.classList.add('nav-open')
  }

  const unlock = () => {
    document.documentElement.classList.remove('nav-open')
    unlockScroll()
  }

  const setChrome = (next: boolean) => {
    toggle.setAttribute('aria-expanded', next ? 'true' : 'false')
    toggle.setAttribute('aria-label', next ? 'Закрыть меню' : 'Открыть меню')
    panel.setAttribute('aria-hidden', next ? 'false' : 'true')
  }

  const showInstant = () => {
    panel.hidden = false
    panel.classList.add('is-open')
    panel.style.clipPath = 'none'
    items.forEach((item) => {
      item.style.opacity = '1'
      item.style.filter = 'none'
      item.style.transform = 'none'
    })
  }

  const hideInstant = () => {
    panel.classList.remove('is-open')
    panel.hidden = true
    panel.style.clipPath = ''
    items.forEach((item) => {
      item.style.opacity = ''
      item.style.filter = ''
      item.style.transform = ''
    })
  }

  const playOpen = async (id: number) => {
    lock()
    panel.hidden = false
    panel.classList.add('is-open')
    setChrome(true)

    if (prefersReducedMotion()) {
      showInstant()
      first?.focus({ preventScroll: true })
      return
    }

    const origin = clipStart(true)
    const target = circleFrom(toggle, true)
    panel.style.clipPath = origin
    items.forEach((item) => {
      item.style.opacity = '0'
      item.style.filter = 'blur(12px)'
      item.style.transform = 'translateX(28px)'
    })

    const sheet = animate(
      panel,
      { clipPath: [origin, target] },
      { duration: 0.62, ease: EASE_OUT },
    )
    playing.push(sheet)

    const list = items.length
      ? animate(
          items,
          { opacity: [0, 1], x: [28, 0], filter: ['blur(12px)', 'blur(0px)'] },
          {
            delay: stagger(0.055, { startDelay: 0.12 }),
            opacity: { duration: 0.42, ease: EASE_OUT },
            filter: { duration: 0.5, ease: EASE_OUT },
            x: SPRING,
          },
        )
      : null
    if (list) playing.push(list)

    await Promise.all([sheet, list].filter(Boolean))
    if (id !== token) return

    panel.style.clipPath = 'none'
    first?.focus({ preventScroll: true })

    if (!hoversBound && items.length) {
      hoversBound = true
      hover(items.filter((el) => el.matches('a')), (element) => {
        animate(element, { x: 8 }, { type: 'spring', stiffness: 460, damping: 24 })
        return () => animate(element, { x: 0 }, { type: 'spring', stiffness: 400, damping: 28 })
      })
    }
  }

  const playClose = async (id: number) => {
    setChrome(false)

    if (prefersReducedMotion()) {
      hideInstant()
      unlock()
      toggle.focus({ preventScroll: true })
      return
    }

    const origin = clipStart(false)
    const target = circleFrom(toggle, false)
    panel.style.clipPath = origin

    const list = items.length
      ? animate(
          items,
          { opacity: [1, 0], x: [0, 16], filter: ['blur(0px)', 'blur(8px)'] },
          {
            delay: stagger(0.03, { from: 'last' }),
            duration: 0.22,
            ease: EASE_OUT,
          },
        )
      : null
    if (list) playing.push(list)

    const sheet = animate(
      panel,
      { clipPath: [origin, target] },
      { duration: 0.42, delay: 0.08, ease: EASE_OUT },
    )
    playing.push(sheet)

    await Promise.all([list, sheet].filter(Boolean))
    if (id !== token) return

    hideInstant()
    unlock()
    toggle.focus({ preventScroll: true })
  }

  const setOpen = (next: boolean) => {
    if (next === open) return
    if (desktop.matches) return
    open = next
    const id = ++token
    stopPlaying()
    return next ? playOpen(id) : playClose(id)
  }

  toggle.addEventListener('click', () => {
    void setOpen(!open)
  })

  panel.querySelectorAll<HTMLAnchorElement>('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href')
      if (href?.startsWith('#')) {
        event.preventDefault()
        const target = document.querySelector(href)
        void Promise.resolve(setOpen(false)).then(() => {
          if (target instanceof HTMLElement) {
            const top =
              window.scrollY + target.getBoundingClientRect().top - header.offsetHeight
            window.scrollTo({
              top: Math.max(0, top),
              behavior: prefersReducedMotion() ? 'instant' : 'smooth',
            })
          }
          history.replaceState(null, '', href)
        })
        return
      }
      void setOpen(false)
    })
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    void setOpen(false)
  })

  document.querySelectorAll('[data-open-lead-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      void setOpen(false)
    })
  })

  desktop.addEventListener('change', (event) => {
    if (event.matches) void setOpen(false)
  })
}
