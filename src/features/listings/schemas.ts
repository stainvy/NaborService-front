import { z } from 'zod';
import type { TFunction } from 'i18next';

// Schéma du formulaire d'annonce. Le prix suit le système de points de la
// plateforme (pas de conversion euros — 1 point = 1 unité de `price_cents`
// côté back, cf. listing-state-machine.service.ts qui débite `amountPoints`
// directement à partir de ce champ).
export function listingFormSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(1, t('form.required')).max(200),
    listing_type: z.enum(['offer', 'request']),
    description: z.string().max(2000).optional(),
    category_id: z.number().int().optional(),
    // ⚠️ PAS un UUID : le back identifie les quartiers par pgId (ex. "nb-downtown").
    neighbourhood_id: z.string().optional(),
    price_points: z.coerce
      .number({ message: t('form.price_invalid') })
      .int(t('form.price_invalid'))
      .min(0, t('form.price_invalid')),
  });
}

export type ListingFormValues = z.infer<ReturnType<typeof listingFormSchema>>;
