import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c7c4ff',
          300: '#a59eff',
          400: '#8b7dff',
          500: '#6C63FF',
          600: '#5a4ee6',
          700: '#4a3dbf',
          800: '#3d3499',
          900: '#352f7a',
        },
        accent: {
          50: '#fff0f3',
          100: '#ffe0e6',
          200: '#ffc7d3',
          300: '#ffa3b5',
          400: '#ff7a95',
          500: '#FF6B8A',
          600: '#e64d6d',
          700: '#bf3353',
          800: '#992d47',
          900: '#7a2a40',
        },
      },
    },
  },
  plugins: [],
}
export default config
