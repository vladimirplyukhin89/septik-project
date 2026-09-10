import { createAmoLead, isAmoConfigured } from '../../lib/amocrm'

export const prerender = false



function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Переносим очистку телефона прямо сюда, чтобы не зависеть от внешних файлов
function cleanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`
  return digits
}

function formatPhone(digits: string): string {
  if (digits.length !== 11 || !digits.startsWith('7')) return digits
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
}

export async function POST({ request }: { request: Request }) {
  try {
    console.log('=== [ИЗОЛИРОВАННЫЙ ТЕСТ] ЗАПРОС УСПЕШНО ДОШЕЛ ДО ОБРАБОТЧИКА ===');

    const body = await request.json().catch(() => null)
    console.log('ТЕЛО ЗАПРОСА ВНУТРИ СЕРВЕРА:', body);

    if (!body || typeof body !== 'object') {
      return json(400, { error: 'Некорректные данные формы' })
    }

    const name = String(body.name || '').trim()
    const phone = String(body.phone || '').trim()
    const message = String(body.message || '').trim()

    if (!name || !phone) {
      return json(400, { error: 'Имя и телефон обязательны для заполнения' })
    }

    const digits = cleanPhone(phone)
    const phonePretty = formatPhone(digits)
    const safeName = name.replace(/\s+/g, ' ')

    const text = [
      'Новая заявка — ООО «АРМАДА»',
      `Имя: ${safeName}`,
      `Телефон: ${phonePretty}`,
      message ? `Комментарий: ${message}` : null,
      `Time: ${new Date().toLocaleTimeString()}`
    ].filter(Boolean).join('\n')

    if (!isAmoConfigured()) {
      console.log('amoCRM не настроена в .env');
      return json(200, { ok: true, demo: true })
    }

    console.log('Передаем данные в функцию интеграции amoCRM...');
    await createAmoLead({
      name: safeName,
      phone: digits,
      phonePretty,
      message,
      note: text,
      ip: '127.0.0.1',
      page: request.headers.get('referer') || undefined,
    })

    console.log('=== СДЕЛКА УСПЕШНО СОЗДАНА С САЙТА! ===');
    return json(200, { ok: true })

  } catch (error) {  
    console.error('КРИТИЧЕСКАЯ ОШИБКА ОБРАБОТЧИКА:', error)
    const msg = error instanceof Error ? error.message : 'Ошибка сервера'
    return json(502, { error: msg })
  }
}
