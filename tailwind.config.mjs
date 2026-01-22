/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'midnight': {
          DEFAULT: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
