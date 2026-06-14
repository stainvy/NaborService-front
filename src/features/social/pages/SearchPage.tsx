import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchUsers } from '../hooks/useDiscover';
import { UserListItem } from '../components/UserListItem';

export function SearchPage() {
  const { t } = useTranslation('profile');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  const { data, isError, isFetching } = useSearchUsers(q, { limit: 20 });
  const results = data?.data ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('social.search.title')}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('social.search.placeholder')}
          className="flex-1 rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
        />
      </form>

      {/* /users/search est cassé côté back → on affiche un message d'indisponibilité. */}
      {isError && <p className="text-sm text-error">{t('social.search.unavailable')}</p>}

      {!isError && q && !isFetching && results.length === 0 && (
        <p className="text-sm text-gray">{t('social.search.empty')}</p>
      )}

      <ul className="flex flex-col gap-2">
        {results.map((u) => (
          <li key={u.id}>
            <UserListItem user={u} />
          </li>
        ))}
      </ul>
    </div>
  );
}
