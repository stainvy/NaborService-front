import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const NAMESPACES = [
  'common',
  'auth',
  'listings',
  'events',
  'messages',
  'notifications',
  'polls',
  'profile',
  'admin',
  'errors',
] as const;

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: NAMESPACES,
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React échappe déjà
    },
    react: {
      // Pas de Suspense : les composants rendent tout de suite (les clés
      // s'affichent le temps que les fichiers de traduction se chargent).
      useSuspense: false,
    },
  });

export default i18n;
