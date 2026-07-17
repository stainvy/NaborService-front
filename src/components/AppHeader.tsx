import type { ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasMinRole } from '@/types/roles';
import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

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
// Bouton retour (sauf sur l'accueil), liens actifs, cloche de notifications,
// langue et déconnexion. `flex-wrap` garde les liens accessibles sur petit écran.
export function AppHeader() {
  const { t } = useTranslation('common');
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== '/';

  return (
    <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray/30 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('actions.back')}
            title={t('actions.back')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-navy transition-colors hover:bg-navy/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Link to="/" className="text-lg font-bold text-navy">
          {t('app.name')}
        </Link>
      </div>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
        <NotificationBell />
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
