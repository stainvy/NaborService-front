// Le back stocke les prix en CENTIMES (entier). L'UI saisit/affiche des euros.

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}

// Formate un montant en centimes selon la locale (0 → « gratuit » géré côté UI).
export function formatPrice(cents: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
    centsToEuros(cents),
  );
}
