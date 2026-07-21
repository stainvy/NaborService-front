import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useDiscover, useSwipe } from '../hooks/useDiscover';
import type { SwipeDirection } from '../types';

export function DiscoverPage() {
  const { t } = useTranslation('profile');
  const { data, isLoading } = useDiscover({ limit: 20 });
  const swipe = useSwipe();
  const [index, setIndex] = useState(0);

  const users = data?.data ?? [];
  const current = users[index];

  const onSwipe = (direction: SwipeDirection) => {
    if (!current) return;
    swipe.mutate({ userId: current.id, direction });
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold text-fg">{t('social.discover.title')}</h1>

      {isLoading ? (
        <p className="text-gray">…</p>
      ) : !current ? (
        <p className="text-gray">{t('social.discover.empty')}</p>
      ) : (
        <>
          <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-gray/30 p-8 shadow-sm">
            <Avatar
              mongoId={current.profilePictureMongoId}
              firstName={current.firstName}
              lastName={current.lastName}
              size={120}
            />
            <h2 className="text-lg font-semibold text-fg">
              {current.firstName} {current.lastName}
            </h2>
            {current.bio && <p className="text-center text-sm text-gray">{current.bio}</p>}
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              variant="secondary"
              onClick={() => onSwipe('dislike')}
              disabled={swipe.isPending}
            >
              {t('social.discover.dislike')}
            </Button>
            <Button onClick={() => onSwipe('like')} disabled={swipe.isPending}>
              {t('social.discover.like')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
