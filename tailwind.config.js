/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#FF7A00',
          50: '#FFF5EB',
          100: '#FFEBD6',
          200: '#FFD7AD',
          300: '#FFC285',
          400: '#FFAE5C',
          500: '#FF7A00',
          600: '#CC6200',
          700: '#994900',
          800: '#663100',
          900: '#331800',
        },
        forest: {
          DEFAULT: '#008C45',
          50: '#E8F5EE',
          100: '#D1EBDE',
          200: '#A3D7BD',
          300: '#75C39C',
          400: '#47AF7B',
          500: '#008C45',
          600: '#007038',
          700: '#00542A',
          800: '#00381C',
          900: '#001C0E',
        },
        ink: '#15201A',
        cloud: '#F6F8F7',
      },
      boxShadow: {
        card: '0 10px 30px rgba(21, 32, 26, 0.07)',
        'card-hover': '0 14px 40px rgba(21, 32, 26, 0.11)',
        float: '0 18px 50px rgba(21, 32, 26, 0.12)',
        'float-hover': '0 24px 60px rgba(21, 32, 26, 0.16)',
        sidebar: '4px 0 20px rgba(21, 32, 26, 0.04)',
        topbar: '0 1px 0 rgba(0, 0, 0, 0.04)',
        drawer: '-8px 0 40px rgba(21, 32, 26, 0.10)',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'skeleton': 'skeleton-pulse 1.4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
