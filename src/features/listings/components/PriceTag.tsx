import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/money';

// Affiche un prix en centimes ; 0 → « Gratuit ».
export function PriceTag({ cents }: { cents: number }) {
  const { t, i18n } = useTranslation('listings');
  if (cents === 0) return <span className="font-semibold text-success">{t('listings.free')}</span>;
  return (
    <span className="font-semibold text-navy">{formatPrice(cents, i18n.resolvedLanguage)}</span>
  );
}
