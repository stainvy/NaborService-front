import { useTranslation } from 'react-i18next';

// Prix exprimé en points (système de points de la plateforme) ; 0 → « Gratuit ».
export function PriceTag({ cents }: { cents: number }) {
  const { t } = useTranslation('listings');
  if (cents === 0) return <span className="font-semibold text-success">{t('listings.free')}</span>;
  return <span className="font-semibold text-fg">{t('listings.price_points', { points: cents })}</span>;
}
