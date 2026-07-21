import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { mediaUrl } from '@/lib/media';
import { ConnectionsTabs } from '../components/ConnectionsTabs';

export function ProfilePage() {
  const { t } = useTranslation('profile');
  const { user } = useAuth();

  if (!user) return null;
  const bannerUrl = mediaUrl(user.bannerMongoId);

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white">
      <div
        className="h-40 w-full bg-navy/10"
        style={
          bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover' } : undefined
        }
      />

      <div className="px-6">
        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-full ring-4 ring-white">
              <Avatar
                mongoId={user.profilePictureMongoId}
                firstName={user.firstName}
                lastName={user.lastName}
                size={80}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray">
                {user.role} · {t(`profile.visibility_${user.visibility ?? 'public'}`)}
              </p>
            </div>
          </div>
          <Link to="/profile/edit" className="pb-2">
            <Button>{t('profile.edit')}</Button>
          </Link>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-navy">{t('profile.bio')}</h2>
          <p className="mt-1 whitespace-pre-line text-gray text-wrap break-words">
            {user.bio || t('profile.no_bio')}
          </p>
        </section>

        <nav className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/security" className="text-orange underline">
            {t('profile.links.security')}
          </Link>
          <Link to="/settings/notifications" className="text-orange underline">
            {t('profile.links.notifications')}
          </Link>
          <Link to="/privacy" className="text-orange underline">
            {t('profile.links.privacy')}
          </Link>
          <Link to="/sessions" className="text-orange underline">
            {t('profile.links.sessions')}
          </Link>
        </nav>

        <ConnectionsTabs userId={user.id} />
      </div>
    </div>
  );
}
