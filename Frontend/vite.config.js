import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import seo from './src/config/seo.js'

const ogImage = seo.ogImage
  ? `${seo.siteUrl}${seo.ogImage}`
  : `${seo.siteUrl}/favicon.svg`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-seo-config',
      transformIndexHtml(html) {
        return html
          .replace(/%SITE_URL%/g, seo.siteUrl)
          .replace(/%OG_IMAGE%/g, ogImage)
      },
    },
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    },
  },
})
