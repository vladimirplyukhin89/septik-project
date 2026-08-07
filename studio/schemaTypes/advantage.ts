import {defineField, defineType} from 'sanity'

export const advantage = defineType({
  name: 'advantage',
  title: 'Преимущество',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заголовок', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
    defineField({name: 'order', title: 'Порядок', type: 'number'}),
  ],
  orderings: [{title: 'Порядок', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
})
