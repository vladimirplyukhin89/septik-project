type HitLog = number[]

const hitsByKey = new Map<string, HitLog>()

const WINDOW_MS = 10 * 60 * 1000
const MAX_KEYS = 4000

function maxHits(): number {
  return import.meta.env.DEV ? 50 : 5
}

function prune(now: number) {
  for (const [key, hits] of hitsByKey) {
    const next = hits.filter((t) => now - t < WINDOW_MS)
    if (next.length === 0) hitsByKey.delete(key)
    else hitsByKey.set(key, next)
  }

  if (hitsByKey.size <= MAX_KEYS) return
  const overflow = hitsByKey.size - MAX_KEYS
  const keys = hitsByKey.keys()
  for (let i = 0; i < overflow; i += 1) {
    const key = keys.next().value
    if (key === undefined) break
    hitsByKey.delete(key)
  }
}

export function consumeRateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  if (hitsByKey.size > MAX_KEYS / 2) prune(now)

  const hits = (hitsByKey.get(key) || []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= maxHits()) {
    const retryAfterSec = Math.max(1, Math.ceil((hits[0]! + WINDOW_MS - now) / 1000))
    return { ok: false, retryAfterSec }
  }

  hits.push(now)
  hitsByKey.set(key, hits)
  return { ok: true }
}

export function clientIp(request: Request): string {
  const header =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')
  if (!header) return 'unknown'
  return header.split(',')[0]!.trim() || 'unknown'
}
