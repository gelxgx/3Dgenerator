import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  ignores: [
    'node_modules',
    '.nuxt',
    '.output',
    'dist',
    '*.min.js',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'vue/multi-word-component-names': 'off',
  },
})
