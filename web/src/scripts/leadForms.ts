import { lockScroll, unlockScroll } from './scrollLock'
import {
  formatPhoneDisplay,
  hasLeadErrors,
  normalizePhoneDigits,
  validateLead,
  type LeadFieldErrors,
} from '../lib/leadValidation'

function setFieldError(form: HTMLFormElement, field: keyof LeadFieldErrors, message?: string) {
  const input = form.querySelector<HTMLElement>(`[data-field="${field}"]`)
  const error = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`)
  if (input) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false')
    input.classList.toggle('is-invalid', Boolean(message))
  }
  if (error) {
    error.textContent = message || ''
  }
}

function clearErrors(form: HTMLFormElement) {
  ;(['name', 'phone', 'message'] as const).forEach((field) => setFieldError(form, field))
  const formError = form.querySelector<HTMLElement>('[data-form-error]')
  if (formError) {
    formError.textContent = ''
    formError.classList.add('is-empty')
  }
}

function readPayload(form: HTMLFormElement) {
  const data = new FormData(form)
  return {
    name: String(data.get('name') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    message: String(data.get('message') || '').trim(),
  }
}

function bindPhoneMask(input: HTMLInputElement) {
  input.addEventListener('input', () => {
    let digits = input.value.replace(/\D/g, '')
    if (digits.startsWith('8')) digits = `7${digits.slice(1)}`
    if (digits && !digits.startsWith('7')) digits = `7${digits}`
    digits = digits.slice(0, 11)

    if (!digits) {
      input.value = ''
      return
    }

    let next = '+7'
    if (digits.length > 1) next += ` (${digits.slice(1, 4)}`
    if (digits.length >= 4) next += ')'
    if (digits.length > 4) next += ` ${digits.slice(4, 7)}`
    if (digits.length > 7) next += `-${digits.slice(7, 9)}`
    if (digits.length > 9) next += `-${digits.slice(9, 11)}`
    input.value = next
  })
}

async function submitLeadForm(form: HTMLFormElement) {
  const success = form.querySelector<HTMLElement>('[data-success]')
  const formError = form.querySelector<HTMLElement>('[data-form-error]')
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]')
  const endpoint = form.dataset.endpoint || '/api/lead'

  if (!submitBtn) return

  clearErrors(form)
  success?.classList.add('hidden')

  const payload = readPayload(form)
  const errors = validateLead(payload)

  if (hasLeadErrors(errors)) {
    setFieldError(form, 'name', errors.name)
    setFieldError(form, 'phone', errors.phone)
    setFieldError(form, 'message', errors.message)
    return
  }

  const digits = normalizePhoneDigits(payload.phone)

  submitBtn.disabled = true
  submitBtn.textContent = 'Отправка…'
  submitBtn.classList.add('is-loading')

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payload.name.replace(/\s+/g, ' '),
        phone: formatPhoneDisplay(digits),
        message: payload.message,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body.error || 'Не удалось отправить заявку')
    }
    form.reset()
    clearErrors(form)
    success?.classList.remove('hidden')
    const metrikaId = document.body.dataset.metrikaId
    if (metrikaId && typeof window.ym === 'function') {
      window.ym(Number(metrikaId), 'reachGoal', 'lead_submit')
    }
    form.dispatchEvent(new CustomEvent('lead:success', { bubbles: true }))
  } catch (err) {
    if (formError) {
      formError.textContent = err instanceof Error ? err.message : 'Ошибка отправки'
      formError.classList.remove('is-empty')
    }
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = 'Отправить заявку'
    submitBtn.classList.remove('is-loading')
  }
}

export function initLeadForms(root: ParentNode = document) {
  const forms = root.querySelectorAll<HTMLFormElement>('[data-lead-form]')
  forms.forEach((form) => {
    if (form.dataset.bound === '1') return
    form.dataset.bound = '1'

    const phoneInput = form.querySelector<HTMLInputElement>('[data-field="phone"]')
    if (phoneInput) bindPhoneMask(phoneInput)

    ;(['name', 'phone', 'message'] as const).forEach((field) => {
      const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-field="${field}"]`)
      input?.addEventListener('input', () => setFieldError(form, field))
      input?.addEventListener('blur', () => {
        const payload = readPayload(form)
        const errors = validateLead(payload)
        // Don't show name/phone required errors while empty on blur if user hasn't typed — still show format errors
        if (!payload[field] && field !== 'message') {
          setFieldError(form, field)
          return
        }
        setFieldError(form, field, errors[field])
      })
    })

    form.addEventListener('submit', (event) => {
      event.preventDefault()
      void submitLeadForm(form)
    })
  })
}

export function initLeadModal(root: ParentNode = document) {
  const modal = root.querySelector<HTMLDialogElement>('[data-lead-modal]')
  if (!modal) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const closeElements = modal.querySelectorAll('[data-close-lead-modal]')
  let closing = false
  let closeGeneration = 0
  let closeTimer: number | null = null
  let onCloseTransitionEnd: ((event: TransitionEvent) => void) | null = null
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

  const open = () => {
    // Invalidate any in-flight close animation so its finish cannot close a fresh open
    cleanupCloseAnimation()
    closeGeneration += 1
    closing = false
    modal.showModal()
    holdScroll()

    if (reduceMotion) {
      modal.classList.add('is-open')
    } else {
      requestAnimationFrame(() => modal.classList.add('is-open'))
    }

    const first = modal.querySelector<HTMLInputElement>('[data-field="name"]')
    window.setTimeout(() => first?.focus({ preventScroll: true }), 40)
  }

  const close = () => {
    if (!modal.open || closing) return
    closing = true
    cleanupCloseAnimation()
    releaseScroll()

    if (reduceMotion) {
      modal.classList.remove('is-open')
      modal.close()
      closing = false
      return
    }

    modal.classList.remove('is-open')

    const gen = ++closeGeneration

    const finish = () => {
      cleanupCloseAnimation()
      // Only complete an active close — ignore stale timeout/transitionend after reopen
      if (!closing || gen !== closeGeneration || !modal.open) {
        closing = false
        return
      }
      modal.close()
      closing = false
    }

    onCloseTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== modal || event.propertyName !== 'opacity') return
      finish()
    }

    modal.addEventListener('transitionend', onCloseTransitionEnd)
    closeTimer = window.setTimeout(finish, 180)
  }

  document.querySelectorAll('[data-open-lead-modal]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault()
      open()
    })
    el.addEventListener('keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) return
      event.preventDefault()
      open()
    })
  })

  closeElements.forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault()
      close()
    })
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

  modal.addEventListener('lead:success', () => {
    window.setTimeout(close, 1200)
  })
}
