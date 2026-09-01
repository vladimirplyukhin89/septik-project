import { animate, hover, inView, stagger, type AnimationSequence } from 'motion'

const SPRING = { type: 'spring' as const, stiffness: 280, damping: 28 }
const EASE_OUT = [0.16, 1, 0.3, 1] as const
const STAT_SPRING = { type: 'spring' as const, stiffness: 150, damping: 20, mass: 0.95 }

function formatRu(value: number) {
  return value.toLocaleString('ru-RU')
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function revealInstant(section: HTMLElement) {
  section.classList.remove('partners-motion-pending')
  section.classList.add('is-live')
  section.querySelectorAll('[data-motion-stat]').forEach((el) => el.classList.add('is-shown'))

  section.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
    if (node.dataset.counted === '1') return
    const target = Number(node.dataset.count)
    if (!Number.isFinite(target)) return
    node.dataset.counted = '1'
    node.textContent = `${node.dataset.prefix || ''}${formatRu(target)}${node.dataset.suffix || ''}`
  })
}

function countUp(
  node: HTMLElement,
  options: { duration?: number; delay?: number; onComplete?: () => void } = {},
) {
  if (node.dataset.counted === '1') return
  const target = Number(node.dataset.count)
  if (!Number.isFinite(target)) return

  node.dataset.counted = '1'
  const prefix = node.dataset.prefix || ''
  const suffix = node.dataset.suffix || ''
  node.textContent = `${prefix}${formatRu(0)}${suffix}`

  animate(0, target, {
    duration: options.duration ?? 0.9,
    delay: options.delay ?? 0,
    ease: [0.12, 0.78, 0.16, 1],
    onUpdate: (latest) => {
      node.textContent = `${prefix}${formatRu(Math.round(latest))}${suffix}`
    },
    onComplete: options.onComplete,
  })
}

function enableHovers(section: HTMLElement) {
  hover(section.querySelectorAll('[data-partner-hover]'), (element) => {
    animate(element, { y: -6 }, { type: 'spring', stiffness: 420, damping: 24 })
    return () => animate(element, { y: 0 }, { type: 'spring', stiffness: 380, damping: 30 })
  })

  hover(section.querySelectorAll('.partner-chip'), (element) => {
    animate(element, { scale: 1.06 }, { type: 'spring', stiffness: 500, damping: 22 })
    return () => animate(element, { scale: 1 }, { type: 'spring', stiffness: 420, damping: 26 })
  })
}

function enableStatHovers(stats: HTMLElement[]) {
  hover(stats, (element) => {
    animate(element, { y: -5, scale: 1.02 }, { type: 'spring', stiffness: 360, damping: 22 })
    return () => animate(element, { y: 0, scale: 1 }, { type: 'spring', stiffness: 320, damping: 26 })
  })
}

function playStats(section: HTMLElement) {
  const root = section.querySelector<HTMLElement>('[data-motion-stats]')
  const stats = [...section.querySelectorAll<HTMLElement>('[data-motion-stat]')]
  if (!root || !stats.length) return

  inView(
    root,
    () => {
      stats.forEach((stat, index) => {
        const delay = index * 0.18
        const counter = stat.querySelector<HTMLElement>('[data-count]')
        const meter = stat.querySelector<HTMLElement>('[data-motion-meter]')
        const value = stat.querySelector<HTMLElement>('.partner-stat__value')
        const target = counter ? Number(counter.dataset.count) : NaN
        const countDuration = Number.isFinite(target) ? Math.min(1.45, 0.8 + target / 1300) : 1.1

        animate(
          stat,
          {
            opacity: [0, 1],
            y: [36, 0],
            scale: [0.92, 1],
            filter: ['blur(10px)', 'blur(0px)'],
          },
          {
            delay,
            opacity: { delay, duration: 0.85, ease: EASE_OUT },
            filter: { delay, duration: 0.95, ease: EASE_OUT },
            y: { ...STAT_SPRING, delay },
            scale: { ...STAT_SPRING, delay },
          },
        ).then(() => {
          stat.classList.add('is-shown')
        })

        if (counter && Number.isFinite(target)) {
          countUp(counter, {
            duration: countDuration,
            delay: delay + 0.28,
            onComplete: () => {
              if (!value) return
              animate(value, { scale: [1, 1.07, 1] }, { duration: 0.55, ease: EASE_OUT })
            },
          })
        }

        if (meter) {
          animate(
            meter,
            { scaleX: [0, 1] },
            { delay: delay + 0.48, duration: 1.05, ease: EASE_OUT },
          )
        }
      })

      window.setTimeout(
        () => enableStatHovers(stats),
        stats.length * 180 + 900,
      )
    },
    { amount: 0.35, margin: '0px 0px -12% 0px' },
  )
}

function playEntrance(section: HTMLElement) {
  const head = section.querySelector<HTMLElement>('[data-motion-head]')
  const featured = section.querySelector<HTMLElement>('[data-motion-featured]')
  const enterItems = section.querySelectorAll<HTMLElement>('[data-motion-enter]')
  const cities = section.querySelectorAll<HTMLElement>('[data-motion-city]')
  const path = section.querySelector<SVGPathElement>('[data-motion-path]')
  const nodes = section.querySelectorAll<SVGCircleElement>('[data-motion-node]')
  const cards = section.querySelectorAll<HTMLElement>('[data-motion-card]')
  const counters = section.querySelectorAll<HTMLElement>('[data-count]')
  const hubFrom = Number(section.querySelector('[data-motion-cities]')?.getAttribute('data-hub-index') || 0)

  const sequence: AnimationSequence = []

  if (head) {
    sequence.push([head, { opacity: [0, 1], x: [-28, 0] }, { duration: 0.55, ease: EASE_OUT }])
  }

  if (featured) {
    sequence.push([
      featured,
      { opacity: [0, 1], y: [36, 0], scale: [0.97, 1] },
      { ...SPRING, at: 0.08 },
    ])
  }

  if (enterItems.length) {
    sequence.push([
      enterItems,
      { opacity: [0, 1], y: [18, 0] },
      { delay: stagger(0.055), duration: 0.45, ease: EASE_OUT, at: 0.22 },
    ])
  }

  if (cities.length) {
    sequence.push([
      cities,
      { opacity: [0, 1], scale: [0.84, 1] },
      {
        delay: stagger(0.045, { from: Number.isFinite(hubFrom) ? hubFrom : 0 }),
        type: 'spring',
        stiffness: 420,
        damping: 22,
        at: 0.48,
      },
    ])
  }

  if (path) {
    sequence.push([path, { pathLength: [0, 1] }, { duration: 1.15, ease: 'easeInOut', at: 0.42 }])
  }

  if (nodes.length) {
    sequence.push([
      nodes,
      { opacity: [0, 1], scale: [0, 1] },
      { delay: stagger(0.05), type: 'spring', stiffness: 380, damping: 18, at: 0.62 },
    ])
  }

  if (cards.length) {
    sequence.push([
      cards,
      { opacity: [0, 1], y: [40, 0] },
      { delay: stagger(0.12), ...SPRING, at: 0.38 },
    ])
  }

  animate(sequence, {
    onComplete: () => {
      section.classList.remove('partners-motion-pending')
      section.classList.add('is-live')
      enableHovers(section)
    },
  })

  window.setTimeout(() => {
    counters.forEach((node) => {
      if (node.closest('[data-motion-stat]')) return
      countUp(node)
    })
  }, 520)
}

export function initPartnersMotion() {
  const section = document.querySelector<HTMLElement>('[data-partners-motion]')
  if (!section) return

  const fallback = window.setTimeout(() => {
    if (section.classList.contains('is-live')) return
    section.classList.remove('partners-motion-pending')
    section.classList.add('is-live')
  }, 2500)

  if (prefersReducedMotion()) {
    window.clearTimeout(fallback)
    revealInstant(section)
    return
  }

  inView(
    section,
    () => {
      window.clearTimeout(fallback)
      playEntrance(section)
    },
    { margin: '0px 0px -8% 0px' },
  )

  playStats(section)
}
