import { animate, inView, stagger } from 'motion'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 24 }
const EASE_OUT = [0.16, 1, 0.3, 1] as const

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function revealInstant(section: HTMLElement) {
  section.classList.remove('problems-motion-pending')
  section.classList.add('is-live')
}

export function initProblemsMotion() {
  const section = document.querySelector<HTMLElement>('[data-problems-motion]')
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

  const scenes = [...section.querySelectorAll<HTMLElement>('[data-problem-scene]')]
  const nums = [...section.querySelectorAll<HTMLElement>('[data-problem-num]')]
  const paths = [...section.querySelectorAll<SVGPathElement>('[data-problem-path]')]

  if (!scenes.length) {
    revealInstant(section)
    return
  }

  animate(
    scenes,
    {
      opacity: [0, 1],
      y: [28, 0],
      filter: ['blur(8px)', 'blur(0px)'],
    },
    {
      delay: stagger(0.14),
      opacity: { duration: 0.7, ease: EASE_OUT },
      filter: { duration: 0.8, ease: EASE_OUT },
      y: { ...SPRING },
    },
  ).then(() => {
    section.classList.remove('problems-motion-pending')
    section.classList.add('is-live')
  })

  if (nums.length) {
    animate(
      nums,
      { opacity: [0, 1], scale: [0.78, 1] },
      {
        delay: stagger(0.14, { startDelay: 0.1 }),
        type: 'spring',
        stiffness: 380,
        damping: 18,
      },
    )
  }

  if (paths.length) {
    animate(
      paths,
      { pathLength: [0, 1], opacity: [0.2, 1] },
      {
        delay: stagger(0.14, { startDelay: 0.28 }),
        duration: 0.95,
        ease: EASE_OUT,
      },
    )
  }
}
