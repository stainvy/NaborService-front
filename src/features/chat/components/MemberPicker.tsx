import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { useSearchUsers } from '@/features/social/hooks/useDiscover';

interface MemberPickerProps {
  selectedIds: string[];
  onToggle: (userId: string) => void;
  excludeIds?: string[];
}

// Sélecteur d'utilisateurs réutilisé par CreateGroupModal (membres initiaux)
// et GroupMembersPage (invitation) — s'appuie sur la recherche existante
// (useSearchUsers / GET /users/search), déjà utilisée par SearchPage.
export function MemberPicker({ selectedIds, onToggle, excludeIds = [] }: MemberPickerProps) {
  const { t } = useTranslation('messages');
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchUsers(query);
  const results = (data?.data ?? []).filter((u) => !excludeIds.includes(u.id));

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('chat.search_users')}
        className="rounded-md border border-gray px-3 py-2 text-sm outline-none focus:border-navy"
      />
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {query.trim() && !isLoading && results.length === 0 && (
          <p className="p-2 text-xs text-gray">{t('chat.no_results')}</p>
        )}
        {results.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            className={`flex items-center gap-2 rounded p-2 text-left text-sm hover:bg-gray/10 ${
              selectedIds.includes(u.id) ? 'bg-orange/10' : ''
            }`}
          >
            <Avatar mongoId={u.profilePictureMongoId} firstName={u.firstName} lastName={u.lastName} size={32} />
            <span className="truncate">{u.firstName} {u.lastName}</span>
          </button>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-gray">{t('chat.member_count', { count: selectedIds.length })}</p>
      )}
    </div>
  );
}
