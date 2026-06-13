import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray">{t('language.label')}</span>
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        className="rounded-md border border-gray px-2 py-1"
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
