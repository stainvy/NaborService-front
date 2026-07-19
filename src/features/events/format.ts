// Formatage dates/coût des événements (dates ISO 8601 → locale ; coût en points).
export function formatDateTime(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

// Coût d'un événement en points : `costPoints` calculé par le back, sinon
// `costCents` tel quel (1 point = 1 unité, comme les annonces).
export function eventPoints(event: { costCents: number; costPoints?: unknown }): number {
  return typeof event.costPoints === 'number' ? event.costPoints : event.costCents;
}

// ISO → valeur d'un <input type="datetime-local"> (heure locale, "YYYY-MM-DDTHH:mm").
export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
