import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Pencil, Trash2, Reply as ReplyIcon, SmilePlus, Download, Pin, PinOff, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { mediaUrl } from '@/lib/media';
import type { ChatMessage, GroupRole } from '@/types/chat';
import { useEditMessage } from '../hooks/useEditMessage';
import { useDeleteMessage } from '../hooks/useMessages';
import { useReactToMessage, useUnreactToMessage } from '../hooks/useReactions';
import { usePinMessage, useUnpinMessage } from '../hooks/usePinMessage';
import { PollMessageCard } from './PollMessageCard';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const ROLE_BADGE_CLASSES: Record<GroupRole, string> = {
  watch: 'bg-gray/10 text-gray',
  message: 'bg-gray/10 text-gray',
  actions: 'bg-navy/10 text-fg',
  admin: 'bg-orange/10 text-orange',
};

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  /** Affiche le nom de l'expéditeur au-dessus des messages des autres (groupes à plusieurs membres). */
  showSender?: boolean;
  isGroupAdmin: boolean;
  /** Droit d'épingler dans cette conversation — rôle actions/admin pour un groupe, simple appartenance pour un message privé (pas de rôle "modérateur" à deux). */
  canPin?: boolean;
  canParticipate: boolean;
  /** Rôle de groupe de l'expéditeur — affiché en badge à côté de son nom, sauf pour le rôle "message" (par défaut, pas de badge). */
  senderRole?: GroupRole | null;
  onReply: (message: ChatMessage) => void;
  /** Bascule le fil sur l'onglet Sondages (messages de type "poll" uniquement). */
  onViewPoll?: (pollId: string) => void;
}

export function MessageBubble({ message, isOwn, showSender, isGroupAdmin, canPin: canPinHere, canParticipate, senderRole, onReply, onViewPoll }: MessageBubbleProps) {
  const { t } = useTranslation('messages');
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content ?? '');

  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const reactToMessage = useReactToMessage();
  const unreactToMessage = useUnreactToMessage();
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const parentPreview = message.parent_message;

  const canDelete = !message.deleted_at && (isOwn || isGroupAdmin);
  const canEdit = !message.deleted_at && isOwn;
  const canPin = !message.deleted_at && Boolean(canPinHere) && message.type !== 'poll';
  const canCopy = !message.deleted_at && Boolean(message.content) && message.type !== 'poll';
  const myReaction = message.reactions?.find((r) => r.pg_user_id === user?.id);

  const reactionCounts = (message.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  function handleSaveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    editMessage(message.id, trimmed).catch(() => {});
    setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(t('chat.confirm_delete_message'))) return;
    deleteMessage.mutate(message.id);
  }

  function handlePickEmoji(emoji: string) {
    setEmojiPickerOpen(false);
    const action =
      myReaction?.emoji === emoji
        ? unreactToMessage(message.id)
        : reactToMessage(message.id, emoji);
    action.catch((error) => console.error('[chat] reaction failed', error));
  }

  function handleTogglePin() {
    const action = message.pinned ? unpinMessage(message.id) : pinMessage(message.id);
    action.catch((error) => console.error('[chat] pin failed', error));
  }

  function handleCopy() {
    if (message.content) void navigator.clipboard.writeText(message.content);
  }

  // Messages système (ex. appel manqué/terminé) : pas d'auteur, pas d'actions —
  // rendu à part, centré, avant tout le reste de la bulle normale.
  if (message.type === 'system') {
    return <SystemMessage message={message} />;
  }

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[75%] items-start gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div className={`flex min-w-0 flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={`max-w-full rounded-2xl px-4 py-2 text-sm ${
              isOwn ? 'bg-orange text-white' : 'bg-gray/10 text-fg'
            } ${message.pending ? 'opacity-60' : ''}`}
          >
            {showSender && !isOwn && message.sender && (
              <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-fg/80">
                {message.sender.first_name} {message.sender.last_name}
                {senderRole && senderRole !== 'message' && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${ROLE_BADGE_CLASSES[senderRole]}`}
                  >
                    {t(`chat.role_${senderRole}`)}
                  </span>
                )}
              </p>
            )}

            {message.pinned && (
              <p
                className={`mb-1 flex items-center gap-1 text-[10px] font-medium ${isOwn ? 'text-white/80' : 'text-orange'}`}
              >
                <Pin className="h-2.5 w-2.5" /> {t('chat.pinned')}
              </p>
            )}

            {message.parent_message_id && !message.deleted_at && (
              <div
                className={`mb-1 rounded border-l-2 px-2 py-1 text-xs opacity-80 ${isOwn ? 'border-white/50 bg-black/10' : 'border-navy/30 bg-navy/5'}`}
              >
                {parentPreview?.sender && (
                  <p className="truncate font-semibold">
                    {parentPreview.sender.first_name} {parentPreview.sender.last_name}
                  </p>
                )}
                <p className="truncate">
                  {parentPreview?.is_deleted || !parentPreview
                    ? t('chat.message_deleted')
                    : parentPreview.content}
                </p>
              </div>
            )}

            {message.deleted_at ? (
              <p className="italic text-current/70">{t('chat.message_deleted')}</p>
            ) : message.type === 'poll' && message.poll_id ? (
              <PollMessageCard
                pollId={message.poll_id}
                isOwn={isOwn}
                onViewResults={() => onViewPoll?.(message.poll_id!)}
              />
            ) : isEditing ? (
              <div className="flex flex-col gap-1">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full rounded border border-white/30 bg-transparent p-1 text-sm outline-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setIsEditing(false)}>
                    {t('chat.cancel')}
                  </button>
                  <button type="button" onClick={handleSaveEdit} className="font-semibold">
                    {t('chat.save')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {!message.deleted_at && message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {message.attachments.map((att) => (
                  <AttachmentView key={att.media_id} attachment={att} />
                ))}
              </div>
            )}
            {message.attachmentUploading && (
              <p className="mt-1 text-xs italic opacity-70">{t('chat.uploading_attachment')}</p>
            )}
            {message.attachmentFailed && (
              <p className="mt-1 text-xs text-error">{t('chat.attachment_failed')}</p>
            )}

            <div
              className={`mt-1 flex items-center gap-1.5 text-[10px] ${isOwn ? 'text-white/70' : 'text-gray'}`}
            >
              <span>
                {new Date(message.sent_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {message.edited_at && !message.deleted_at && <span>{t('chat.message_edited')}</span>}
              {message.failed && (
                <span className="text-error">{message.failReason ?? t('chat.send_failed')}</span>
              )}
            </div>
          </div>

          {Object.keys(reactionCounts).length > 0 && !message.deleted_at && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className={`rounded-full border px-1.5 py-0.5 text-xs ${
                    myReaction?.emoji === emoji
                      ? 'border-orange bg-orange/10 text-fg'
                      : 'border-gray/20 bg-surface text-fg'
                  }`}
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}
        </div>

        {!message.deleted_at && !message.pending && (
          <div className="relative flex-shrink-0 self-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t('chat.message_actions')}
              className="rounded-full p-1.5 text-gray hover:bg-gray/10"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className={`absolute top-1/2 z-20 -translate-y-1/2 flex flex-col gap-1 rounded-md border border-gray/20 bg-surface p-1 text-xs shadow-lg ${isOwn ? 'right-full mr-1' : 'left-full ml-1'}`}
              >
                {canParticipate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiPickerOpen((v) => !v);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray/10"
                  >
                    <SmilePlus className="h-3.5 w-3.5" /> {t('chat.react')}
                  </button>
                )}
                {canParticipate && (
                  <button
                    type="button"
                    onClick={() => {
                      onReply(message);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray/10"
                  >
                    <ReplyIcon className="h-3.5 w-3.5" /> {t('chat.reply')}
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray/10"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t('chat.edit')}
                  </button>
                )}
                {canCopy && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray/10"
                  >
                    <Copy className="h-3.5 w-3.5" /> {t('chat.copy_text')}
                  </button>
                )}
                {canPin && (
                  <button
                    type="button"
                    onClick={() => {
                      handleTogglePin();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray/10"
                  >
                    {message.pinned ? (
                      <PinOff className="h-3.5 w-3.5" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                    {message.pinned ? t('chat.unpin') : t('chat.pin')}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left text-error hover:bg-gray/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t('chat.delete')}
                  </button>
                )}
              </div>
            )}
            {emojiPickerOpen && (
              <div
                className={`absolute top-1/2 z-20 -translate-y-1/2 flex gap-1 rounded-md border border-gray/20 bg-surface p-1 shadow-lg ${isOwn ? 'right-full mr-1' : 'left-full ml-1'}`}
              >
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handlePickEmoji(emoji)}
                    className={`rounded p-1 text-base hover:bg-gray/10 ${myReaction?.emoji === emoji ? 'bg-orange/20' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Rendu centré (pas de bulle, pas d'auteur) pour les messages `type: 'system'`
 * — aujourd'hui uniquement les événements d'appel, mais `system_event` est un
 * nom d'événement générique : un futur événement système ajoute juste un cas
 * ici, sans nouveau type de message.
 */
function SystemMessage({ message }: { message: ChatMessage }) {
  const { t } = useTranslation('messages');
  const payload = message.system_payload ?? {};

  let text: string;
  switch (message.system_event) {
    case 'call_missed':
      text = t('chat.system_call_missed');
      break;
    case 'call_declined':
      text = t('chat.system_call_declined');
      break;
    case 'call_ended': {
      const seconds = typeof payload.durationSeconds === 'number' ? payload.durationSeconds : 0;
      text = t('chat.system_call_ended', { duration: formatDuration(seconds) });
      break;
    }
    default:
      text = t('chat.system_generic');
  }

  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-gray/10 px-3 py-1 text-center text-xs text-gray">{text}</span>
    </div>
  );
}

function AttachmentView({ attachment }: { attachment: NonNullable<ChatMessage['attachments']>[number] }) {
  const { t } = useTranslation('messages');
  const url = mediaUrl(attachment.media_id);
  if (!url) return null;

  if (attachment.mimetype.startsWith('image/')) {
    return <img src={url} alt={attachment.filename} className="max-h-64 rounded-lg object-cover" />;
  }
  if (attachment.mimetype.startsWith('audio/')) {
    // La durée native du lecteur n'est pas fiable ici : le conteneur Ogg
    // transcodé côté back n'a pas de durée en en-tête, donc le navigateur
    // affiche souvent 0:00 tant qu'il n'a pas lu/cherché dans tout le flux.
    // On affiche donc la durée probée côté serveur à côté, en complément.
    const hasDuration = typeof attachment.duration_seconds === 'number';
    return (
      <div className="flex items-center gap-2">
        <audio controls src={url} className="max-w-full" />
        {hasDuration && (
          <span className="text-xs tabular-nums opacity-70">
            {formatDuration(attachment.duration_seconds!)}
          </span>
        )}
      </div>
    );
  }
  if (attachment.mimetype.startsWith('video/')) {
    return <video controls src={url} className="max-h-64 max-w-full rounded-lg" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-current/20 px-2 py-1 text-xs underline">
      <Download className="h-3.5 w-3.5" />
      {attachment.filename} {t('chat.attachment_size', { size: Math.round(attachment.size_bytes / 1024) })}
    </a>
  );
}
