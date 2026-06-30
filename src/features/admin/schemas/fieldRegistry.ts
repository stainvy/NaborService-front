/** Type d'un champ MongoDB. */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'array'
  | 'binary'
  | 'encrypted';

/** Un champ queryable dans une collection. */
export interface FieldDef {
  name: string; // chemin pointé, ex. "parties.provider.email"
  label: string; // nom court affiché
  type: FieldType;
  indexed: boolean;
  sensitive: boolean; // masqué dans les previews par défaut
  lifecycle?: string; // ex. "deleted", "anonymised", "signed"
  description?: string;
}

/** Une collection MongoDB exposée au DSL. */
export interface CollectionDef {
  id: string; // nom de collection
  label: string;
  description: string;
  pgRefField: string; // champ qui référence PostgreSQL (ex. pg_message_id)
  fields: FieldDef[];
  lifecycleFilters: LifecycleFilter[];
}

/** Filtre lifecycle prêt à l'emploi. */
export interface LifecycleFilter {
  label: string;
  field: string;
  operator: 'IS NULL' | 'IS NOT NULL' | '>' | '<';
  value?: string;
}

// ─── Registry ──────────────────────────────────────────────

export const COLLECTIONS: CollectionDef[] = [
  {
    id: 'messages',
    label: 'Messages',
    description: 'Messages chiffrés (DM, groupe, quartier). Contenu AES-256-GCM.',
    pgRefField: 'pg_message_id',
    fields: [
      { name: 'pg_message_id', label: 'PG Message ID', type: 'string', indexed: true, sensitive: false },
      { name: 'pg_group_id', label: 'PG Group ID', type: 'string', indexed: true, sensitive: false },
      { name: 'pg_sender_id', label: 'PG Sender ID', type: 'string', indexed: true, sensitive: false },
      { name: 'type', label: 'Type', type: 'string', indexed: false, sensitive: false, description: 'text | image | file | voice' },
      { name: 'sent_at', label: 'Envoyé le', type: 'date', indexed: true, sensitive: false },
      { name: 'edited_at', label: 'Édité le', type: 'date', indexed: false, sensitive: false },
      { name: 'deleted_at', label: 'Supprimé le', type: 'date', indexed: true, sensitive: false, lifecycle: 'deleted' },
      { name: 'content_encrypted', label: 'Contenu chiffré', type: 'encrypted', indexed: false, sensitive: true },
      { name: 'iv', label: 'IV', type: 'encrypted', indexed: false, sensitive: true },
      { name: 'auth_tag', label: 'Auth Tag', type: 'encrypted', indexed: false, sensitive: true },
      { name: 'attachments', label: 'Pièces jointes', type: 'array', indexed: false, sensitive: true, description: 'max 3 fichiers, 8 MB chacun' },
      { name: 'reactions', label: 'Réactions', type: 'array', indexed: false, sensitive: false },
    ],
    lifecycleFilters: [
      { label: 'Actifs (non supprimés)', field: 'deleted_at', operator: 'IS NULL' as const },
      { label: 'Supprimés', field: 'deleted_at', operator: 'IS NOT NULL' as const },
      { label: 'Édités', field: 'edited_at', operator: 'IS NOT NULL' as const },
    ],
  },
  {
    id: 'event_documents',
    label: 'Documents évènement',
    description: 'Contenu enrichi HTML, couverture, programme, pièces jointes.',
    pgRefField: 'pg_event_id',
    fields: [
      { name: 'pg_event_id', label: 'PG Event ID', type: 'string', indexed: true, sensitive: false },
      { name: 'body_html', label: 'Description HTML', type: 'string', indexed: false, sensitive: false },
      { name: 'cover', label: 'Couverture', type: 'object', indexed: false, sensitive: true, description: 'data: BinData, mimetype, size_bytes' },
      { name: 'programme', label: 'Programme', type: 'array', indexed: false, sensitive: false, description: 'time + label' },
      { name: 'location.address', label: 'Adresse', type: 'string', indexed: false, sensitive: false },
      { name: 'location.geocode', label: 'Géocode BAN', type: 'string', indexed: false, sensitive: false },
      { name: 'attachments', label: 'Pièces jointes', type: 'array', indexed: false, sensitive: true, description: 'data, name, mimetype, size_bytes' },
      { name: 'created_at', label: 'Créé le', type: 'date', indexed: false, sensitive: false },
      { name: 'updated_at', label: 'Mis à jour le', type: 'date', indexed: true, sensitive: false },
      { name: 'anonymised_at', label: 'Anonymisé le', type: 'date', indexed: true, sensitive: false, lifecycle: 'anonymised' },
    ],
    lifecycleFilters: [
      { label: 'Actifs', field: 'anonymised_at', operator: 'IS NULL' as const },
      { label: 'Anonymisés', field: 'anonymised_at', operator: 'IS NOT NULL' as const },
      { label: 'Modifiés récemment', field: 'updated_at', operator: 'IS NOT NULL' as const },
    ],
  },
  {
    id: 'listing_documents',
    label: 'Documents annonce',
    description: 'Contenu enrichi, photos, tags des annonces.',
    pgRefField: 'pg_listing_id',
    fields: [
      { name: 'pg_listing_id', label: 'PG Listing ID', type: 'string', indexed: true, sensitive: false },
      { name: 'body_html', label: 'Description HTML', type: 'string', indexed: false, sensitive: false },
      { name: 'photos', label: 'Photos', type: 'array', indexed: false, sensitive: true, description: 'max 8 photos, 5 MB chacune' },
      { name: 'tags', label: 'Tags', type: 'array', indexed: true, sensitive: false },
      { name: 'created_at', label: 'Créé le', type: 'date', indexed: false, sensitive: false },
      { name: 'updated_at', label: 'Mis à jour le', type: 'date', indexed: true, sensitive: false },
      { name: 'anonymised_at', label: 'Anonymisé le', type: 'date', indexed: true, sensitive: false, lifecycle: 'anonymised' },
    ],
    lifecycleFilters: [
      { label: 'Actifs', field: 'anonymised_at', operator: 'IS NULL' as const },
      { label: 'Anonymisés', field: 'anonymised_at', operator: 'IS NOT NULL' as const },
      { label: 'Avec tags', field: 'tags', operator: 'IS NOT NULL' as const },
    ],
  },
  {
    id: 'user_media',
    label: 'Médias utilisateur',
    description: 'Avatars et bannières compressés WebP.',
    pgRefField: 'pg_user_id',
    fields: [
      { name: 'pg_user_id', label: 'PG User ID', type: 'string', indexed: true, sensitive: false },
      { name: 'type', label: 'Type', type: 'string', indexed: true, sensitive: false, description: 'avatar | banner' },
      { name: 'mimetype', label: 'MIME Type', type: 'string', indexed: false, sensitive: false },
      { name: 'size_bytes', label: 'Taille (octets)', type: 'number', indexed: false, sensitive: false },
      { name: 'width_px', label: 'Largeur (px)', type: 'number', indexed: false, sensitive: false },
      { name: 'height_px', label: 'Hauteur (px)', type: 'number', indexed: false, sensitive: false },
      { name: 'uploaded_at', label: 'Uploadé le', type: 'date', indexed: true, sensitive: false },
      { name: 'replaced_at', label: 'Remplacé le', type: 'date', indexed: false, sensitive: false, lifecycle: 'replaced' },
    ],
    lifecycleFilters: [
      { label: 'Avatars', field: 'type', operator: '=' as any, value: 'avatar' },
      { label: 'Bannières', field: 'type', operator: '=' as any, value: 'banner' },
      { label: 'Jamais remplacés', field: 'replaced_at', operator: 'IS NULL' as const },
    ],
  },
  {
    id: 'contracts',
    label: 'Contrats & reçus',
    description: 'Contrats signés, reçus. Contient données personnelles → preview masquée.',
    pgRefField: 'pg_transaction_id',
    fields: [
      { name: 'pg_transaction_id', label: 'PG Transaction ID', type: 'string', indexed: true, sensitive: false },
      { name: 'type', label: 'Type', type: 'string', indexed: false, sensitive: false, description: 'contract | receipt' },
      { name: 'sha256_hash', label: 'SHA-256', type: 'string', indexed: true, sensitive: false },
      { name: 'parties.provider.pg_user_id', label: 'Prestataire ID', type: 'string', indexed: false, sensitive: true },
      { name: 'parties.provider.full_name', label: 'Prestataire nom', type: 'string', indexed: false, sensitive: true },
      { name: 'parties.provider.email', label: 'Prestataire email', type: 'string', indexed: false, sensitive: true },
      { name: 'parties.requester.pg_user_id', label: 'Demandeur ID', type: 'string', indexed: false, sensitive: true },
      { name: 'parties.requester.full_name', label: 'Demandeur nom', type: 'string', indexed: false, sensitive: true },
      { name: 'parties.requester.email', label: 'Demandeur email', type: 'string', indexed: false, sensitive: true },
      { name: 'listing_snapshot.title', label: 'Titre annonce', type: 'string', indexed: false, sensitive: false },
      { name: 'listing_snapshot.price_cents', label: 'Prix (centimes)', type: 'number', indexed: false, sensitive: false },
      { name: 'signature.canvas_b64', label: 'Signature canvas', type: 'binary', indexed: false, sensitive: true },
      { name: 'signature.signed_ip', label: 'IP signature', type: 'string', indexed: false, sensitive: true },
      { name: 'pdf', label: 'PDF', type: 'binary', indexed: false, sensitive: true },
      { name: 'signed_at', label: 'Signé le', type: 'date', indexed: true, sensitive: false, lifecycle: 'signed' },
      { name: 'created_at', label: 'Créé le', type: 'date', indexed: false, sensitive: false },
      { name: 'anonymised_at', label: 'Anonymisé le', type: 'date', indexed: true, sensitive: false, lifecycle: 'anonymised' },
    ],
    lifecycleFilters: [
      { label: 'Signés', field: 'signed_at', operator: 'IS NOT NULL' as const },
      { label: 'Non signés', field: 'signed_at', operator: 'IS NULL' as const },
      { label: 'Anonymisés', field: 'anonymised_at', operator: 'IS NOT NULL' as const },
      { label: 'Contrats', field: 'type', operator: '=' as any, value: 'contract' },
      { label: 'Reçus', field: 'type', operator: '=' as any, value: 'receipt' },
    ],
  },
  {
    id: 'event_tickets',
    label: 'Billets évènement',
    description: 'QR codes signés HMAC-SHA256 pour l\'entrée aux évènements.',
    pgRefField: 'pg_event_id',
    fields: [
      { name: 'pg_event_id', label: 'PG Event ID', type: 'string', indexed: true, sensitive: false },
      { name: 'pg_user_id', label: 'PG User ID', type: 'string', indexed: true, sensitive: false },
      { name: 'qr_payload.event_id', label: 'Event ID (QR)', type: 'string', indexed: false, sensitive: false },
      { name: 'qr_payload.user_id', label: 'User ID (QR)', type: 'string', indexed: false, sensitive: false },
      { name: 'qr_payload.first_name', label: 'Prénom (QR)', type: 'string', indexed: false, sensitive: true },
      { name: 'qr_payload.hmac_sha256', label: 'HMAC-SHA256', type: 'string', indexed: true, sensitive: true },
      { name: 'qr_png', label: 'QR PNG', type: 'binary', indexed: false, sensitive: true },
      { name: 'issued_at', label: 'Émis le', type: 'date', indexed: true, sensitive: false },
      { name: 'scanned_at', label: 'Scanné le', type: 'date', indexed: false, sensitive: false, lifecycle: 'scanned' },
    ],
    lifecycleFilters: [
      { label: 'Non scannés', field: 'scanned_at', operator: 'IS NULL' as const },
      { label: 'Scannés', field: 'scanned_at', operator: 'IS NOT NULL' as const },
    ],
  },
  {
    id: 'incident_documents',
    label: 'Documents incident',
    description: 'Rapports d\'incident avec photos (offline-first Java).',
    pgRefField: 'pg_incident_id',
    fields: [
      { name: 'pg_incident_id', label: 'PG Incident ID', type: 'string', indexed: true, sensitive: false },
      { name: 'body', label: 'Corps du rapport', type: 'string', indexed: false, sensitive: false },
      { name: 'photos', label: 'Photos', type: 'array', indexed: false, sensitive: true, description: 'data, mimetype, size_bytes, taken_at, synced_at' },
      { name: 'location_hint', label: 'Indice lieu', type: 'string', indexed: false, sensitive: false },
      { name: 'created_at', label: 'Créé le', type: 'date', indexed: false, sensitive: false },
      { name: 'updated_at', label: 'Mis à jour le', type: 'date', indexed: true, sensitive: false },
      { name: 'synced_at', label: 'Synchronisé le', type: 'date', indexed: true, sensitive: false, lifecycle: 'synced' },
    ],
    lifecycleFilters: [
      { label: 'Synchronisés', field: 'synced_at', operator: 'IS NOT NULL' as const },
      { label: 'Non synchronisés', field: 'synced_at', operator: 'IS NULL' as const },
    ],
  },
];

/** Couleurs par type de champ. */
export const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  string: 'bg-blue-100 text-blue-700',
  number: 'bg-amber-100 text-amber-700',
  boolean: 'bg-purple-100 text-purple-700',
  date: 'bg-green-100 text-green-700',
  object: 'bg-slate-100 text-slate-700',
  array: 'bg-cyan-100 text-cyan-700',
  binary: 'bg-red-100 text-red-700',
  encrypted: 'bg-orange-100 text-orange-700',
};
