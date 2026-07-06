import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Button } from '@/components/Button';
import { chatService, type ChatGroup, type ChatMessage } from '@/services/chat.service';
import { eventsService, type NaborEvent, type CreateEventPayload } from '@/services/events.service';
import { listingsService, type CreateListingPayload } from '@/services/listings.service';
import { usersService } from '@/services/users.service';
import { adminService } from '@/services/admin.service';
import { useAuth } from '@/hooks/useAuth';
import { env } from '@/lib/env';
import { mediaUrl } from '@/lib/media';
import { getAccessToken } from '@/lib/tokenStore';

type EntityTab = 'messages' | 'events' | 'listings' | 'media';

// ─── Helpers ───

function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'events', 'listings', 'items', 'results', 'groups', 'messages']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

/** Extrait l'ID média d'une réponse d'upload (peut être `mediaId`, `id`, `_id`, etc.). */
function extractMediaId(r: any): string {
  return r?.mediaId ?? r?.id ?? r?._id ?? String(r);
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs leading-relaxed text-navy">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function FieldRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (value == null) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-24 shrink-0 font-medium text-gray">{label}</span>
      <span className="truncate text-navy">{value}</span>
    </div>
  );
}

const DATE_FIELDS = new Set([
  'startsAt', 'endsAt', 'createdAt', 'updatedAt', 'deletedAt',
  'publishedAt', 'cancelledAt', 'completedAt', 'sent_at', 'edited_at',
]);

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' && DATE_FIELDS.has(val as any)) return val; // pas de transformation, juste format ISO
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return new Date(val).toLocaleString();
  }
  return String(val);
}

function DetailGrid({ data }: { data: Record<string, unknown> }) {
  const keys = Object.keys(data).filter((k) => !k.startsWith('_') && data[k] !== null);
  return (
    <div className="flex flex-col gap-1">
      {keys.map((key) => (
        <FieldRow key={key} label={key} value={formatVal(data[key])} />
      ))}
    </div>
  );
}

// ─── Messages tab ───

function MessagesPanel() {
  const { t } = useTranslation('admin');
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [messageId, setMessageId] = useState('');
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadGroups() {
    setLoading(true); setError(null);
    try { const r = await adminService.listGroups(); setGroups(ensureArray(r) as any); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function createGroup() {
    if (!groupName.trim()) return;
    setLoading(true); setError(null);
    try { const r = await chatService.createGroup({ name: groupName.trim() }); setResponse(r); setGroupName(''); await loadGroups(); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function loadMessages(groupId: string) {
    setLoading(true); setError(null);
    try { const r = await adminService.getGroupMessages(groupId, 50); setMessages(ensureArray(r)); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function lookupMessage() {
    if (!messageId.trim()) return;
    setLoading(true); setError(null);
    try { const r = await adminService.getMessage(messageId.trim()); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function deleteMessage(id: string) {
    setLoading(true); setError(null);
    try { await adminService.deleteMessage(id); setResponse({ deleted: id }); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  async function decryptMessage(id: string) {
    setLoading(true); setError(null);
    try {
      const r = await adminService.getMessage(id);
      // Replace the encrypted content in the messages list
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content: (r as any).content ?? '[vide]' } : msg)));
      setResponse(r);
    } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Tous les groupes (admin)</h3>
          <div className="mb-3 flex gap-2">
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nom du groupe…" className="flex-1 rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <Button onClick={createGroup} disabled={loading || !groupName.trim()}>+</Button>
            <Button onClick={loadGroups} disabled={loading}>↻</Button>
          </div>
          <div className="max-h-96 overflow-auto">
            {groups.map((g) => (
              <button key={g.id} onClick={() => { setSelectedGroup(g); loadMessages(g.id); }} className={`block w-full px-3 py-2 text-left text-sm ${selectedGroup?.id === g.id ? 'bg-orange/10 text-orange font-medium' : 'text-navy hover:bg-gray-50'}`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{g.name}</span>
                  {(g as any).type && <span className="rounded bg-gray-100 px-1 text-[10px] text-gray">{(g as any).type}</span>}
                </div>
                <div className="mt-0.5 text-xs text-gray">
                  ID: {g.id?.slice(0, 8)}…
                  {(g as any).memberCount != null && <span> · {(g as any).memberCount} membres</span>}
                  {(g as any).createdAt && <span> · {new Date((g as any).createdAt).toLocaleDateString()}</span>}
                </div>
              </button>
            ))}
            {!groups.length && <p className="py-4 text-center text-xs text-gray">Aucun groupe. Cliquez ↻</p>}
          </div>
        </div>

        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Messages {selectedGroup ? `— ${selectedGroup.name}` : ''}</h3>
          {selectedGroup ? (
            <div className="max-h-96 overflow-auto">
              {messages.map((m) => (
                <div key={m.id} className="border-b border-gray/100 py-2.5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-navy">{(m as any).pg_sender_id?.slice(0, 8)}…</span>
                        <span className="rounded bg-gray-100 px-1 text-[10px] text-gray">{m.type}</span>
                        {m.edited_at && <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">édité</span>}
                        {m.deleted_at && <span className="rounded bg-red-100 px-1 text-[10px] text-red-700">supprimé</span>}
                        <span className="text-[10px] text-gray">{m.sent_at ? new Date(m.sent_at).toLocaleString() : ''}</span>
                      </div>
                      {m.content ? (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-navy">{m.content}</p>
                      ) : (
                        <button onClick={() => decryptMessage(m.id)} disabled={loading} className="mt-1 text-xs text-orange hover:underline">
                          🔓 Déchiffrer ce message
                        </button>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray">
                        <span>ID: {m.id?.slice(0, 8)}…</span>
                        {m.pg_message_id && <span>PG: {m.pg_message_id.slice(0, 8)}…</span>}
                        {(m as any).pg_group_id && <span>Groupe: {(m as any).pg_group_id.slice(0, 8)}…</span>}
                        {m.attachments?.length ? <span>{m.attachments.length} PJ</span> : null}
                        {m.reactions?.length ? <span>{m.reactions.length} réactions</span> : null}
                      </div>
                      {m.attachments?.length ? (
                        <div className="mt-1 text-[10px] text-gray">
                          PJ: {m.attachments.map((a) => a.filename).join(', ')}
                        </div>
                      ) : null}
                    </div>
                    <button onClick={() => deleteMessage(m.id)} className="ml-2 shrink-0 text-xs text-red-500 hover:underline">del</button>
                  </div>
                </div>
              ))}
              {!messages.length && <p className="py-4 text-center text-xs text-gray">Aucun message dans ce groupe.</p>}
            </div>
          ) : (
            <p className="text-xs text-gray">Sélectionnez un groupe pour voir ses messages.</p>
          )}
        </div>
      </div>

      {/* Lookup manuel — full width below the grid */}
      <div className="rounded-lg border border-gray/200 p-4">
        <h3 className="mb-3 font-semibold text-navy">Lookup manuel — voir un message déchiffré par ID</h3>
        <div className="flex gap-2">
          <input value={messageId} onChange={(e) => setMessageId(e.target.value)} placeholder="UUID du message…" className="flex-1 rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
          <Button onClick={lookupMessage} disabled={loading || !messageId.trim()}>Voir</Button>
        </div>
        {response && !Array.isArray(response) && (
          <div className="mt-3">
            <JsonBlock data={response} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Events tab ───

const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', published: 'Publié', open: 'Inscriptions ouvertes',
  in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé',
};

function EventsPanel() {
  const { t } = useTranslation('admin');
  const [events, setEvents] = useState<NaborEvent[]>([]);
  const [selected, setSelected] = useState<NaborEvent | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateEventPayload>({ title: '', description: '', cost_cents: 0, max_participants: 50 });
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<{ id: string; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadEvents() {
    setLoading(true); setError(null);
    try { const r = await eventsService.list(); setEvents(ensureArray(r)); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function createEvent() {
    if (!form.title.trim()) return;
    setLoading(true); setError(null);
    try { const r = await eventsService.create(form); setResponse(r); await loadEvents(); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function getEvent(id: string) {
    setLoading(true); setError(null); setContentHtml(null); setMediaList([]);
    try { const r = await eventsService.getById(id); setSelected(r); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function doAction(id: string, action: string, fn: (id: string) => Promise<unknown>) {
    setLoading(true); setError(null);
    try {
      const r = await fn(id) as NaborEvent;
      setResponse(r);
      setSelected(r); // met à jour le détail immédiatement
      setEvents((prev) => prev.map((ev) => (ev.id === id ? r : ev))); // met à jour la liste
    } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  async function loadContent(id: string) {
    setLoading(true); setError(null);
    try {
      const r: any = await eventsService.getContent(id);
      const html = r?.body_html ?? r?.body ?? r?.html ?? JSON.stringify(r);
      setContentHtml(DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'loading'] }));
      // Event media: /events/:id/media/cover or /events/:id/media/:name
      const media: { id: string; url: string }[] = [];
      if (r?.cover) media.push({ id: 'cover', url: eventMediaUrl(id, 'cover') });
      if (r?.attachments) {
        for (const a of r.attachments as any[]) {
          const name = a.name ?? a.filename ?? String(a);
          media.push({ id: String(name), url: eventMediaUrl(id, String(name)) });
        }
      }
      if (media.length) setMediaList(media);
    } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  // ─── Event-specific media (uses /events/:id/media/:name, not GridFS) ───

  function eventMediaUrl(eventId: string, name: string) {
    const token = getAccessToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${env.apiUrl}/events/${eventId}/media/${encodeURIComponent(name)}${qs}`;
  }

  function handleMediaUpload(eventId: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    eventsService.uploadMedia(eventId, file)
      .then((r) => {
        setResponse(r);
        const name = r.name ?? r.type; // cover has no name, use "cover"
        setMediaList((prev) => [...prev, { id: name, url: eventMediaUrl(eventId, name) }]);
      })
      .catch((e: any) => setError(e?.message ?? 'Error'))
      .finally(() => setLoading(false));
  }

  async function deleteEventMedia(eventId: string, filename: string) {
    setLoading(true); setError(null);
    try { await eventsService.deleteMedia(eventId, filename); setMediaList((prev) => prev.filter((m) => m.id !== filename)); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  async function cancelWithReason(id: string) {
    const reason = window.prompt('Motif d\'annulation :');
    if (reason === null) return; // user cancelled
    return eventsService.cancel(id, reason);
  }

  const lifecyleActions: { label: string; fn: (id: string) => Promise<unknown> }[] = [
    { label: 'Publier', fn: eventsService.publish.bind(eventsService) },
    { label: 'Ouvrir inscriptions', fn: eventsService.open.bind(eventsService) },
    { label: 'Terminer', fn: eventsService.complete.bind(eventsService) },
    { label: 'Annuler', fn: cancelWithReason },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-gray/200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-navy">Événements</h3>
            <Button onClick={loadEvents} disabled={loading}>↻</Button>
          </div>
          <div className="max-h-80 overflow-auto">
            {events.map((ev) => (
              <button key={ev.id} onClick={() => getEvent(ev.id)} className={`block w-full px-3 py-2 text-left text-sm ${selected?.id === ev.id ? 'bg-orange/10 text-orange font-medium' : 'text-navy hover:bg-gray-50'}`}>
                <span className="text-[10px] uppercase text-gray">{EVENT_STATUS_LABELS[ev.status] ?? ev.status}</span>
                <span className="ml-1">{ev.title}</span>
              </button>
            ))}
            {!events.length && <p className="py-4 text-center text-xs text-gray">Aucun événement. Cliquez ↻</p>}
          </div>
        </div>

        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Créer un événement</h3>
          <div className="flex flex-col gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre *" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <div className="flex gap-2">
              <input type="number" value={form.cost_cents ?? 0} onChange={(e) => setForm({ ...form, cost_cents: Number(e.target.value) })} placeholder="Prix (centimes)" className="w-32 rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
              <input type="number" value={form.max_participants ?? 50} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} placeholder="Max participants" className="w-36 rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            </div>
            <Button onClick={createEvent} disabled={loading || !form.title.trim()}>Créer (brouillon)</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray/200 p-4">
        <h3 className="mb-3 font-semibold text-navy">Détail de l'événement</h3>
        {selected ? (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-navy">{selected.title}</h4>
            <FieldRow label="ID" value={selected.id} />
            <FieldRow label="Statut" value={EVENT_STATUS_LABELS[selected.status] ?? selected.status} />
            <FieldRow label="Créateur" value={selected.creatorId?.slice(0, 8) + '…'} />
            <FieldRow label="Quartier" value={selected.neighbourhoodId} />
            <FieldRow label="Groupe" value={selected.groupId?.slice(0, 8) + '…'} />
            <FieldRow label="Places max" value={selected.maxParticipants != null ? String(selected.maxParticipants) : null} />
            <FieldRow label="Début" value={selected.startsAt ? new Date(selected.startsAt).toLocaleString() : null} />
            <FieldRow label="Fin" value={selected.endsAt ? new Date(selected.endsAt).toLocaleString() : null} />
            <FieldRow label="Prix (centimes)" value={selected.costCents > 0 ? String(selected.costCents) : 'Gratuit'} />
            <FieldRow label="Code invitation" value={selected.inviteCode ?? 'Public'} />
            <FieldRow label="Remboursement" value={selected.refundDeadlineHours != null ? `${selected.refundDeadlineHours}h avant` : null} />
            <FieldRow label="Créé le" value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : null} />
            <FieldRow label="Publié le" value={selected.publishedAt ? new Date(selected.publishedAt).toLocaleString() : null} />

            <div className="flex flex-wrap gap-1">
              {lifecyleActions.map((a) => (
                <button key={a.label} onClick={() => doAction(selected.id, a.label, a.fn)} disabled={loading} className="rounded border border-gray/20 px-2 py-1 text-xs text-navy hover:bg-orange/10">
                  {a.label}
                </button>
              ))}
            </div>

            <button onClick={() => loadContent(selected.id)} disabled={loading} className="text-xs text-orange underline">
              📄 Voir contenu enrichi
            </button>

            {contentHtml && (
              <div
                className="max-h-80 overflow-auto rounded border border-gray/200 bg-white p-3 text-xs"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}

            {/* Media upload */}
            <div className="border-t border-gray/100 pt-3">
              <p className="mb-1 text-xs font-medium text-gray">Médias</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={() => handleMediaUpload(selected.id)} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={loading} className="text-xs text-orange underline">
                📎 Upload image
              </button>
              {mediaList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaList.map((m) => (
                    <div key={m.id} className="relative">
                      <img src={m.url} alt="" className="h-16 w-16 rounded border border-gray/200 object-cover" />
                      <button onClick={() => deleteEventMedia(selected.id, m.id)} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details>
              <summary className="cursor-pointer text-xs text-gray">JSON brut</summary>
              <JsonBlock data={selected} />
            </details>
          </div>
        ) : (
          <p className="text-xs text-gray">Cliquez un événement dans la liste.</p>
        )}
      </div>
    </div>
  );
}

// ─── Listings tab ───

const LISTING_STATUS_LABELS: Record<string, string> = {
  open: 'Ouverte', pending: 'En attente', in_progress: 'En cours', closed: 'Terminée', cancelled: 'Annulée',
};

const LISTING_TYPE_LABELS: Record<string, string> = { offer: 'Offre', request: 'Demande' };

function ListingsPanel() {
  const { t } = useTranslation('admin');
  const [listings, setListings] = useState<unknown[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateListingPayload>({ title: '', listing_type: 'offer', description: '', price_cents: 0 });
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<{ id: string; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setError(null);
    try { const r = await listingsService.list(); setListings(ensureArray(r)); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function create() {
    if (!form.title.trim()) return;
    setLoading(true); setError(null);
    try { const r = await listingsService.create(form); setResponse(r); await load(); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function getOne(id: string) {
    setLoading(true); setError(null); setContentHtml(null); setMediaList([]);
    try { const r = await listingsService.getById(id); setSelected(r as any); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function del(id: string) {
    setLoading(true); setError(null);
    try { await listingsService.delete(id); setResponse({ deleted: id }); await load(); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  async function loadContent(id: string) {
    setLoading(true); setError(null);
    try {
      const r: any = await listingsService.getContent(id);
      const html = r?.body_html ?? r?.body ?? r?.html ?? JSON.stringify(r);
      setContentHtml(DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'loading', 'src', 'alt'] }));
      if (r?.photos) setMediaList((r.photos as any[]).map((p: any) => { const mid = extractMediaId(p); return { id: mid, url: mediaUrl(mid)! }; }));
    } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  function handleMediaUpload(id: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    listingsService.uploadMedia(id, file)
      .then((r) => {
        setResponse(r);
        const mid = extractMediaId(r);
        setMediaList((prev) => [...prev, { id: mid, url: mediaUrl(mid)! }]);
      })
      .catch((e: any) => setError(e?.message ?? 'Error'))
      .finally(() => setLoading(false));
  }

  async function deleteMedia(listingId: string, mediaId: string) {
    setLoading(true); setError(null);
    try { await listingsService.deleteMedia(listingId, mediaId); setMediaList((prev) => prev.filter((m) => m.id !== mediaId)); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-gray/200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-navy">Annonces</h3>
            <Button onClick={load} disabled={loading}>↻</Button>
          </div>
          <div className="max-h-80 overflow-auto">
            {(listings as any[]).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between border-b border-gray/100 py-2">
                <button onClick={() => getOne(l.id)} className="text-left text-sm text-navy hover:text-orange">
                  <span className="text-[10px] uppercase text-gray">{LISTING_TYPE_LABELS[l.listingType] ?? l.listingType ?? l.type}</span>
                  <span className="ml-1">{l.title}</span>
                  <span className="ml-1 text-[10px] text-gray">{LISTING_STATUS_LABELS[l.status] ?? l.status}</span>
                </button>
                <button onClick={() => del(l.id)} className="text-xs text-red-500 hover:underline">del</button>
              </div>
            ))}
            {!listings.length && <p className="py-4 text-center text-xs text-gray">Aucune annonce. Cliquez ↻</p>}
          </div>
        </div>

        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Créer une annonce</h3>
          <div className="flex flex-col gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre *" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value as 'offer' | 'request' })} className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange">
              <option value="offer">Offre (offer)</option>
              <option value="request">Demande (request)</option>
            </select>
            <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <input type="number" value={form.price_cents ?? 0} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} placeholder="Prix en centimes (0 = gratuit)" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <Button onClick={create} disabled={loading || !form.title.trim()}>Créer</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray/200 p-4">
        <h3 className="mb-3 font-semibold text-navy">Détail de l'annonce</h3>
        {selected ? (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-navy">{selected.title as string}</h4>
            <FieldRow label="ID" value={selected.id as string} />
            <FieldRow label="Statut" value={LISTING_STATUS_LABELS[selected.status as string] ?? (selected.status as string)} />
            <FieldRow label="Type" value={LISTING_TYPE_LABELS[selected.listingType as string] ?? (selected.listingType as string)} />
            <FieldRow label="Créateur" value={(selected.creatorId as string)?.slice(0, 8) + '…'} />
            <FieldRow label="Quartier" value={selected.neighbourhoodId as string} />
            <FieldRow label="Prix" value={(selected.priceCents as number) > 0 ? `${selected.priceCents} centimes` : 'Gratuit'} />
            <FieldRow label="Créé le" value={selected.createdAt ? new Date(selected.createdAt as string).toLocaleString() : null} />
            <FieldRow label="Description" value={(selected.description as string)?.slice(0, 200)} />

            <button onClick={() => loadContent(selected.id as string)} disabled={loading} className="text-xs text-orange underline">
              📄 Voir contenu enrichi
            </button>

            {contentHtml && (
              <div
                className="max-h-80 overflow-auto rounded border border-gray/200 bg-white p-3 text-xs"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}

            {/* Media upload */}
            <div className="border-t border-gray/100 pt-3">
              <p className="mb-1 text-xs font-medium text-gray">Photos</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={() => handleMediaUpload(selected.id as string)} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={loading} className="text-xs text-orange underline">
                📎 Upload photo
              </button>
              {mediaList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaList.map((m) => (
                    <div key={m.id} className="relative">
                      <img src={m.url} alt="" className="h-16 w-16 rounded border border-gray/200 object-cover" />
                      <button onClick={() => deleteMedia(selected.id as string, m.id)} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details>
              <summary className="cursor-pointer text-xs text-gray">JSON brut</summary>
              <JsonBlock data={selected} />
            </details>
          </div>
        ) : (
          <p className="text-xs text-gray">Cliquez une annonce dans la liste.</p>
        )}
      </div>
    </div>
  );
}

// ─── Media tab ───

function MediaPanel() {
  const { user } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleAvatarChange() {
    const file = avatarRef.current?.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    usersService.uploadAvatar(file).then(setResponse).catch((e: any) => setError(e?.message ?? 'Error')).finally(() => setLoading(false));
  }
  async function deleteAvatar() {
    setLoading(true); setError(null);
    try { await usersService.deleteAvatar(); setResponse({ deleted: 'avatar' }); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  function handleBannerChange() {
    const file = bannerRef.current?.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    usersService.uploadBanner(file).then(setResponse).catch((e: any) => setError(e?.message ?? 'Error')).finally(() => setLoading(false));
  }
  async function deleteBanner() {
    setLoading(true); setError(null);
    try { await usersService.deleteBanner(); setResponse({ deleted: 'banner' }); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }
  async function loadProfile() {
    setLoading(true); setError(null);
    try { const r = await usersService.getMe(); setResponse(r); } catch (e: any) { setError(e?.message ?? 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Avatar</h3>
          <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <div className="flex gap-2">
            <Button onClick={() => avatarRef.current?.click()} disabled={loading}>Upload</Button>
            <Button onClick={deleteAvatar} disabled={loading}>Supprimer</Button>
          </div>
          {user?.profilePictureMongoId && (
            <p className="mt-2 text-xs text-gray">Media ID MongoDB : {user.profilePictureMongoId}</p>
          )}
        </div>
        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Bannière</h3>
          <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          <div className="flex gap-2">
            <Button onClick={() => bannerRef.current?.click()} disabled={loading}>Upload</Button>
            <Button onClick={deleteBanner} disabled={loading}>Supprimer</Button>
          </div>
          {user?.bannerMongoId && (
            <p className="mt-2 text-xs text-gray">Media ID MongoDB : {user.bannerMongoId}</p>
          )}
        </div>
        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Profil complet</h3>
          <Button onClick={loadProfile} disabled={loading}>GET /users/me</Button>
          {user && (
            <div className="mt-2">
              <FieldRow label="ID" value={user.id} />
              <FieldRow label="Email" value={user.email} />
              <FieldRow label="Rôle" value={user.role} />
              <FieldRow label="Quartier" value={user.neighbourhoodId} />
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-gray/200 p-4">
        <h3 className="mb-3 font-semibold text-navy">Réponse API</h3>
        {error && <p className="mb-2 text-xs text-red-600">Erreur : {error}</p>}
        {response ? <JsonBlock data={response} /> : <p className="text-xs text-gray">Exécutez une action pour voir la réponse.</p>}
      </div>
    </div>
  );
}

// ─── Main ApiExplorer ───

const ENTITIES: { key: EntityTab; label: string }[] = [
  { key: 'messages', label: 'Messages' },
  { key: 'events', label: 'Events' },
  { key: 'listings', label: 'Listings' },
  { key: 'media', label: 'Media' },
];

export function ApiExplorer() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<EntityTab>('messages');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-navy">{t('api.title', 'API Explorer')}</h2>
        <p className="mt-1 text-sm text-gray">{t('api.subtitle', 'Test REST API CRUD routes backed by MongoDB collections.')}</p>
      </div>

      <nav className="flex gap-0 border-b border-gray/20">
        {ENTITIES.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-orange text-orange' : 'text-gray hover:text-navy'}`}>
            {label}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'messages' && <MessagesPanel />}
        {tab === 'events' && <EventsPanel />}
        {tab === 'listings' && <ListingsPanel />}
        {tab === 'media' && <MediaPanel />}
      </div>
    </div>
  );
}
