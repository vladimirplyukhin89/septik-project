import { lockScroll, unlockScroll } from './scrollLock'

/** Лайтбокс для мозаики работ: открытие кадра, стрелки только внутри диалога. */
export function initWorksLightbox() {
  const root = document.querySelector<HTMLElement>('[data-works-gallery]')
  const modal = root?.querySelector<HTMLDialogElement>('[data-works-lightbox]')
  if (!root || !modal) return

  const tiles = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-works-open]'))
  const img = modal.querySelector<HTMLImageElement>('[data-works-lightbox-img]')
  const caption = modal.querySelector<HTMLElement>('[data-works-lightbox-caption]')
  const counter = modal.querySelector<HTMLElement>('[data-works-lightbox-counter]')
  const prev = modal.querySelector<HTMLButtonElement>('[data-works-prev]')
  const next = modal.querySelector<HTMLButtonElement>('[data-works-next]')
  const closeBtn = modal.querySelector<HTMLButtonElement>('[data-works-close]')
  if (!img || !tiles.length) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const slides = tiles
    .map((tile) => ({ src: tile.dataset.src || '', caption: tile.dataset.caption || '' }))
    .filter((slide) => slide.src)

  if (!slides.length) return

  if (slides.length < 2) {
    prev?.setAttribute('hidden', '')
    next?.setAttribute('hidden', '')
  }

  let index = 0
  let closing = false
  let closeGeneration = 0
  let closeTimer: number | null = null
  let onCloseTransitionEnd: ((event: TransitionEvent) => void) | null = null
  let lastTile: HTMLButtonElement | null = null
  let scrollHeld = false

  const holdScroll = () => {
    if (scrollHeld) return
    scrollHeld = true
    lockScroll()
    document.documentElement.classList.add('modal-open')
  }

  const releaseScroll = () => {
    if (!scrollHeld) return
    scrollHeld = false
    document.documentElement.classList.remove('modal-open')
    unlockScroll()
  }

  const apply = (nextIndex: number) => {
    index = (nextIndex + slides.length) % slides.length
    const slide = slides[index]
    img.src = slide.src
    img.alt = slide.caption
    if (caption) caption.textContent = slide.caption
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`
  }

  const cleanupCloseAnimation = () => {
    if (closeTimer != null) {
      window.clearTimeout(closeTimer)
      closeTimer = null
    }
    if (onCloseTransitionEnd) {
      modal.removeEventListener('transitionend', onCloseTransitionEnd)
      onCloseTransitionEnd = null
    }
  }

  const open = (nextIndex: number, tile: HTMLButtonElement) => {
    cleanupCloseAnimation()
    closeGeneration += 1
    closing = false
    lastTile = tile
    apply(nextIndex)
    modal.showModal()
    holdScroll()

    if (reduceMotion) {
      modal.classList.add('is-open')
    } else {
      requestAnimationFrame(() => modal.classList.add('is-open'))
    }

    window.setTimeout(() => closeBtn?.focus({ preventScroll: true }), 40)
  }

  const close = () => {
    if (!modal.open || closing) return
    closing = true
    cleanupCloseAnimation()
    releaseScroll()

    const restore = () => {
      lastTile?.focus({ preventScroll: true })
    }

    if (reduceMotion) {
      modal.classList.remove('is-open')
      modal.close()
      closing = false
      restore()
      return
    }

    modal.classList.remove('is-open')
    const gen = ++closeGeneration

    const finish = () => {
      cleanupCloseAnimation()
      if (!closing || gen !== closeGeneration || !modal.open) {
        closing = false
        return
      }
      modal.close()
      closing = false
      restore()
    }

    onCloseTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== modal || event.propertyName !== 'opacity') return
      finish()
    }

    modal.addEventListener('transitionend', onCloseTransitionEnd)
    closeTimer = window.setTimeout(finish, 180)
  }

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', () => open(i, tile))
  })

  prev?.addEventListener('click', (event) => {
    event.stopPropagation()
    apply(index - 1)
  })
  next?.addEventListener('click', (event) => {
    event.stopPropagation()
    apply(index + 1)
  })
  closeBtn?.addEventListener('click', (event) => {
    event.preventDefault()
    close()
  })

  modal.addEventListener('click', (event) => {
    if (event.target === modal) close()
  })

  modal.addEventListener('cancel', (event) => {
    event.preventDefault()
    close()
  })

  modal.addEventListener('close', () => {
    cleanupCloseAnimation()
    modal.classList.remove('is-open')
    releaseScroll()
    closing = false
  })

  modal.addEventListener('keydown', (event) => {
    if (!modal.open) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      apply(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      apply(index + 1)
    }
  })
}
