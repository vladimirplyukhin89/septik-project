// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
  site: 'https://xn--72-mlcmdikqlsn.xn--p1ai',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
