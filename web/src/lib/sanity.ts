import { createClient, type SanityClient } from '@sanity/client'
import { fallbackContent } from '../content/fallback'
import type { SiteContent } from './types'

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || import.meta.env.SANITY_PROJECT_ID
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || import.meta.env.SANITY_DATASET || 'production'
const apiVersion = '2025-01-01'

function getClient(): SanityClient | null {
  if (!projectId || projectId === 'your-project-id') return null
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
  })
}

const homeQuery = `{
  "settings": *[_id == "siteSettings"][0]{
    brandName, legalName, phone, phoneHref, address, addressMapUrl, email,
    seoTitle, seoDescription, yandexMetrikaId
  },
  "home": *[_id == "homePage"][0]{
    heroEyebrow, heroTitle, heroSubtitle, heroCta, heroPriceFrom, heroTrust,
    "heroImageUrl": heroImage.asset->url,
    problemsTitle, problems,
    servicesTitle,
    "services": services[]->{
      title, summary, priceFrom, features,
      "imageUrl": image.asset->url
    },
    advantagesTitle,
    "advantages": advantages[]->{ title, text },
    packageTitle, packageIntro, packageItems, packagePrice, packageCta,
    galleryTitle,
    "gallery": gallery[]->{
      caption,
      "imageUrl": image.asset->url
    },
    trustTitle, trustText,
    faqTitle,
    "faqs": faqs[]->{ question, answer },
    formTitle, formSubtitle,
    seoTitle, seoDescription
  }
}`

function mergeContent(remote: Partial<SiteContent> | null): SiteContent {
  if (!remote?.settings || !remote?.home) return fallbackContent
  return {
    settings: {
      ...fallbackContent.settings,
      ...remote.settings,
      addressMapUrl: remote.settings.addressMapUrl || fallbackContent.settings.addressMapUrl,
    },
    home: {
      ...fallbackContent.home,
      ...remote.home,
      problems: remote.home.problems?.length ? remote.home.problems : fallbackContent.home.problems,
      services: remote.home.services?.length ? remote.home.services : fallbackContent.home.services,
      advantages: remote.home.advantages?.length
        ? remote.home.advantages
        : fallbackContent.home.advantages,
      gallery: remote.home.gallery?.length ? remote.home.gallery : fallbackContent.home.gallery,
      faqs: remote.home.faqs?.length ? remote.home.faqs : fallbackContent.home.faqs,
      packageItems: remote.home.packageItems?.length
        ? remote.home.packageItems
        : fallbackContent.home.packageItems,
      heroTrust: remote.home.heroTrust?.length ? remote.home.heroTrust : fallbackContent.home.heroTrust,
    },
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  const client = getClient()
  if (!client) return fallbackContent
  try {
    const data = await client.fetch(homeQuery)
    return mergeContent(data)
  } catch (error) {
    console.warn('[sanity] fallback to local content', error)
    return fallbackContent
  }
}

export function isSanityConfigured(): boolean {
  return Boolean(projectId && projectId !== 'your-project-id')
}
