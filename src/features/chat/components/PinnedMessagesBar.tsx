import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Pin } from 'lucide-react';
import { usePinnedMessages } from '../hooks/usePinMessage';

interface PinnedMessagesBarProps {
  groupId: string;
  onSelect: (messageId: string) => void;
}

// Bandeau "messages épinglés" du fil : liste indépendante de la pagination
// (endpoint dédié GET /chat/groups/:id/pinned) — un pin ancien, hors de la
// première page chargée, doit quand même apparaître ici.
export function PinnedMessagesBar({ groupId, onSelect }: PinnedMessagesBarProps) {
  const { t } = useTranslation('messages');
  const { data: pinned } = usePinnedMessages(groupId);
  const [open, setOpen] = useState(false);

  if (!pinned || pinned.length === 0) return null;

  return (
    <div className="border-b border-gray/10 bg-orange/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-fg"
      >
        <Pin className="h-3.5 w-3.5 flex-shrink-0 text-orange" />
        <span className="flex-1 text-left">{t('chat.pinned_count', { count: pinned.length })}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-gray" /> : <ChevronDown className="h-3.5 w-3.5 text-gray" />}
      </button>

      {open && (
        <div className="flex flex-col gap-0.5 border-t border-gray/10 px-2 pb-2">
          {pinned.map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => {
                onSelect(message.id);
                setOpen(false);
              }}
              className="flex flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left hover:bg-surface"
            >
              <span className="text-xs font-semibold text-fg">
                {message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : t('chat.them')}
              </span>
              <span className="line-clamp-1 text-xs text-gray">
                {message.type === 'poll' ? t('chat.create_poll') : (message.content ?? t('chat.message_deleted'))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
