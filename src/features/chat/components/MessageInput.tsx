import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useFilePicker } from '@/hooks/useFilePicker';
import type { ChatMessage } from '@/types/chat';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_OTHER_BYTES = 50 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm,video/quicktime';

interface MessageInputProps {
  onSend: (content: string, parentMessageId?: string) => void;
  onTyping: () => void;
  onSendFile: (file: File) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  readOnly?: boolean;
  /** Boutons additionnels affichés dans la barre du composer (ex. création de sondage). */
  extraActions?: React.ReactNode;
}

export function MessageInput({ onSend, onTyping, onSendFile, replyTo, onCancelReply, readOnly, extraActions }: MessageInputProps) {
  const { t } = useTranslation('messages');
  const { user } = useAuth();
  const [value, setValue] = useState('');

  const { error: fileError, triggerPick, inputProps } = useFilePicker({
    accept: ACCEPTED_TYPES,
    maxSizeBytes: MAX_OTHER_BYTES,
    onPick: (file) => {
      if (file.type.startsWith('image/') && file.size > MAX_IMAGE_BYTES) return;
      onSendFile(file);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value, replyTo?.id);
    setValue('');
    onCancelReply?.();
  }

  if (readOnly) {
    return (
      <div className="border-t border-gray/20 p-3 text-center text-xs text-gray">
        {t('chat.read_only_notice')}
      </div>
    );
  }

  return (
    <div className="border-t border-gray/20">
      {replyTo && (
        <div className="flex items-center gap-2 border-b border-gray/10 bg-gray/5 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-navy">
              {t('chat.replying_to', {
                name:
                  replyTo.sender_id === user?.id
                    ? t('chat.you')
                    : replyTo.sender
                      ? `${replyTo.sender.first_name} ${replyTo.sender.last_name}`.trim()
                      : t('chat.them'),
              })}
            </p>
            <p className="truncate text-gray">{replyTo.content}</p>
          </div>
          <button type="button" onClick={onCancelReply} aria-label={t('chat.cancel_reply')}>
            <X className="h-4 w-4 text-gray" />
          </button>
        </div>
      )}

      {fileError && <p className="px-3 pt-1 text-xs text-error">{t('chat.file_too_large')}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 p-3">
        <input {...inputProps} />
        <Button
          type="button"
          variant="secondary"
          onClick={triggerPick}
          aria-label={t('chat.attach_file')}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        {extraActions}
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping();
          }}
          placeholder={t('chat.type_placeholder')}
          className="flex-1 rounded-full border border-gray/30 px-4 py-2 text-sm outline-none focus:border-orange"
        />
        <Button type="submit" disabled={!value.trim()} aria-label={t('chat.send')}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
