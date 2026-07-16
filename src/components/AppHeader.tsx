import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { hasMinRole } from '@/types/roles';
import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Lien de navigation avec état actif (route courante mise en avant).
function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `underline transition-colors ${
          isActive ? 'font-semibold text-orange' : 'text-navy hover:text-orange'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

// En-tête de navigation commun à la zone habitant, monté par HabitantLayout.
// `flex-wrap` garde les liens accessibles sur petit écran plutôt que de les
// faire déborder.
export function AppHeader() {
  const { t } = useTranslation('common');
  const { role, logout } = useAuth();

  return (
    <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray/30 bg-white px-4 py-3">
      <Link to="/" className="text-lg font-bold text-navy">
        {t('app.name')}
      </Link>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
        <LanguageSwitcher />
        <NavItem to="/" end>
          {t('nav.home')}
        </NavItem>
        <NavItem to="/listings">{t('nav.listings')}</NavItem>
        <NavItem to="/discover">{t('nav.discover')}</NavItem>
        <NavItem to="/search">{t('nav.search')}</NavItem>
        <NavItem to="/chat">{t('nav.chat')}</NavItem>
        <NavItem to="/profile">{t('nav.profile')}</NavItem>
        {hasMinRole(role, 'moderator') && <NavItem to="/admin">{t('nav.admin')}</NavItem>}
        <Button variant="secondary" onClick={() => void logout()}>
          {t('actions.logout')}
        </Button>
      </nav>
    </header>
  );
}
