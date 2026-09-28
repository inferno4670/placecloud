/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfd',
          300: '#7cc2fb',
          400: '#36a2f7',
          500: '#0c84eb',
          600: '#0267c8',
          700: '#0352a2',
          800: '#074685',
          900: '#0c3b6f',
        }
      }
    },
  },
  plugins: [],
}
