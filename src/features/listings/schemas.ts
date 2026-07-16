import { z } from 'zod';
import type { TFunction } from 'i18next';

// Schéma du formulaire d'annonce (saisie en euros côté UI ; conversion en
// centimes au moment de l'envoi).
export function listingFormSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(1, t('form.required')).max(200),
    listing_type: z.enum(['offer', 'request']),
    description: z.string().max(2000).optional(),
    category_id: z.number().int().optional(),
    // ⚠️ PAS un UUID : le back identifie les quartiers par pgId (ex. "nb-downtown").
    neighbourhood_id: z.string().optional(),
    price_euros: z.coerce
      .number({ message: t('form.price_invalid') })
      .min(0, t('form.price_invalid')),
  });
}

export type ListingFormValues = z.infer<ReturnType<typeof listingFormSchema>>;
