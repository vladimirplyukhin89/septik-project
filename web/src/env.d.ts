/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID?: string
  readonly PUBLIC_SANITY_DATASET?: string
  readonly PUBLIC_YANDEX_METRIKA_ID?: string
  readonly SANITY_PROJECT_ID?: string
  readonly SANITY_DATASET?: string
  readonly TELEGRAM_BOT_TOKEN?: string
  readonly TELEGRAM_CHAT_ID?: string
  readonly LEAD_EMAIL_TO?: string
}

interface Window {
  ym?: (...args: unknown[]) => void
}
