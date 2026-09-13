/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom accent colors only - use standard Tailwind for primary colors
        accent: {
          gold: '#F1C40F',
        },
        // Brand tokens referenced throughout the app (Header, Footer, cards, grids).
        // These were used across components but never defined, so they silently
        // rendered as unstyled text/backgrounds.
        primary: {
          teal: '#0d9488',
          orange: '#f97316',
        },
        secondary: {
          gray: '#6b7280',
          'dark-gray': '#1f2937',
          'light-gray': '#f8fafc',
        },
      },
      fontSize: {
        logo: '28px',
        h1: '36px',
        h2: '24px',
      },
      spacing: {
        'card-gap': '16px',
        'section-x': '40px',
      },
      borderRadius: {
        hero: '40px',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #26D0CE 0%, #16A085 30%, #F78F84 70%, #E74C3C 100%)',
      },
    },
  },
  plugins: [],
}
