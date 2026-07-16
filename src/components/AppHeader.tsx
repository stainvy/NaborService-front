import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { hasMinRole } from '@/types/roles';
import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// En-tête de navigation commun à la zone habitant (accueil, messagerie…) :
// nom de l'app + liens principaux + langue + déconnexion. Extrait de HomePage
// pour être réutilisé tel quel par la Messagerie (qui, en pleine hauteur,
// n'avait aucune navigation vers le reste de l'app). `flex-wrap` garde les
// liens accessibles sur petit écran plutôt que de les faire déborder.
export function AppHeader() {
  const { t } = useTranslation('common');
  const { role, logout } = useAuth();

  return (
    <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray/30 bg-white px-4 py-3">
      <Link to="/" className="text-lg font-bold text-navy">
        {t('app.name')}
      </Link>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-navy">
        <LanguageSwitcher />
        <Link to="/discover" className="underline">
          {t('nav.discover')}
        </Link>
        <Link to="/search" className="underline">
          {t('nav.search')}
        </Link>
        <Link to="/chat" className="underline">
          {t('nav.chat')}
        </Link>
        <Link to="/profile" className="underline">
          {t('nav.profile')}
        </Link>
        {hasMinRole(role, 'moderator') && (
          <Link to="/admin" className="underline">
            {t('nav.admin')}
          </Link>
        )}
        <Button variant="secondary" onClick={() => void logout()}>
          {t('actions.logout')}
        </Button>
      </nav>
    </header>
  );
}
