import {defineField, defineType} from 'sanity'

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({name: 'question', title: 'Вопрос', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'answer', title: 'Ответ', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'order', title: 'Порядок', type: 'number'}),
  ],
  preview: {
    select: {title: 'question'},
  },
})
