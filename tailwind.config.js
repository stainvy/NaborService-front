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
        // Palette back-office admin — délibérément distincte du reste du site
        admin: {
          sidebar: '#0F172A',
          sidebarHover: '#1E293B',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1E293B',
          textInverse: '#E2E8F0',
          muted: '#64748B',
          accent: '#6366F1',
          accentHover: '#4F46E5',
        },
      },
    },
  },
  plugins: [],
};
