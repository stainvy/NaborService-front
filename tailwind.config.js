/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Nabor Services (CLAUDE.md section 7)
        navy: '#0F2A5E', // primaire — headers, boutons secondaires
        orange: '#F7931E', // accent — CTA principaux, badges
        success: '#3DBD77', // confirmations, statuts validés
        error: '#E8534A', // erreurs, modération
        gray: '#8C8C8C', // textes secondaires, placeholders
      },
    },
  },
  plugins: [],
};
