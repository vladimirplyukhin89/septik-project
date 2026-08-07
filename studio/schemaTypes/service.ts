import {defineField, defineType} from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Услуга / продукт',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Название', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'summary', title: 'Кратко', type: 'text', rows: 3}),
    defineField({name: 'priceFrom', title: 'Цена от', type: 'string'}),
    defineField({name: 'features', title: 'Характеристики', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'image', title: 'Фото', type: 'image', options: {hotspot: true}}),
    defineField({name: 'order', title: 'Порядок', type: 'number'}),
  ],
  orderings: [{title: 'Порядок', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'priceFrom', media: 'image'},
  },
})
