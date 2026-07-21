/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Accents de marque — fixes dans les deux thèmes (CLAUDE.md section 7)
        navy: '#0F2A5E', // primaire — headers, boutons secondaires
        orange: '#F7931E', // accent — CTA principaux, badges
        success: '#3DBD77', // confirmations, statuts validés
        error: '#E8534A', // erreurs, modération

        // Tokens sémantiques (basculent light/dark via variables CSS)
        bg: rgb('--bg'), // fond de page
        surface: rgb('--surface'), // cartes, entêtes, modales
        'surface-2': rgb('--surface-2'), // surface alternée / hovers
        border: rgb('--border'), // séparateurs
        fg: rgb('--fg'), // texte principal
        muted: rgb('--muted'), // texte secondaire, placeholders
        // `gray` (placeholders/bordures historiques) pointe sur --muted → bascule
        // sans migration des text-gray / border-gray existants.
        gray: rgb('--muted'),

        // Échelle de marque : bg/surface/border/muted pointent sur les tokens
        // sémantiques → les usages brand.* existants basculent automatiquement.
        brand: {
          bg: rgb('--bg'),
          surface: rgb('--surface'),
          border: rgb('--border'),
          muted: rgb('--muted'),
          navyLight: '#1B3B78', // dégradés / survols (accent fixe)
          navyDark: '#0A1E44', // dégradés profonds (accent fixe)
        },
        // Back-office : bascule aussi via variables --admin-*
        admin: {
          sidebar: '#0F172A',
          sidebarHover: '#1E293B',
          bg: rgb('--admin-bg'),
          surface: rgb('--admin-surface'),
          border: rgb('--admin-border'),
          text: rgb('--admin-text'),
          textInverse: '#E2E8F0',
          muted: rgb('--admin-muted'),
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
