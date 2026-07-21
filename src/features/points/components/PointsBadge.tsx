import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';
import { usePointsBalance } from '../hooks/usePoints';

// Solde de points affiché dans l'AppHeader, à côté de la cloche de
// notifications — lien direct vers /points (historique + recharge).
export function PointsBadge() {
  const { t } = useTranslation('points');
  const { data } = usePointsBalance();

  return (
    <NavLink
      to="/points"
      className={({ isActive }) =>
        `flex items-center gap-1 underline transition-colors ${
          isActive ? 'font-semibold text-orange' : 'text-fg hover:text-orange'
        }`
      }
    >
      <Coins className="h-4 w-4" />
      {data ? t('badge', { points: data.pointsBalance }) : '…'}
    </NavLink>
  );
}
