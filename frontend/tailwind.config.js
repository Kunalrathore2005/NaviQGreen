/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060D17',
          900: '#0B192C',
          850: '#0E213A',
          800: '#112239',
          750: '#162C4A',
          700: '#1E3A5F',
          600: '#264B78',
        },
        ocean: {
          500: '#0284C7',
          400: '#38BDF8',
          300: '#7DD3FC',
        },
        cyan: {
          glow: '#00F0FF',
          brand: '#00B4D8',
          deep: '#0077B6',
        },
        emerald: {
          eco: '#10B981',
          leaf: '#059669',
          glow: '#06D6A0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 180, 216, 0.3)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}

