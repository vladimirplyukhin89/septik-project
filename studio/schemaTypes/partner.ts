import {defineField, defineType} from 'sanity'

export const partner = defineType({
  name: 'partner',
  title: 'Партнёр-производитель',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Название', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', title: 'Ключ (eurolos, eurobion, topol)', type: 'string'}),
    defineField({name: 'role', title: 'Роль (официальные представители / поставщик)', type: 'string'}),
    defineField({name: 'summary', title: 'Описание', type: 'text', rows: 3}),
    defineField({name: 'url', title: 'Ссылка на сайт производителя', type: 'url'}),
    defineField({name: 'featured', title: 'Крупная карточка', type: 'boolean', initialValue: false}),
    defineField({name: 'logo', title: 'Логотип', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'stats',
      title: 'Показатели масштаба',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'value', type: 'number', title: 'Число для анимации'},
            {name: 'prefix', type: 'string', title: 'Префикс'},
            {name: 'suffix', type: 'string', title: 'Суффикс'},
            {name: 'label', type: 'string', title: 'Подпись'},
            {name: 'fallback', type: 'string', title: 'Текст до анимации'},
          ],
          preview: {select: {title: 'label', subtitle: 'fallback'}},
        },
      ],
    }),
    defineField({name: 'tags', title: 'Линейки / акценты', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'order', title: 'Порядок', type: 'number'}),
  ],
  orderings: [{title: 'Порядок', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', subtitle: 'role', media: 'logo'},
  },
})
