import {
  formatPhoneDisplay,
  hasLeadErrors,
  normalizePhoneDigits,
  validateLead,
  validateMessage,
  validateName,
  validatePhone,
} from '../../lib/leadValidation'

export const prerender = false

const TELEGRAM_BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID
const LEAD_EMAIL_TO = import.meta.env.LEAD_EMAIL_TO

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const phone = String(body.phone || '').trim()
    const message = String(body.message || '').trim()

    const errors = validateLead({ name, phone, message })
    if (hasLeadErrors(errors)) {
      return new Response(
        JSON.stringify({
          error: errors.name || errors.phone || errors.message || 'Проверьте поля формы',
          fields: errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // explicit re-check for clarity / future hooks
    if (validateName(name) || validatePhone(phone) || validateMessage(message)) {
      return new Response(JSON.stringify({ error: 'Проверьте поля формы' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const digits = normalizePhoneDigits(phone)
    const phonePretty = formatPhoneDisplay(digits)

    const text = [
      'Новая заявка — ООО «АРМАДА»',
      `Имя: ${name.replace(/\s+/g, ' ')}`,
      `Телефон: ${phonePretty}`,
      message ? `Комментарий: ${message}` : null,
      `Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' })}`,
    ]
      .filter(Boolean)
      .join('\n')

    let delivered = false

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
        }),
      })
      if (!tgRes.ok) {
        const errText = await tgRes.text()
        console.error('[lead] telegram failed', errText)
      } else {
        delivered = true
      }
    }

    if (LEAD_EMAIL_TO && !delivered) {
      console.info('[lead] email target configured, delivery via Telegram preferred', {
        to: LEAD_EMAIL_TO,
        text,
      })
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.info('[lead] demo mode (no Telegram credentials)\n', text)
      delivered = true
    }

    if (!delivered) {
      return new Response(JSON.stringify({ error: 'Сервис заявок временно недоступен' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[lead]', error)
    return new Response(JSON.stringify({ error: 'Ошибка сервера' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
