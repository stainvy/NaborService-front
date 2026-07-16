import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Check, Download, Eye, FileText, Pencil, Pin, PinOff, Search, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { mediaUrl } from '@/lib/media';
import { usePollsByGroup } from '@/features/polls/hooks/usePolls';
import type { AdminGroup, AdminMessage } from '@/types/admin';
import {
  useAdminGroups,
  useDeleteAdminMessage,
  useEditAdminMessage,
  useGroupAttachments,
  useGroupMessages,
  useGroupPinned,
  usePinAdminMessage,
} from '../hooks/useAdminMessagesTool';
import { MediaViewer, type ViewableFile } from '@/components/MediaViewer';
import { AdminPollCard } from '../components/AdminPollCard';

// Nom lisible d'une conversation : pour un message privé (pas de nom de groupe),
// on liste les participants — « qui parle à qui » (ex. Michel ↔ Théo).
function groupLabel(g: AdminGroup, t: TFunction): string {
  if (g.type === 'direct_message') {
    const names = g.participants.map((p) => `${p.first_name} ${p.last_name}`.trim()).filter(Boolean);
    return names.length ? names.join(' ↔ ') : t('messages.direct_message');
  }
  return g.name || t('messages.unnamed_group');
}

// Page de modération des messages : liste de toutes les conversations (groupes
// + messages privés) à gauche, fil complet déchiffré à droite avec les
// opérations admin (éditer, épingler, supprimer) sur les messages des deux
// côtés, ainsi que fichiers et sondages. `?userId=` filtre les conversations
// d'un utilisateur (lien depuis la fiche utilisateur).
export function AdminMessagesPage() {
  const { t } = useTranslation('admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const userFilter = searchParams.get('userId');
  const { data: groups, isLoading } = useAdminGroups();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = groups ?? [];
    if (userFilter) list = list.filter((g) => g.participants.some((p) => p.id === userFilter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((g) => groupLabel(g, t).toLowerCase().includes(q));
    }
    return list;
  }, [groups, userFilter, search, t]);

  const selected = (groups ?? []).find((g) => g.id === selectedId) ?? null;
  const filteredUserName = userFilter
    ? groups
        ?.flatMap((g) => g.participants)
        .find((p) => p.id === userFilter)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('messages.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('messages.subtitle')}</p>
      </div>

      {userFilter && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-admin-accent/30 bg-admin-accent/5 px-4 py-2 text-sm text-admin-text">
          <span>
            {t('messages.filtered_by_user', {
              name: filteredUserName ? `${filteredUserName.first_name} ${filteredUserName.last_name}` : userFilter,
            })}
          </span>
          <button
            type="button"
            onClick={() => {
              searchParams.delete('userId');
              setSearchParams(searchParams);
            }}
            className="font-semibold text-admin-accent hover:underline"
          >
            {t('messages.clear_filter')}
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <ConversationList
          groups={filtered}
          loading={isLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          search={search}
          onSearch={setSearch}
        />
        {selected ? (
          <AdminThread group={selected} />
        ) : (
          <p className="py-16 text-center text-sm text-admin-muted">{t('messages.select_conversation')}</p>
        )}
      </div>
    </div>
  );
}

function ConversationList({
  groups,
  loading,
  selectedId,
  onSelect,
  search,
  onSearch,
}: {
  groups: AdminGroup[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const { t } = useTranslation('admin');

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-admin-border bg-admin-surface p-3">
      <div className="flex items-center gap-2 rounded-md border border-admin-border px-2.5 py-1.5">
        <Search className="h-4 w-4 text-admin-muted" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('messages.search_placeholder')}
          className="w-full bg-transparent text-sm text-admin-text outline-none"
        />
      </div>

      <div className="flex max-h-[65vh] flex-col gap-1 overflow-y-auto">
        {loading && <p className="p-2 text-sm text-admin-muted">…</p>}
        {!loading && groups.length === 0 && <p className="p-2 text-sm text-admin-muted">{t('messages.no_conversations')}</p>}
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className={`flex flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors ${
              selectedId === g.id ? 'bg-admin-accent/10' : 'hover:bg-admin-border/30'
            }`}
          >
            <span className="line-clamp-1 text-sm font-medium text-admin-text">{groupLabel(g, t)}</span>
            <span className="flex items-center gap-2 text-[11px] text-admin-muted">
              <span className="rounded-full bg-admin-border/50 px-1.5 py-0.5 font-medium">
                {t(`messages.type_${g.type}`, { defaultValue: g.type })}
              </span>
              {t('messages.member_count', { count: g.memberCount })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type ThreadTab = 'messages' | 'files' | 'polls';

function AdminThread({ group }: { group: AdminGroup }) {
  const { t } = useTranslation('admin');
  const isDm = group.type === 'direct_message';
  const { data: messages, isLoading } = useGroupMessages(group.id);
  const { data: pinned } = useGroupPinned(group.id);
  const del = useDeleteAdminMessage();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [viewFile, setViewFile] = useState<ViewableFile | null>(null);
  const [tab, setTab] = useState<ThreadTab>('messages');

  // getMessagesAsAdmin renvoie du plus récent au plus ancien : on inverse pour
  // lire le fil dans l'ordre chronologique naturel.
  const ordered = useMemo(() => (messages ? [...messages].reverse() : []), [messages]);

  // Sondages absents des messages privés : l'onglet n'est proposé que pour un groupe.
  const tabs: ThreadTab[] = isDm ? ['messages', 'files'] : ['messages', 'files', 'polls'];

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-admin-border bg-admin-surface p-4">
      <header className="border-b border-admin-border pb-3">
        <p className="font-semibold text-admin-text">{groupLabel(group, t)}</p>
        <p className="mt-0.5 text-xs text-admin-muted">
          {t(`messages.type_${group.type}`, { defaultValue: group.type })} ·{' '}
          {group.participants.map((p) => `${p.first_name} ${p.last_name}`).join(', ') || '—'}
        </p>
      </header>

      <div className="flex gap-1 rounded-lg bg-admin-bg p-1">
        {tabs.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              tab === tb ? 'bg-admin-surface text-admin-accent shadow-sm' : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            {t(`messages.tab_${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'messages' && (
        <>
          {pinned && pinned.length > 0 && (
            <div className="rounded-md border border-admin-border bg-admin-bg p-2">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-admin-muted">
                <Pin className="h-3 w-3" /> {t('messages.pinned', { count: pinned.length })}
              </p>
              <div className="flex flex-col gap-0.5">
                {pinned.map((m) => (
                  <p key={m.id} className="line-clamp-1 text-xs text-admin-text">
                    <span className="font-medium">{senderName(m)}</span>: {m.content ?? t('messages.no_text')}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {isLoading && <p className="text-sm text-admin-muted">…</p>}
            {!isLoading && ordered.length === 0 && <p className="text-sm text-admin-muted">{t('messages.empty_thread')}</p>}
            {ordered.map((m) => (
              <AdminMessageRow
                key={m.id}
                message={m}
                onRequestDelete={() => setPendingDelete(m.id)}
                onViewFile={setViewFile}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'files' && <AdminFilesList group={group} onViewFile={setViewFile} />}
      {tab === 'polls' && !isDm && <AdminPollsList group={group} />}

      <MediaViewer file={viewFile} onClose={() => setViewFile(null)} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        tone="admin"
        title={t('messages.delete_title')}
        message={t('messages.delete_confirm')}
        destructive
        loading={del.isPending}
        onConfirm={() =>
          pendingDelete &&
          del.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) })
        }
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

// Nom lisible d'un participant du groupe à partir de son id (les fichiers et
// sondages ne portent que l'id de l'expéditeur/créateur).
function participantName(group: AdminGroup, id: string | null | undefined): string {
  if (!id) return '—';
  const p = group.participants.find((x) => x.id === id);
  return p ? `${p.first_name} ${p.last_name}`.trim() : id;
}

// Onglet « Fichiers » : liste détaillée de toutes les pièces jointes de la
// conversation (aperçu image, nom, type, taille, expéditeur, date), avec
// prévisualisation et téléchargement.
function AdminFilesList({ group, onViewFile }: { group: AdminGroup; onViewFile: (f: ViewableFile) => void }) {
  const { t } = useTranslation('admin');
  const { data: files, isLoading } = useGroupAttachments(group.id);

  if (isLoading) return <p className="text-sm text-admin-muted">…</p>;
  if (!files || files.length === 0) return <p className="text-sm text-admin-muted">{t('messages.no_files')}</p>;

  return (
    <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
      <p className="text-xs text-admin-muted">{t('messages.files_total', { count: files.length })}</p>
      {files.map((f) => {
        const url = mediaUrl(f.media_id);
        const isImage = f.mimetype.startsWith('image/');
        return (
          <div key={f.media_id} className="flex items-center gap-3 rounded-lg border border-admin-border bg-admin-bg p-2.5">
            <button
              type="button"
              onClick={() => onViewFile({ media_id: f.media_id, filename: f.filename, mimetype: f.mimetype })}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-admin-border bg-admin-surface hover:border-admin-accent"
              title={t('messages.view')}
            >
              {isImage && url ? (
                <img src={url} alt={f.filename} className="h-full w-full object-cover" />
              ) : (
                <FileText className="h-5 w-5 text-admin-muted" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-admin-text">{f.filename}</p>
              <p className="text-[11px] text-admin-muted">
                {f.mimetype} · {Math.round(f.size_bytes / 1024)} Ko
              </p>
              <p className="text-[11px] text-admin-muted">
                {participantName(group, f.sender_id)}
                {f.sent_at ? ` · ${new Date(f.sent_at).toLocaleString()}` : ''}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onViewFile({ media_id: f.media_id, filename: f.filename, mimetype: f.mimetype })}
                className="flex items-center gap-1 rounded-md border border-admin-border px-2 py-1 text-xs text-admin-text hover:bg-admin-border/30"
              >
                <Eye className="h-3 w-3" /> {t('messages.view')}
              </button>
              {url && (
                <a
                  href={url}
                  download={f.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-md border border-admin-border px-2 py-1 text-xs text-admin-text hover:bg-admin-border/30"
                >
                  <Download className="h-3 w-3" /> {t('messages.download')}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Onglet « Sondages » : tous les sondages de la conversation avec leurs détails
// (options, votes, statut) et les actions de modération (clôturer / supprimer).
function AdminPollsList({ group }: { group: AdminGroup }) {
  const { t } = useTranslation('admin');
  const { data: polls, isLoading } = usePollsByGroup(group.id);

  if (isLoading) return <p className="text-sm text-admin-muted">…</p>;
  if (!polls || polls.length === 0) return <p className="text-sm text-admin-muted">{t('messages.no_polls')}</p>;

  return (
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
      <p className="text-xs text-admin-muted">{t('messages.polls_total', { count: polls.length })}</p>
      {polls.map((p) => (
        <AdminPollCard key={p.id} pollId={p.id} />
      ))}
    </div>
  );
}

function senderName(m: AdminMessage): string {
  if (m.sender) return `${m.sender.first_name ?? ''} ${m.sender.last_name ?? ''}`.trim() || m.sender_id;
  return m.sender_id;
}

function AdminMessageRow({
  message,
  onRequestDelete,
  onViewFile,
}: {
  message: AdminMessage;
  onRequestDelete: () => void;
  onViewFile: (file: ViewableFile) => void;
}) {
  const { t } = useTranslation('admin');
  const edit = useEditAdminMessage();
  const pin = usePinAdminMessage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? '');

  const deleted = message.is_deleted || Boolean(message.deleted_at);

  function saveEdit() {
    const content = draft.trim();
    if (!content) return;
    edit.mutate({ id: message.id, content }, { onSuccess: () => setEditing(false) });
  }

  return (
    <div className={`rounded-lg border p-2.5 ${message.pinned ? 'border-admin-accent/40 bg-admin-accent/5' : 'border-admin-border bg-admin-bg'}`}>
      <div className="mb-1 flex items-center gap-2 text-xs text-admin-muted">
        <span className="font-semibold text-admin-text">{senderName(message)}</span>
        <span>{new Date(message.sent_at).toLocaleString()}</span>
        {message.edited_at && <span>· {t('messages.edited')}</span>}
        {message.pinned && <Pin className="h-3 w-3 text-admin-accent" />}
        {deleted && <span className="font-medium text-error">· {t('messages.deleted')}</span>}
      </div>

      {deleted ? (
        <p className="text-sm italic text-admin-muted">{t('messages.deleted_body')}</p>
      ) : editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-admin-border bg-admin-surface p-2 text-sm text-admin-text outline-none focus:border-admin-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              disabled={edit.isPending}
              className="flex items-center gap-1 rounded-md bg-admin-accent px-2 py-1 text-xs font-semibold text-white hover:bg-admin-accentHover"
            >
              <Check className="h-3 w-3" /> {t('messages.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(message.content ?? '');
                setEditing(false);
              }}
              className="flex items-center gap-1 rounded-md border border-admin-border px-2 py-1 text-xs text-admin-text hover:bg-admin-border/30"
            >
              <X className="h-3 w-3" /> {t('messages.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {message.content && <p className="whitespace-pre-wrap break-words text-sm text-admin-text">{message.content}</p>}

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-1.5 flex flex-col gap-1">
              {message.attachments.map((att) => {
                const url = mediaUrl(att.media_id);
                return (
                  <div key={att.media_id} className="flex items-center gap-2 text-xs text-admin-text">
                    <button
                      type="button"
                      onClick={() => onViewFile({ media_id: att.media_id, filename: att.filename, mimetype: att.mimetype })}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-admin-accent"
                      title={t('messages.view')}
                    >
                      <Eye className="h-3.5 w-3.5 flex-shrink-0 text-admin-muted" />
                      <span className="min-w-0 flex-1 truncate">{att.filename}</span>
                    </button>
                    <span className="text-admin-muted">{Math.round(att.size_bytes / 1024)} Ko</span>
                    {url && (
                      <a href={url} download={att.filename} target="_blank" rel="noreferrer" className="text-admin-muted hover:text-admin-accent" title={t('messages.download')}>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {message.type === 'poll' && message.poll_id && <AdminPollCard pollId={message.poll_id} />}
        </>
      )}

      {!deleted && !editing && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.type !== 'poll' && (
            <RowAction icon={<Pencil className="h-3 w-3" />} label={t('messages.edit')} onClick={() => setEditing(true)} />
          )}
          <RowAction
            icon={message.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            label={message.pinned ? t('messages.unpin') : t('messages.pin')}
            onClick={() => pin.mutate({ id: message.id, pinned: Boolean(message.pinned) })}
            disabled={pin.isPending}
          />
          <RowAction
            icon={<Trash2 className="h-3 w-3" />}
            label={t('messages.delete')}
            onClick={onRequestDelete}
            danger
          />
        </div>
      )}
    </div>
  );
}

function RowAction({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
        danger
          ? 'border-error/40 text-error hover:bg-error/10'
          : 'border-admin-border text-admin-text hover:bg-admin-border/30'
      }`}
    >
      {icon} {label}
    </button>
  );
}
