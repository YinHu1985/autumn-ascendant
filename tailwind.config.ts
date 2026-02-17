import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'antique-white': '#f4f1ea',
        'antique-paper': '#e8dfc8',
        'antique-gold': '#c5a059',
        'antique-wood': '#5c4033',
        'antique-dark': '#2c1810',
        'antique-red': '#8a2c2c',
        'antique-green': '#4a6741',
      },
      fontFamily: {
        serif: ['"Times New Roman"', 'Times', 'serif'], // Ensure serif is prioritized
      }
    },
  },
  plugins: [],
} satisfies Config

