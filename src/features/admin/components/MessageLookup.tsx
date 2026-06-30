import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService, type AdminMessage } from '@/services/admin.service';
import { Button } from '@/components/Button';

export function MessageLookup() {
  const { t } = useTranslation('admin');
  const [messageId, setMessageId] = useState('');
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!messageId.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const msg = await adminService.getMessage(messageId.trim());
      setMessage(msg);
    } catch (err: any) {
      const code = err?.response?.status;
      if (code === 404) setError(t('dsl.msg_not_found'));
      else if (code === 403) setError(t('dsl.msg_forbidden'));
      else setError(err?.response?.data?.message ?? t('dsl.unknown_error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!message || !window.confirm(t('dsl.msg_confirm_delete'))) return;
    setDeleting(true);
    try {
      await adminService.deleteMessage(message.id);
      setMessage(null);
      setMessageId('');
    } catch {
      setError(t('dsl.msg_delete_error'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-navy">{t('dsl.msg_title')}</h2>
        <p className="mt-1 text-sm text-gray">{t('dsl.msg_subtitle')}</p>
      </div>

      <form onSubmit={handleLookup} className="flex max-w-lg gap-3">
        <input
          type="text"
          value={messageId}
          onChange={(e) => setMessageId(e.target.value)}
          placeholder="pg_message_id ou UUID"
          className="flex-1 rounded-md border border-gray/30 px-3 py-2 font-mono text-sm outline-none focus:border-orange"
        />
        <Button type="submit" disabled={loading || !messageId.trim()}>
          {loading ? '…' : t('dsl.msg_lookup')}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {message && (
        <div className="max-w-2xl rounded-lg border border-gray/20 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                message.deleted_at ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message.deleted_at ? 'DELETED' : 'ACTIVE'}
              </span>
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                {message.type}
              </span>
              {message.edited_at && (
                <span className="ml-2 text-[10px] text-gray">edited</span>
              )}
            </div>
            <Button variant="secondary" onClick={handleDelete} disabled={deleting} className="text-xs">
              {deleting ? '…' : t('dsl.msg_delete')}
            </Button>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray">ID: </span><code className="font-mono text-navy">{message.id}</code></div>
              <div><span className="text-gray">Group: </span><code className="font-mono text-navy">{message.pg_group_id}</code></div>
              <div><span className="text-gray">Sender: </span><code className="font-mono text-navy">{message.pg_sender_id}</code></div>
              <div><span className="text-gray">Sent: </span>{new Date(message.sent_at).toLocaleString()}</div>
            </div>

            {/* Contenu déchiffré */}
            <div className="rounded-md border border-gray/20 bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium text-gray">{t('dsl.msg_content')}</p>
              <p className="whitespace-pre-wrap text-navy">{message.content ?? <span className="italic text-gray">{t('dsl.msg_no_content')}</span>}</p>
            </div>

            {/* Pièces jointes */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="text-xs text-gray">
                {t('dsl.msg_attachments')}: {message.attachments.map((a) => `${a.filename} (${a.mimetype}, ${Math.round(a.size_bytes / 1024)} KB)`).join(', ')}
              </div>
            )}

            {/* Réactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="text-xs text-gray">
                {t('dsl.msg_reactions')}: {message.reactions.map((r) => r.emoji).join(' ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
