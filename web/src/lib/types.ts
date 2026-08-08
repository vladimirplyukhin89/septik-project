export type Problem = { title: string; text: string }
export type Service = {
  title: string
  summary: string
  priceFrom?: string
  features: string[]
  imageUrl?: string
}
export type Advantage = { title: string; text: string }
export type GalleryItem = { caption: string; imageUrl: string }
export type FaqItem = { question: string; answer: string }

export type SiteSettings = {
  brandName: string
  legalName: string
  phone: string
  phoneHref: string
  address: string
  /** Ссылка на карту (2ГИС), открывается в новой вкладке */
  addressMapUrl: string
  email?: string
  seoTitle: string
  seoDescription: string
  yandexMetrikaId?: string
}

export type HomePage = {
  heroEyebrow: string
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  heroPriceFrom: string
  heroTrust: string[]
  heroImageUrl?: string
  problemsTitle: string
  problems: Problem[]
  servicesTitle: string
  services: Service[]
  advantagesTitle: string
  advantages: Advantage[]
  packageTitle: string
  packageIntro: string
  packageItems: string[]
  packagePrice: string
  packageCta: string
  galleryTitle: string
  gallery: GalleryItem[]
  worksTitle: string
  works: GalleryItem[]
  trustTitle: string
  trustText: string
  faqTitle: string
  faqs: FaqItem[]
  formTitle: string
  formSubtitle: string
  seoTitle: string
  seoDescription: string
}

export type SiteContent = {
  settings: SiteSettings
  home: HomePage
}
