import { animate, inView, stagger } from 'motion'

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 22 }
const EASE_OUT = [0.16, 1, 0.3, 1] as const

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function revealInstant(section: HTMLElement) {
  section.classList.remove('advantages-motion-pending')
  section.classList.add('is-live')
}

export function initAdvantagesMotion() {
  const section = document.querySelector<HTMLElement>('[data-advantages-motion]')
  if (!section || section.classList.contains('is-live')) return

  if (prefersReducedMotion()) {
    revealInstant(section)
    return
  }

  inView(
    section,
    () => {
      playEntrance(section)
    },
    { margin: '0px 0px -10% 0px' },
  )
}

function playEntrance(section: HTMLElement) {
  if (section.classList.contains('is-live')) return

  const cards = [...section.querySelectorAll<HTMLElement>('[data-advantage-card]')]
  const nums = [...section.querySelectorAll<HTMLElement>('[data-advantage-num]')]
  const meter = section.querySelector<HTMLElement>('[data-advantage-meter]')

  if (!cards.length) {
    revealInstant(section)
    return
  }

  animate(
    cards,
    {
      opacity: [0, 1],
      y: [32, 0],
      filter: ['blur(8px)', 'blur(0px)'],
    },
    {
      delay: stagger(0.1),
      opacity: { duration: 0.7, ease: EASE_OUT },
      filter: { duration: 0.8, ease: EASE_OUT },
      y: { ...SPRING },
    },
  ).then(() => {
    section.classList.remove('advantages-motion-pending')
    section.classList.add('is-live')
  })

  if (nums.length) {
    animate(
      nums,
      { opacity: [0, 1], scale: [0.72, 1] },
      {
        delay: stagger(0.1, { startDelay: 0.12 }),
        type: 'spring',
        stiffness: 380,
        damping: 18,
      },
    )
  }

  if (meter) {
    animate(meter, { scaleX: [0, 1] }, { delay: 0.38, duration: 0.95, ease: EASE_OUT })
  }
}
