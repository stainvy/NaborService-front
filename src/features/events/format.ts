// Formatage dates/coût des événements (dates ISO 8601 → locale ; coût en centimes).
export function formatDateTime(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function formatEuros(cents: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

// ISO → valeur d'un <input type="datetime-local"> (heure locale, "YYYY-MM-DDTHH:mm").
export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
