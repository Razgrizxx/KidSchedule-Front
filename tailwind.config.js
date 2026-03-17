/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfd',
          100: '#ccf5f5',
          200: '#99eded',
          300: '#5de0e0',
          400: '#66CCCC',
          500: '#4DB8B8',
          600: '#3a9a9a',
          700: '#2e7b7b',
          800: '#266060',
          900: '#1f4d4d',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
