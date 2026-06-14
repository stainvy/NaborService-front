import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFollowers, useFollowing, useFriends } from '@/features/social/hooks/useConnections';
import { UserListItem } from '@/features/social/components/UserListItem';

type Tab = 'followers' | 'following' | 'friends';
const TABS: Tab[] = ['followers', 'following', 'friends'];

// Onglets followers / following / friends pour un utilisateur donné.
export function ConnectionsTabs({ userId }: { userId: string }) {
  const { t } = useTranslation('profile');
  const [tab, setTab] = useState<Tab>('followers');

  const followers = useFollowers(userId, { limit: 20 });
  const following = useFollowing(userId, { limit: 20 });
  const friends = useFriends(userId, { limit: 20 });
  const query = tab === 'followers' ? followers : tab === 'following' ? following : friends;
  const items = query.data?.data ?? [];

  return (
    <section className="mt-6">
      <div className="flex gap-2 border-b border-gray/30">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === tb ? 'border-b-2 border-orange text-navy' : 'text-gray'
            }`}
          >
            {t(`profile.tabs.${tb}`)}
            {query.data?.meta ? ` (${query.data.meta.total})` : ''}
          </button>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {items.length === 0 ? (
          <li className="text-sm text-gray">{t('profile.empty_list')}</li>
        ) : (
          items.map((u) => (
            <li key={u.id}>
              <UserListItem user={u} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
