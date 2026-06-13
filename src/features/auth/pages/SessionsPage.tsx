import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { useSessions } from '../hooks/useSessions';
import { useRevokeSession } from '../hooks/useRevokeSession';

export function SessionsPage() {
  const { t, i18n } = useTranslation('auth');
  const { data: sessions, isLoading, isError } = useSessions();
  const revoke = useRevokeSession();

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{t('sessions.title')}</h1>
        <Link to="/" className="text-sm text-orange underline">
          ← {t('sessions.back_home')}
        </Link>
      </div>

      {isLoading && <p className="text-gray">{t('sessions.loading')}</p>}
      {isError && <p className="text-error">{t('sessions.error')}</p>}

      <ul className="flex flex-col gap-3">
        {sessions?.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between rounded-md border border-gray/30 p-4"
          >
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 font-medium text-navy">
                {session.device_name}
                {session.is_current && (
                  <span className="rounded-full bg-success px-2 py-0.5 text-xs text-white">
                    {t('sessions.current')}
                  </span>
                )}
              </span>
              <span className="text-sm text-gray">{session.ip_address}</span>
              <span className="text-xs text-gray">
                {t('sessions.last_used', { date: formatDate(session.last_used_at) })}
              </span>
            </div>

            {!session.is_current && (
              <Button
                variant="secondary"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(session.id)}
              >
                {t('sessions.revoke')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
