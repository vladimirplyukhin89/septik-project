let locks = 0

function scrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

export function lockScroll() {
  if (locks === 0) {
    document.documentElement.style.setProperty('--scrollbar-gutter', `${scrollbarWidth()}px`)
  }
  locks += 1
}

export function unlockScroll() {
  if (locks === 0) return
  locks -= 1
  if (locks > 0) return
  document.documentElement.style.removeProperty('--scrollbar-gutter')
}
