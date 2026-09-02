type AmoConfig = {
  subdomain: string
  clientId?: string
  clientSecret?: string
  redirectUri: string
  pipelineId?: number
  statusId?: number
  responsibleUserId?: number
  tag?: string
  unsorted: boolean
}

type TokenState = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

type AmoLeadInput = {
  name: string
  phone: string
  phonePretty: string
  message: string
  note: string
  ip: string
  page?: string
}

type AmoContact = {
  id?: number
  first_name?: string
  custom_fields_values?: Array<{
    field_code: string
    values: Array<{ value: string; enum_code?: string }>
  }>
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

let tokenState: TokenState | null = null
let refreshInFlight: Promise<void> | null = null

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
    clientId: import.meta.env.AMOCRM_CLIENT_ID?.trim() || undefined,
    clientSecret: import.meta.env.AMOCRM_CLIENT_SECRET?.trim() || undefined,
    redirectUri: import.meta.env.AMOCRM_REDIRECT_URI?.trim() || 'https://localhost',
    pipelineId: optionalPositiveInt(import.meta.env.AMOCRM_PIPELINE_ID),
    statusId,
    responsibleUserId: optionalPositiveInt(import.meta.env.AMOCRM_RESPONSIBLE_USER_ID),
    tag: import.meta.env.AMOCRM_TAG?.trim() || 'сайт',
    unsorted,
  }
}

function ensureTokenState(): TokenState | null {
  if (tokenState) return tokenState
  const accessToken = import.meta.env.AMOCRM_ACCESS_TOKEN?.trim()
  if (!accessToken) return null
  tokenState = {
    accessToken,
    refreshToken: import.meta.env.AMOCRM_REFRESH_TOKEN?.trim() || undefined,
    expiresAt: 0,
  }
  return tokenState
}

export function isAmoConfigured(): boolean {
  return readConfig() !== null
}

async function refreshTokens(config: AmoConfig): Promise<void> {
  const state = ensureTokenState()
  if (!state?.refreshToken || !config.clientId || !config.clientSecret) {
    throw new Error('amoCRM refresh is not configured')
  }

  const res = await fetch(`https://${config.subdomain}.amocrm.ru/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: state.refreshToken,
      redirect_uri: config.redirectUri,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    hint?: string
    title?: string
  }

  if (!res.ok || !body.access_token) {
    throw new Error(body.hint || body.title || `amoCRM oauth ${res.status}`)
  }

  tokenState = {
    accessToken: body.access_token,
    refreshToken: body.refresh_token || state.refreshToken,
    expiresAt: Date.now() + Math.max(60, (body.expires_in || 86400) - 120) * 1000,
  }
  console.info('[lead] amoCRM tokens refreshed')
}

async function getAccessToken(config: AmoConfig, forceRefresh = false): Promise<string> {
  const state = ensureTokenState()
  if (!state) throw new Error('amoCRM is not configured')

  const expired = state.expiresAt > 0 && Date.now() >= state.expiresAt
  if (!forceRefresh && !expired) return state.accessToken

  const canRefresh = Boolean(state.refreshToken && config.clientId && config.clientSecret)
  if (!canRefresh) {
    if (forceRefresh) throw new Error('amoCRM refresh is not configured')
    return state.accessToken
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshTokens(config).finally(() => {
      refreshInFlight = null
    })
  }
  await refreshInFlight
  return tokenState?.accessToken || state.accessToken
}

async function amoFetch(
  config: AmoConfig,
  path: string,
  init: RequestInit = {},
  retried = false
): Promise<Response> {
  const token = await getAccessToken(config, retried)
  const res = await fetch(`https://${config.subdomain}.amocrm.ru${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: init.signal ?? AbortSignal.timeout(10_000),
  })

  if (res.status === 401 && !retried && tokenState?.refreshToken) {
    await getAccessToken(config, true)
    return amoFetch(config, path, init, true)
  }

  return res
}

async function readError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const json = JSON.parse(text) as { title?: string; detail?: string; hint?: string }
    return json.detail || json.hint || json.title || text || `HTTP ${res.status}`
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

function buildLead(config: AmoConfig, input: AmoLeadInput, contact: AmoContact): AmoComplexLead {
  const lead: AmoComplexLead = {
    name: `Заявка с сайта — ${input.name}`,
    created_by: 0,
    _embedded: {
      contacts: [contact],
    },
  }

  if (config.pipelineId) lead.pipeline_id = config.pipelineId
  if (config.statusId && !config.unsorted) lead.status_id = config.statusId
  if (config.responsibleUserId) lead.responsible_user_id = config.responsibleUserId
  if (config.tag) lead._embedded.tags = [{ name: config.tag }]

  if (config.unsorted) {
    lead._embedded.metadata = {
      category: 'forms',
      form_id: 1,
      form_name: 'Форма на сайте',
      form_page: input.page || 'https://мойсептик72.рф',
      form_sent_at: Math.floor(Date.now() / 1000),
      ip: input.ip,
    }
  }

  return lead
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

export async function createAmoLead(input: AmoLeadInput): Promise<void> {
  const config = readConfig()
  if (!config) return

  const existingId = await findContactId(config, input.phone)
  const contact: AmoContact = existingId
    ? { id: existingId }
    : {
        first_name: input.name,
        custom_fields_values: [
          {
            field_code: 'PHONE',
            values: [{ value: input.phonePretty, enum_code: 'WORK' }],
          },
        ],
      }

  const payload = [buildLead(config, input, contact)]
  const res = await amoFetch(config, '/api/v4/leads/complex', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await readError(res))
  }

  const created = (await res.json().catch(() => null)) as Array<{ id?: number }> | null
  const leadId = created?.[0]?.id
  if (typeof leadId === 'number' && input.note) {
    await addNote(config, leadId, input.note)
  }
}
