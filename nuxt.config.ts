export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@tresjs/nuxt',
  ],

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
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  ssr: true,

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    apiKey3d: '',
    apiBase3d: 'https://api.tripo3d.ai',
  },

  i18n: {
    locales: [
      { code: 'zh-CN', language: 'zh-CN', file: 'zh-CN.json' },
      { code: 'en', language: 'en-US', file: 'en.json' },
    ],
    defaultLocale: 'zh-CN',
    strategy: 'no_prefix',
  },

  vite: {
    optimizeDeps: {
      include: [
        'three',
        'three/examples/jsm/loaders/GLTFLoader.js',
        'three/examples/jsm/libs/meshopt_decoder.module.js',
      ],
    },
  },

  devtools: {
    enabled: true,
  },

  compatibilityDate: '2025-04-06',
})
