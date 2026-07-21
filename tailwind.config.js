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
        // Échelle neutre de marque (froide/bleutée, accordée à navy/orange) —
        // pour le site habitant. Distincte des gris de l'admin.
        brand: {
          bg: '#F4F7FC', // fond de page très clair
          surface: '#FFFFFF', // cartes / surfaces
          border: '#E3E9F2', // séparateurs discrets
          muted: '#5B6B85', // texte secondaire (plus doux que gray)
          navyLight: '#1B3B78', // dégradés / survols du navy
          navyDark: '#0A1E44', // dégradés profonds
        },
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
      boxShadow: {
        // Ombres douces réutilisables pour le site habitant.
        soft: '0 1px 2px rgba(15, 42, 94, 0.04), 0 4px 12px rgba(15, 42, 94, 0.06)',
        card: '0 1px 3px rgba(15, 42, 94, 0.06), 0 10px 28px rgba(15, 42, 94, 0.08)',
      },
    },
  },
  plugins: [],
};
