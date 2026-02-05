/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        custom: '#414651',
        secondary: '#181D27',
        lightGray: '#535862',
        cloudGray: '#E9EAEB',
        charcoal: '#414651',
        stormGray: '#717680',
        brand: {
          solid: '#414651',
          solid_hover: '#252B37',
        },
        error: {
          solid: '#EF4444',
          primary: '#B91C1C',
          rose: '#FEF3F2',
        },
        disabled: {
          subtle: '#D5D7DA',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      spacing: {
        0.5: '0.125rem',
        4.5: '1.125rem',
        7: '1.75rem',
      },
      borderRadius: {
        7: '0.4375rem', // for your before:rounded-[7px]
      },
      transitionDuration: {
        100: '100ms',
      },
      transitionTimingFunction: {
        linear: 'linear',
      },
    },
  },
  plugins: [],
}
