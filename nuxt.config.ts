export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@tresjs/nuxt',
  ],

  // Shim unhead v1 API (getActiveHead) for @nuxtjs/i18n v8.x compatibility with unhead v2
  vite: {
    plugins: [
      {
        name: 'unhead-compat-shim',
        transform(code: string, id: string) {
          // Only patch the i18n composables file that imports getActiveHead
          if (id.includes('@nuxtjs/i18n') && code.includes('getActiveHead')) {
            return code
              .replace(
                `import { getActiveHead } from "unhead"`,
                `import { injectHead as __injectHead } from "@unhead/vue"\nfunction getActiveHead() { try { return __injectHead() } catch { return null } }`,
              )
          }
        },
      },
    ],
  },

  app: {
    head: {
      title: '3DGenerator - AI 3D Model Generation',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI-powered 3D model generation workbench' },
        { name: 'theme-color', content: '#0A0A0F' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  ssr: true,

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    tripoApiKey: '',
    tripoApiBase: 'https://api.tripo3d.ai',
  },

  i18n: {
    locales: [
      { code: 'zh-CN', language: 'zh-CN', file: 'zh-CN.json' },
      { code: 'en', language: 'en-US', file: 'en.json' },
    ],
    defaultLocale: 'zh-CN',
    strategy: 'no_prefix',
    langDir: 'locales/',
    lazy: true,
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2024-12-01',
})
