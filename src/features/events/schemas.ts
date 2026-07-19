import { z } from 'zod';
import type { TFunction } from 'i18next';

// Convertit '' / null en undefined avant validation numérique optionnelle.
const optionalNonNegInt = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number({ message: 'invalid' }).int().min(0).optional(),
);
const optionalPositiveInt = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number({ message: 'invalid' }).int().min(1).optional(),
);

// Formulaire événement (coût saisi en euros → cost_cents à l'envoi).
export function eventFormSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(1, t('form.required')).max(200),
    description: z.string().max(2000).optional(),
    category_id: z.number().int().optional(),
    neighbourhood_id: z.string().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
    max_participants: optionalPositiveInt,
    cost_euros: z.coerce.number({ message: t('form.cost_invalid') }).min(0, t('form.cost_invalid')),
    refund_deadline_hours: optionalNonNegInt,
    invite_code: z.string().max(100).optional(),
  });
}

export type EventFormValues = z.infer<ReturnType<typeof eventFormSchema>>;
