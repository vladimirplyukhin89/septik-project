import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Настройки сайта',
  type: 'document',
  fields: [
    defineField({name: 'brandName', title: 'Бренд', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'legalName', title: 'Юр. название', type: 'string'}),
    defineField({name: 'phone', title: 'Телефон', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'phoneHref', title: 'Телефон для ссылки (tel:)', type: 'string'}),
    defineField({name: 'address', title: 'Адрес', type: 'string'}),
    defineField({
      name: 'addressMapUrl',
      title: 'Ссылка на 2ГИС',
      type: 'url',
      description: 'Открывается в новой вкладке при клике на адрес',
    }),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'seoTitle', title: 'SEO title (по умолчанию)', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3}),
    defineField({name: 'ogImage', title: 'OG изображение', type: 'image', options: {hotspot: true}}),
    defineField({name: 'yandexMetrikaId', title: 'ID Яндекс.Метрики', type: 'string'}),
  ],
})
