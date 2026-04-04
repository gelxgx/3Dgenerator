import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  theme: {
    colors: {
      'primary': '#6C5CE7',
      'primary-light': '#A29BFE',
      'primary-dark': '#5541D1',
      'accent': '#00CEC9',
      'accent-light': '#55EFC4',
      'dark': '#0A0A0F',
      'dark-surface': '#12121A',
      'dark-surface-alt': '#1A1A2E',
      'dark-surface-hover': '#252540',
      'text': '#E8E8F0',
      'text-secondary': '#9494B8',
      'text-tertiary': '#5C5C7A',
      'border': 'rgba(108, 92, 231, 0.15)',
      'border-light': 'rgba(108, 92, 231, 0.3)',
      'success': '#00B894',
      'error': '#FF6B6B',
      'warning': '#FDCB6E',
    },
    animation: {
      keyframes: {
        'float': '{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}',
        'glow-pulse': '{0%,100%{opacity:0.4}50%{opacity:1}}',
        'slide-up': '{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}',
        'fade-in': '{from{opacity:0}to{opacity:1}}',
        'shimmer': '{0%{background-position:-200% 0}100%{background-position:200% 0}}',
      },
      durations: {
        'float': '6s',
        'glow-pulse': '3s',
        'slide-up': '0.6s',
        'fade-in': '0.4s',
        'shimmer': '3s',
      },
      timingFns: {
        'float': 'ease-in-out',
        'glow-pulse': 'ease-in-out',
        'slide-up': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'ease-out',
        'shimmer': 'linear',
      },
      counts: {
        'float': 'infinite',
        'glow-pulse': 'infinite',
        'shimmer': 'infinite',
      },
    },
  },

  shortcuts: {
    // Layout
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // Glassmorphism surfaces
    'glass': 'bg-dark-surface-alt/60 backdrop-blur-xl border border-border rounded-xl',
    'glass-strong': 'bg-dark-surface/80 backdrop-blur-2xl border border-border-light rounded-xl',
    'glass-card': 'bg-dark-surface-alt/40 backdrop-blur-lg border border-border rounded-2xl hover:border-border-light transition-all duration-300',
    'glass-panel': 'bg-dark-surface/70 backdrop-blur-xl border border-border rounded-xl p-5',

    // Gradient text
    'text-gradient': 'bg-clip-text text-transparent bg-gradient-to-r from-primary-light via-primary to-accent',
    'text-gradient-alt': 'bg-clip-text text-transparent bg-gradient-to-r from-accent-light to-accent',

    // Gradient backgrounds
    'bg-gradient-hero': 'bg-gradient-to-b from-primary/8 via-dark to-dark',
    'bg-gradient-radial': 'bg-[radial-gradient(ellipse_at_center,_var(--un-gradient-stops))]',

    // Modern buttons
    'btn-primary': 'px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer',
    'btn-ghost': 'px-4 py-2 text-text-secondary hover:text-text hover:bg-dark-surface-hover rounded-lg transition-all duration-200 cursor-pointer border border-transparent',
    'btn-outline': 'px-5 py-2.5 border border-border-light text-text hover:bg-primary/10 hover:border-primary rounded-lg transition-all duration-300 cursor-pointer',
    'btn-icon': 'w-9 h-9 flex-center rounded-lg hover:bg-dark-surface-hover transition-all duration-200 cursor-pointer',
    'btn-glow': 'px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-600 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer',

    // Input
    'input-dark': 'bg-dark-surface-alt/60 backdrop-blur-sm border border-border text-text placeholder-text-tertiary rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200',

    // Dark backgrounds
    'bg-dark-base': 'bg-dark',
    'bg-dark-alt': 'bg-dark-surface',

    // Glow effects
    'glow-primary': 'shadow-lg shadow-primary/20',
    'glow-accent': 'shadow-lg shadow-accent/20',

    // Legacy compatibility
    'surface-base': 'bg-dark-surface text-text border border-border',
    'card-dark': 'glass-card',
    'panel-dark': 'glass-panel',
  },
})
