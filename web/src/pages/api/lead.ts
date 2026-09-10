import { createAmoLead, isAmoConfigured } from '../../lib/amocrm'
import {
  formatPhoneDisplay,
  hasLeadErrors,
  normalizePhoneDigits,
  validateLead,
} from '../../lib/leadValidation'
import { clientIp, consumeRateLimit } from '../../lib/rateLimit'

export const prerender = false

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

function json(status: number, body: Record<string, unknown>, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function isHoneypotFilled(value: unknown): boolean {
  return String(value || '').trim().length > 0
}

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false

  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!tgRes.ok) {
    console.error('[lead] telegram failed', await tgRes.text())
    return false
  }

  return true
}

export async function POST({ request }: { request: Request }) {
  try {
    const ip = clientIp(request)
    const ipLimit = consumeRateLimit(`ip:${ip}`)
    if (!ipLimit.ok) {
      return json(
        429,
        { error: 'Слишком много заявок. Попробуйте через несколько минут.' },
        { 'Retry-After': String(ipLimit.retryAfterSec) }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json(400, { error: 'Некорректные данные формы' })
    }

    if (isHoneypotFilled((body as { website?: unknown }).website)) {
      return json(200, { ok: true })
    }

    const name = String((body as { name?: unknown }).name || '').trim()
    const phone = String((body as { phone?: unknown }).phone || '').trim()
    const message = String((body as { message?: unknown }).message || '').trim()

    const errors = validateLead({ name, phone, message })
    if (hasLeadErrors(errors)) {
      return json(400, {
        error: errors.name || errors.phone || errors.message || 'Проверьте поля формы',
        fields: errors,
      })
    }

    const digits = normalizePhoneDigits(phone)
    const phoneLimit = consumeRateLimit(`phone:${digits}`)
    if (!phoneLimit.ok) {
      return json(
        429,
        { error: 'Слишком много заявок. Попробуйте через несколько минут.' },
        { 'Retry-After': String(phoneLimit.retryAfterSec) }
      )
    }

    const phonePretty = formatPhoneDisplay(digits)
    const safeName = name.replace(/\s+/g, ' ')
    const text = [
      'Новая заявка — ООО «АРМАДА»',
      `Имя: ${safeName}`,
      `Телефон: ${phonePretty}`,
      message ? `Комментарий: ${message}` : null,
      `Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' })}`,
    ]
      .filter(Boolean)
      .join('\n')

    const amoEnabled = isAmoConfigured()
    const telegramEnabled = Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)

    const [amoResult, telegramResult] = await Promise.allSettled([
      amoEnabled
        ? createAmoLead({
            name: safeName,
            phone: digits,
            phonePretty,
            message,
            note: text,
            ip,
            page: request.headers.get('referer') || undefined,
          })
        : Promise.resolve(),
      telegramEnabled ? sendTelegram(text) : Promise.resolve(false),
    ])

    if (amoResult.status === 'rejected') {
      console.error('[lead] amoCRM failed', amoResult.reason)
    }

    const amoOk = amoEnabled && amoResult.status === 'fulfilled'
    const telegramOk = telegramEnabled && telegramResult.status === 'fulfilled' && telegramResult.value === true

    if (!amoEnabled && !telegramEnabled) {
      console.info('[lead] demo mode (no Telegram / amoCRM credentials)\n', text)
      return json(200, { ok: true })
    }

    if (!amoOk && !telegramOk) {
      return json(502, { error: 'Сервис заявок временно недоступен' })
    }

    return json(200, { ok: true })
  } catch (error) {
    console.error('[lead]', error)
    return json(500, { error: 'Ошибка сервера' })
  }
}
