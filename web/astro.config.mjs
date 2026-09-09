// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  site: 'https://armada-septik.ru',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
