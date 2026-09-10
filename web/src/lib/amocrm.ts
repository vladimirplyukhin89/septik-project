type AmoConfig = {
  subdomain: string
  accessToken: string
  pipelineId?: number
  statusId?: number
  responsibleUserId?: number
  tag?: string
  unsorted: boolean
}

type AmoLeadInput = {
  name: string
  phone: string
  phonePretty: string
  message?: string
  note?: string
  ip: string
  page?: string
}

type AmoCustomField = {
  field_code: string
  values: Array<{ value: string; enum_code?: string }>
}

type AmoContact = {
  id?: number
  first_name?: string
  custom_fields_values?: AmoCustomField[]
}

type AmoComplexLead = {
  name: string
  created_by: number
  pipeline_id?: number
  status_id?: number
  responsible_user_id?: number
  _embedded: {
    tags?: Array<{ name: string }>
    contacts: AmoContact[]
    metadata?: {
      category: 'forms'
      form_id: number
      form_name: string
      form_page: string
      form_sent_at: number
      ip: string
    }
  }
}

type AmoComplexResponse = {
  _embedded?: {
    leads?: Array<{ id: number }>
  }
}

function optionalPositiveInt(value?: string): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

function normalizeSubdomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\.amocrm\.ru.*$/i, '')
    .replace(/\/$/, '')
}

function readConfig(): AmoConfig | null {
  const rawSubdomain = import.meta.env.AMOCRM_SUBDOMAIN?.trim()
  const accessToken = import.meta.env.AMOCRM_ACCESS_TOKEN?.trim()
  if (!rawSubdomain || !accessToken) return null

  const statusId = optionalPositiveInt(import.meta.env.AMOCRM_STATUS_ID)
  const mode = import.meta.env.AMOCRM_MODE?.trim().toLowerCase()
  const unsorted = mode === 'unsorted' || (!mode && !statusId)

  return {
    subdomain: normalizeSubdomain(rawSubdomain),
    accessToken,
    pipelineId: optionalPositiveInt(import.meta.env.AMOCRM_PIPELINE_ID),
    statusId,
    responsibleUserId: optionalPositiveInt(import.meta.env.AMOCRM_RESPONSIBLE_USER_ID),
    tag: import.meta.env.AMOCRM_TAG?.trim() || 'сайт',
    unsorted,
  }
}

export function isAmoConfigured(): boolean {
  return readConfig() !== null
}

async function amoFetch(
  config: AmoConfig,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`https://${config.subdomain}.amocrm.ru${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: init.signal ?? AbortSignal.timeout(10_000),
  })
}

async function readError(res: Response): Promise<string> {
  if (res.status === 502) {
    try {
      const json = await res.json() as { error?: string }
      if (json?.error) return json.error
    } catch {
      return 'Сервис amoCRM временно недоступен (Ошибка 502 Bad Gateway)'
    }
  }

  const text = await res.text()
  try {
    const json = JSON.parse(text) as { title?: string; detail?: string; hint?: string; error?: string }
    return json.detail || json.hint || json.title || json.error || text || `HTTP ${res.status}`
  } catch {
    return text || `HTTP ${res.status}`
  }
}

async function findContactId(config: AmoConfig, phone: string): Promise<number | undefined> {
  const query = encodeURIComponent(`+${phone}`)
  const res = await amoFetch(config, `/api/v4/contacts?query=${query}&limit=5`)
  if (!res.ok) return undefined
  const data = (await res.json().catch(() => ({}))) as {
    _embedded?: { contacts?: Array<{ id?: number }> }
  }
  const id = data._embedded?.contacts?.[0]?.id
  return typeof id === 'number' ? id : undefined
}

async function addNote(config: AmoConfig, leadId: number, text: string) {
  const res = await amoFetch(config, `/api/v4/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify([
      {
        note_type: 'common',
        params: { text },
      },
    ]),
  })
  if (!res.ok) {
    console.error('[lead] amoCRM note failed', await readError(res))
  }
}

function buildLead(config: AmoConfig, input: AmoLeadInput, contact: AmoContact): AmoComplexLead {
  // Базовый объект строго по спецификации amoCRM
  const lead: any = {
    name: input.name === 'ping' ? 'Тестовая заявка (Ping)' : `Заявка с сайта — ${input.name}`,
    created_by: 0,
    _embedded: {
      contacts: [contact],
    },
  }

  // Записываем ID воронки и статуса ТОЛЬКО если они реально существуют как числа
  if (typeof config.pipelineId === 'number') lead.pipeline_id = config.pipelineId
  if (typeof config.statusId === 'number' && !config.unsorted) lead.status_id = config.statusId
  if (typeof config.responsibleUserId === 'number') lead.responsible_user_id = config.responsibleUserId
  
  if (config.tag) {
    lead._embedded.tags = [{ name: config.tag }]
  }

  if (config.unsorted) {
    lead._embedded.metadata = {
      category: 'forms',
      form_id: 1,
      form_name: 'Форма на сайте',
      form_page: input.page || 'https://armada-septik.ru',
      form_sent_at: Math.floor(Date.now() / 1000),
      ip: input.ip,
    }
  }

  return lead
}

export async function createAmoLead(input: AmoLeadInput): Promise<void> {
  const config = readConfig()
  if (!config) return

  let existingId: number | undefined
  try {
    existingId = await findContactId(config, input.phone)
  } catch (err) {
    console.error('[lead] amoCRM contact search error:', err)
  }

  const customFields: AmoCustomField[] = []

  // Безопасная проверка: передаем телефон только если есть непустая строка
  const targetPhone = input.phonePretty?.trim() || input.phone?.trim()
  if (targetPhone) {
    customFields.push({
      field_code: 'PHONE',
      values: [{ value: targetPhone, enum_code: 'WORK' }],
    })
  }

  const contact: AmoContact = existingId
    ? { id: existingId }
    : {
        first_name: input.name === 'ping' ? 'Тестовый Контакт' : input.name,
        // Если кастомных полей нет, свойство вообще не должно создаваться в JSON
        ...(customFields.length > 0 ? { custom_fields_values: customFields } : {}),
      }

  const leadPayload = buildLead(config, input, contact);
  console.log('ЭТО ТО, ЧТО ОТПРАВЛЯЕТ САЙТ В AMO:', JSON.stringify(leadPayload, null, 2));

  // Глубокая очистка JSON от свойств со значением `undefined` перед отправкой fetch
  const cleanPayload = JSON.parse(JSON.stringify([leadPayload]))
  console.log('ЭТО ТО, ЧТО ОТПРАВЛЯЕТ САЙТ В AMO:', JSON.stringify(cleanPayload, null, 2));

  const res = await amoFetch(config, '/api/v4/leads/complex', {
    method: 'POST',
    body: JSON.stringify(cleanPayload), // Отправляем идеально чистую структуру без скрытых undefined параметров
  })

  if (!res.ok) {
    throw new Error(await readError(res))
  }

  const created = (await res.json().catch(() => null)) as AmoComplexResponse | null
  const leadId = created?._embedded?.leads?.[0]?.id 

  if (typeof leadId === 'number') {
    const notesArray: string[] = []
    
    notesArray.push(`Источник: armada-septik.ru`)
    if (input.message?.trim()) notesArray.push(`Сообщение: ${input.message.trim()}`)
    if (input.note?.trim()) notesArray.push(`Примечание: ${input.note.trim()}`)

    if (notesArray.length > 0) {
      await addNote(config, leadId, notesArray.join('\n'))
    }
  }
}