import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useChatGroups } from '../hooks/useChatGroups';
import { CreateGroupModal } from './CreateGroupModal';
import { getGroupAvatarProps, getGroupDisplayName } from '../utils';

const FILTERS = ['all', 'groups', 'dm'] as const;
type Filter = (typeof FILTERS)[number];

interface ConversationsSidebarProps {
  activeGroupId?: string;
}

// Colonne de gauche du Messagerie : recherche, filtres Tous/Groupes/Privés,
// liste des conversations avec badge non-lus (mockup Messagerie.dc.html).
export function ConversationsSidebar({ activeGroupId }: ConversationsSidebarProps) {
  const { t } = useTranslation('messages');
  const { data: groups, isLoading } = useChatGroups();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const filtered = (groups ?? []).filter((g) => {
    if (filter === 'groups' && g.type !== 'group_chat') return false;
    if (filter === 'dm' && g.type !== 'direct_message') return false;
    if (search.trim() && !getGroupDisplayName(g, t).toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <aside className="flex h-full w-full flex-col border-r border-gray/20 bg-white">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy">{t('chat.title')}</h1>
          <button
            type="button"
            onClick={() => setCreateGroupOpen(true)}
            aria-label={t('chat.new_group')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange/10 text-orange hover:bg-orange/20"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-gray/10 px-3 py-2">
          <Search className="h-4 w-4 text-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('chat.search_conversations')}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f ? 'bg-navy text-white' : 'bg-gray/10 text-gray hover:bg-gray/20'
              }`}
            >
              {t(`chat.filter_${f}`)}
            </button>
          ))}
        </div>
      </div>

      <CreateGroupModal open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} />

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading && <p className="p-4 text-center text-sm text-gray">…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-gray">{t('chat.empty_list')}</p>
        )}
        <div className="flex flex-col gap-1">
          {filtered.map((group) => (
            <Link
              key={group.id}
              to={`/chat/${group.id}`}
              className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                activeGroupId === group.id ? 'bg-orange/10' : 'hover:bg-gray/5'
              }`}
            >
              <Avatar {...getGroupAvatarProps(group)} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-navy">{getGroupDisplayName(group, t)}</p>
                  {!!group.unread_count && (
                    <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange px-1.5 text-[11px] font-bold text-white">
                      {group.unread_count}
                    </span>
                  )}
                </div>
                {group.type !== 'direct_message' && group.member_count != null && (
                  <p className="truncate text-xs text-gray">{t('chat.member_count', { count: group.member_count })}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
