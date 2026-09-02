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
  readonly AMOCRM_SUBDOMAIN?: string
  readonly AMOCRM_CLIENT_ID?: string
  readonly AMOCRM_CLIENT_SECRET?: string
  readonly AMOCRM_REDIRECT_URI?: string
  readonly AMOCRM_ACCESS_TOKEN?: string
  readonly AMOCRM_REFRESH_TOKEN?: string
  readonly AMOCRM_PIPELINE_ID?: string
  readonly AMOCRM_STATUS_ID?: string
  readonly AMOCRM_RESPONSIBLE_USER_ID?: string
  readonly AMOCRM_TAG?: string
  readonly AMOCRM_MODE?: string
}

interface Window {
  ym?: (...args: unknown[]) => void
}
