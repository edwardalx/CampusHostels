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
