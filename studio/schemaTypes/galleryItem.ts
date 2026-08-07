import {defineField, defineType} from 'sanity'

export const galleryItem = defineType({
  name: 'galleryItem',
  title: 'Фото галереи',
  type: 'document',
  fields: [
    defineField({name: 'caption', title: 'Подпись', type: 'string'}),
    defineField({name: 'image', title: 'Фото', type: 'image', options: {hotspot: true}, validation: (r) => r.required()}),
    defineField({name: 'order', title: 'Порядок', type: 'number'}),
  ],
  preview: {
    select: {title: 'caption', media: 'image'},
  },
})
