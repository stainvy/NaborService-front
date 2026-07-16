import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';

/** Placeholder de l'accueil habitant (zone protégée). */
export function HomePage() {
  const { t } = useTranslation('common');
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="p-6">
        <p className="text-gray">{t('app.tagline')}</p>
        {user && (
          <p className="mt-2 text-sm text-gray">
            {user.firstName} {user.lastName} ({user.email}) — {role}
          </p>
        )}
      </main>
    </div>
  );
}
