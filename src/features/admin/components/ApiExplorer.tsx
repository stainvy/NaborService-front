import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { RefreshCw, FileText, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import type { NaborEvent, CreateEventPayload } from '@/services/events.service';
import type { CreateListingPayload } from '@/services/listings.service';
import { useAuth } from '@/hooks/useAuth';
import { env } from '@/lib/env';
import { mediaUrl } from '@/lib/media';
import { getAccessToken } from '@/lib/tokenStore';

import {
  useExplorerEvents,
  useExplorerEventContent,
  useCreateExplorerEvent,
  usePublishEvent,
  useOpenEvent,
  useCompleteEvent,
  useCancelEvent,
  useUploadEventMedia,
  useDeleteEventMedia,
  useExplorerListings,
  useExplorerListingContent,
  useCreateExplorerListing,
  useDeleteExplorerListing,
  useUploadListingMedia,
  useDeleteListingMedia,
  useUploadAvatarExplorer,
  useDeleteAvatarExplorer,
  useUploadBannerExplorer,
  useDeleteBannerExplorer,
  useLoadOwnProfile,
} from '../hooks/useApiExplorer';

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

function extractMediaId(r: any): string {
  return r?.mediaId ?? r?.id ?? r?._id ?? String(r);
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded bg-admin-bg p-3 font-mono text-xs leading-relaxed text-admin-text">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function FieldRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (value == null) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-24 shrink-0 font-medium text-admin-muted">{label}</span>
      <span className="truncate text-admin-text">{value}</span>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEventPayload>({ title: '', description: '', cost_cents: 0, max_participants: 50 });
  const [showContent, setShowContent] = useState(false);
  const [cancelReason, setCancelReason] = useState<{ id: string } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [mediaList, setMediaList] = useState<{ id: string; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: eventsRaw, isFetching: loadingList, refetch } = useExplorerEvents();
  const events = ensureArray<NaborEvent>(eventsRaw);
  const selected = events.find((e) => e.id === selectedId) ?? null;
  const createEvent = useCreateExplorerEvent();
  const { data: content, refetch: loadContent } = useExplorerEventContent(showContent ? (selectedId ?? undefined) : undefined);
  const publish = usePublishEvent();
  const open = useOpenEvent();
  const complete = useCompleteEvent();
  const cancel = useCancelEvent();
  const uploadMedia = useUploadEventMedia();
  const deleteMedia = useDeleteEventMedia();

  const loading = loadingList || createEvent.isPending || publish.isPending || open.isPending || complete.isPending || cancel.isPending;

  function handleCreate() {
    if (!form.title.trim()) return;
    createEvent.mutate(form);
  }

  function eventMediaUrl(eventId: string, name: string) {
    const token = getAccessToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${env.apiUrl}/events/${eventId}/media/${encodeURIComponent(name)}${qs}`;
  }

  function handleMediaUpload(eventId: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    uploadMedia.mutate({ eventId, file }, {
      onSuccess: (r) => {
        const name = r.mediaId;
        setMediaList((prev) => [...prev, { id: name, url: eventMediaUrl(eventId, name) }]);
      },
    });
  }

  function confirmCancel() {
    if (!cancelReason) return;
    cancel.mutate({ id: cancelReason.id, reason: reasonText }, {
      onSuccess: () => { setCancelReason(null); setReasonText(''); },
    });
  }

  const lifecyleActions: { label: string; onClick: (id: string) => void }[] = [
    { label: 'Publier', onClick: (id) => publish.mutate(id) },
    { label: 'Ouvrir inscriptions', onClick: (id) => open.mutate(id) },
    { label: 'Terminer', onClick: (id) => complete.mutate(id) },
    { label: 'Annuler', onClick: (id) => setCancelReason({ id }) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-admin-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-admin-text">{t('api.events')}</h3>
            <Button tone="admin" onClick={() => refetch()} disabled={loadingList}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="max-h-80 overflow-auto">
            {events.map((ev) => (
              <button key={ev.id} onClick={() => { setSelectedId(ev.id); setShowContent(false); setMediaList([]); }} className={`block w-full px-3 py-2 text-left text-sm ${selectedId === ev.id ? 'bg-admin-accent/10 text-admin-accent font-medium' : 'text-admin-text hover:bg-admin-bg'}`}>
                <span className="text-[10px] uppercase text-admin-muted">{EVENT_STATUS_LABELS[ev.status] ?? ev.status}</span>
                <span className="ml-1">{ev.title}</span>
              </button>
            ))}
            {!events.length && <p className="py-4 text-center text-xs text-admin-muted">{t('api.no_events')}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">{t('api.create_event')}</h3>
          <div className="flex flex-col gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre *" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <div className="flex gap-2">
              <input type="number" value={form.cost_cents ?? 0} onChange={(e) => setForm({ ...form, cost_cents: Number(e.target.value) })} placeholder="Prix (centimes)" className="w-32 rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
              <input type="number" value={form.max_participants ?? 50} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} placeholder="Max participants" className="w-36 rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            </div>
            <Button tone="admin" onClick={handleCreate} disabled={loading || !form.title.trim()}>{t('api.create_draft')}</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-admin-border p-4">
        <h3 className="mb-3 font-semibold text-admin-text">{t('api.event_detail')}</h3>
        {selected ? (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-admin-text">{selected.title}</h4>
            <FieldRow label="ID" value={selected.id} />
            <FieldRow label="Statut" value={EVENT_STATUS_LABELS[selected.status] ?? selected.status} />
            <FieldRow label="Créateur" value={selected.creatorId ? selected.creatorId.slice(0, 8) + '…' : null} />
            <FieldRow label="Quartier" value={selected.neighbourhoodId ?? null} />
            <FieldRow label="Groupe" value={selected.groupId ? selected.groupId.slice(0, 8) + '…' : null} />
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
                <button key={a.label} onClick={() => a.onClick(selected.id)} disabled={loading} className="rounded border border-admin-border px-2 py-1 text-xs text-admin-text hover:bg-admin-accent/10">
                  {a.label}
                </button>
              ))}
            </div>

            <button onClick={() => { setShowContent(true); loadContent(); }} disabled={loading} className="flex items-center gap-1 text-xs text-admin-accent underline">
              <FileText className="h-3 w-3" /> {t('api.view_rich_content')}
            </button>

            {showContent && content != null && (
              <div
                className="max-h-80 overflow-auto rounded border border-admin-border bg-surface p-3 text-xs"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    (content as any)?.body_html ?? (content as any)?.body ?? (content as any)?.html ?? JSON.stringify(content),
                    { ADD_ATTR: ['target', 'loading'] },
                  ),
                }}
              />
            )}

            <div className="border-t border-admin-border/60 pt-3">
              <p className="mb-1 text-xs font-medium text-admin-muted">{t('api.media')}</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={() => handleMediaUpload(selected.id)} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={loading} className="flex items-center gap-1 text-xs text-admin-accent underline">
                <Paperclip className="h-3 w-3" /> {t('api.upload_image')}
              </button>
              {mediaList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaList.map((m) => (
                    <div key={m.id} className="relative">
                      <img src={m.url} alt="" className="h-16 w-16 rounded border border-admin-border object-cover" />
                      <button onClick={() => deleteMedia.mutate({ eventId: selected.id, filename: m.id }, { onSuccess: () => setMediaList((prev) => prev.filter((x) => x.id !== m.id)) })} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"><X className="h-2.5 w-2.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details>
              <summary className="cursor-pointer text-xs text-admin-muted">JSON brut</summary>
              <JsonBlock data={selected} />
            </details>
          </div>
        ) : (
          <p className="text-xs text-admin-muted">{t('api.click_event')}</p>
        )}
      </div>

      <Modal
        open={Boolean(cancelReason)}
        onClose={() => { setCancelReason(null); setReasonText(''); }}
        title="Annuler l'événement"
      >
        <p className="mb-3 text-sm text-admin-muted">Motif d'annulation (facultatif) — sera enregistré.</p>
        <input
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          placeholder="Motif…"
          className="mb-4 w-full rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
        />
        <div className="flex justify-end gap-2">
          <Button tone="admin" variant="secondary" onClick={() => { setCancelReason(null); setReasonText(''); }} disabled={cancel.isPending}>
            Fermer
          </Button>
          <Button tone="admin" onClick={confirmCancel} disabled={cancel.isPending} className="!bg-error hover:!opacity-90">
            {cancel.isPending ? '…' : "Annuler l'événement"}
          </Button>
        </div>
      </Modal>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [form, setForm] = useState<CreateListingPayload>({ title: '', listing_type: 'offer', description: '', price_cents: 0 });
  const [mediaList, setMediaList] = useState<{ id: string; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: listingsRaw, isFetching: loadingList, refetch } = useExplorerListings();
  const listings = ensureArray<Record<string, unknown>>(listingsRaw);
  const selected = listings.find((l) => l.id === selectedId) ?? null;
  const create = useCreateExplorerListing();
  const del = useDeleteExplorerListing();
  const { data: content, refetch: loadContent } = useExplorerListingContent(showContent ? (selectedId ?? undefined) : undefined);
  const uploadMedia = useUploadListingMedia();
  const deleteMedia = useDeleteListingMedia();

  const loading = loadingList || create.isPending || del.isPending;

  function handleCreate() {
    if (!form.title.trim()) return;
    create.mutate(form);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    del.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
  }

  function handleMediaUpload(id: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    uploadMedia.mutate({ listingId: id, file }, {
      onSuccess: (r) => {
        const mid = extractMediaId(r);
        setMediaList((prev) => [...prev, { id: mid, url: mediaUrl(mid)! }]);
      },
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-admin-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-admin-text">{t('api.listings')}</h3>
            <Button tone="admin" onClick={() => refetch()} disabled={loadingList}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="max-h-80 overflow-auto">
            {listings.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between border-b border-admin-border/60 py-2">
                <button onClick={() => { setSelectedId(l.id); setShowContent(false); setMediaList([]); }} className="text-left text-sm text-admin-text hover:text-admin-accent">
                  <span className="text-[10px] uppercase text-admin-muted">{LISTING_TYPE_LABELS[l.listingType] ?? l.listingType ?? l.type}</span>
                  <span className="ml-1">{l.title}</span>
                  <span className="ml-1 text-[10px] text-admin-muted">{LISTING_STATUS_LABELS[l.status] ?? l.status}</span>
                </button>
                <button onClick={() => setPendingDelete(l.id)} className="text-xs text-red-500 hover:underline">{t('api.delete')}</button>
              </div>
            ))}
            {!listings.length && <p className="py-4 text-center text-xs text-admin-muted">{t('api.no_listings')}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">{t('api.create_listing')}</h3>
          <div className="flex flex-col gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre *" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value as 'offer' | 'request' })} className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent">
              <option value="offer">Offre (offer)</option>
              <option value="request">Demande (request)</option>
            </select>
            <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <input type="number" value={form.price_cents ?? 0} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} placeholder="Prix en centimes (0 = gratuit)" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <Button tone="admin" onClick={handleCreate} disabled={loading || !form.title.trim()}>{t('api.create')}</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-admin-border p-4">
        <h3 className="mb-3 font-semibold text-admin-text">{t('api.listing_detail')}</h3>
        {selected ? (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-admin-text">{selected.title as string}</h4>
            <FieldRow label="ID" value={selected.id as string} />
            <FieldRow label="Statut" value={LISTING_STATUS_LABELS[selected.status as string] ?? (selected.status as string)} />
            <FieldRow label="Type" value={LISTING_TYPE_LABELS[selected.listingType as string] ?? (selected.listingType as string)} />
            <FieldRow label="Créateur" value={selected.creatorId ? (selected.creatorId as string).slice(0, 8) + '…' : null} />
            <FieldRow label="Quartier" value={selected.neighbourhoodId as string} />
            <FieldRow label="Prix" value={(selected.priceCents as number) > 0 ? `${selected.priceCents} centimes` : 'Gratuit'} />
            <FieldRow label="Créé le" value={selected.createdAt ? new Date(selected.createdAt as string).toLocaleString() : null} />
            <FieldRow label="Description" value={(selected.description as string)?.slice(0, 200)} />

            <button onClick={() => { setShowContent(true); loadContent(); }} disabled={loading} className="flex items-center gap-1 text-xs text-admin-accent underline">
              <FileText className="h-3 w-3" /> {t('api.view_rich_content')}
            </button>

            {showContent && content != null && (
              <div
                className="max-h-80 overflow-auto rounded border border-admin-border bg-surface p-3 text-xs"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    (content as any)?.body_html ?? (content as any)?.body ?? (content as any)?.html ?? JSON.stringify(content),
                    { ADD_ATTR: ['target', 'loading', 'src', 'alt'] },
                  ),
                }}
              />
            )}

            <div className="border-t border-admin-border/60 pt-3">
              <p className="mb-1 text-xs font-medium text-admin-muted">{t('api.photos')}</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={() => handleMediaUpload(selected.id as string)} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={loading} className="flex items-center gap-1 text-xs text-admin-accent underline">
                <Paperclip className="h-3 w-3" /> {t('api.upload_photo')}
              </button>
              {mediaList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaList.map((m) => (
                    <div key={m.id} className="relative">
                      <img src={m.url} alt="" className="h-16 w-16 rounded border border-admin-border object-cover" />
                      <button onClick={() => deleteMedia.mutate({ listingId: selected.id as string, mediaId: m.id }, { onSuccess: () => setMediaList((prev) => prev.filter((x) => x.id !== m.id)) })} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"><X className="h-2.5 w-2.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details>
              <summary className="cursor-pointer text-xs text-admin-muted">JSON brut</summary>
              <JsonBlock data={selected} />
            </details>
          </div>
        ) : (
          <p className="text-xs text-admin-muted">{t('api.click_listing')}</p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        tone="admin"
        destructive
        title={t('api.delete')}
        message={t('api.confirm_delete_listing')}
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

// ─── Media tab ───

function MediaPanel() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [response, setResponse] = useState<unknown>(null);

  const uploadAvatar = useUploadAvatarExplorer();
  const deleteAvatar = useDeleteAvatarExplorer();
  const uploadBanner = useUploadBannerExplorer();
  const deleteBanner = useDeleteBannerExplorer();
  const loadProfile = useLoadOwnProfile();

  const loading = uploadAvatar.isPending || deleteAvatar.isPending || uploadBanner.isPending || deleteBanner.isPending || loadProfile.isPending;

  function handleAvatarChange() {
    const file = avatarRef.current?.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, { onSuccess: setResponse });
  }
  function handleBannerChange() {
    const file = bannerRef.current?.files?.[0];
    if (!file) return;
    uploadBanner.mutate(file, { onSuccess: setResponse });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">Avatar</h3>
          <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <div className="flex gap-2">
            <Button tone="admin" onClick={() => avatarRef.current?.click()} disabled={loading}>Upload</Button>
            <Button tone="admin" variant="secondary" onClick={() => deleteAvatar.mutate(undefined, { onSuccess: () => setResponse({ deleted: 'avatar' }) })} disabled={loading}>{t('api.delete')}</Button>
          </div>
          {user?.profilePictureMongoId && (
            <p className="mt-2 text-xs text-admin-muted">Media ID MongoDB : {user.profilePictureMongoId}</p>
          )}
        </div>
        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">Bannière</h3>
          <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          <div className="flex gap-2">
            <Button tone="admin" onClick={() => bannerRef.current?.click()} disabled={loading}>Upload</Button>
            <Button tone="admin" variant="secondary" onClick={() => deleteBanner.mutate(undefined, { onSuccess: () => setResponse({ deleted: 'banner' }) })} disabled={loading}>{t('api.delete')}</Button>
          </div>
          {user?.bannerMongoId && (
            <p className="mt-2 text-xs text-admin-muted">Media ID MongoDB : {user.bannerMongoId}</p>
          )}
        </div>
        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">{t('api.full_profile')}</h3>
          <Button tone="admin" onClick={() => loadProfile.mutate(undefined, { onSuccess: setResponse })} disabled={loading}>GET /users/me</Button>
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
      <div className="rounded-lg border border-admin-border p-4">
        <h3 className="mb-3 font-semibold text-admin-text">{t('api.api_response')}</h3>
        {response ? <JsonBlock data={response} /> : <p className="text-xs text-admin-muted">{t('api.run_action_hint')}</p>}
      </div>
    </div>
  );
}

// ─── Main ApiExplorer ───

const ENTITIES: { key: EntityTab; labelKey: string }[] = [
  { key: 'events', labelKey: 'api.tab_events' },
  { key: 'listings', labelKey: 'api.tab_listings' },
  { key: 'media', labelKey: 'api.tab_media' },
];

export function ApiExplorer() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<EntityTab>('events');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('api.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('api.subtitle')}</p>
      </div>

      <nav className="flex gap-0 border-b border-admin-border">
        {ENTITIES.map(({ key, labelKey }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-admin-accent text-admin-accent' : 'text-admin-muted hover:text-admin-text'}`}>
            {t(labelKey)}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'events' && <EventsPanel />}
        {tab === 'listings' && <ListingsPanel />}
        {tab === 'media' && <MediaPanel />}
      </div>
    </div>
  );
}
