import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateLocale } from '@/features/profile/hooks/useLocalePref';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const updateLocale = useUpdateLocale();

  const onChange = (locale: string) => {
    void i18n.changeLanguage(locale);
    // Persiste côté back uniquement si l'utilisateur est connecté (sinon 401).
    if (isAuthenticated) updateLocale.mutate(locale);
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray">{t('language.label')}</span>
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray bg-surface px-2 py-1 text-xs font-medium text-fg outline-none focus:border-navy"
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {t(`language.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
