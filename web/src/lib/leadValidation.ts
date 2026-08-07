/** Клиентская и серверная валидация заявок */

const NAME_RE = /^[A-Za-zА-Яа-яЁё](?:[A-Za-zА-Яа-яЁё\s\-']{0,58}[A-Za-zА-Яа-яЁё])?$/

const BANNED_WORDS = [
  'война',
  'украина',
  'хуй',
  'хуйло',
  'хуйня',
  'хуета',
  'зеленский',
  'пизда',
] as const

export type LeadPayload = {
  name: string
  phone: string
  message: string
}

export type LeadFieldErrors = {
  name?: string
  phone?: string
  message?: string
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/ё/g, 'е')
}

export function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    digits = `7${digits}`
  }
  return digits
}

export function formatPhoneDisplay(digits: string): string {
  if (digits.length !== 11 || !digits.startsWith('7')) return digits
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
}

export function validateName(name: string): string | undefined {
  const value = name.trim().replace(/\s+/g, ' ')
  if (!value) return 'Укажите имя'
  if (value.length < 2) return 'Имя слишком короткое'
  if (value.length > 60) return 'Имя слишком длинное'
  if (/\d/.test(value)) return 'Имя не должно содержать цифры'
  if (!NAME_RE.test(value)) return 'Используйте буквы, пробел или дефис'
  return undefined
}

export function validatePhone(phone: string): string | undefined {
  const value = phone.trim()
  if (!value) return 'Укажите телефон'
  const digits = normalizePhoneDigits(value)
  if (digits.length !== 11 || !digits.startsWith('7')) {
    return 'Формат: +7 (9XX) XXX-XX-XX'
  }
  if (!/^9\d{9}$/.test(digits.slice(1))) {
    return 'Введите российский мобильный номер'
  }
  return undefined
}

export function validateMessage(message: string): string | undefined {
  const value = message.trim()
  if (!value) return undefined
  if (value.length > 1000) return 'Слишком длинный комментарий'
  const normalized = normalizeText(value)
  const hit = BANNED_WORDS.find((word) => normalized.includes(word))
  if (hit) return 'Уберите недопустимые слова из комментария'
  return undefined
}

export function validateLead(payload: LeadPayload): LeadFieldErrors {
  const errors: LeadFieldErrors = {}
  const nameError = validateName(payload.name)
  const phoneError = validatePhone(payload.phone)
  const messageError = validateMessage(payload.message)
  if (nameError) errors.name = nameError
  if (phoneError) errors.phone = phoneError
  if (messageError) errors.message = messageError
  return errors
}

export function hasLeadErrors(errors: LeadFieldErrors) {
  return Boolean(errors.name || errors.phone || errors.message)
}
