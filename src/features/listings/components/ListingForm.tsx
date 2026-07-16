import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { eurosToCents } from '@/lib/money';
import { CategorySelect } from './CategorySelect';
import { NeighbourhoodSelect } from './NeighbourhoodSelect';
import { listingFormSchema, type ListingFormValues } from '../schemas';
import { LISTING_TYPES, type CreateListingPayload } from '../types';

interface Props {
  defaultValues?: Partial<ListingFormValues>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (payload: CreateListingPayload) => void;
}

// Formulaire partagé création/édition (saisie prix en euros → centimes).
export function ListingForm({ defaultValues, submitLabel, submitting, onSubmit }: Props) {
  const { t } = useTranslation('listings');
  const schema = useMemo(() => listingFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { listing_type: 'offer', price_euros: 0, ...defaultValues },
  });

  const submit = handleSubmit((v) => {
    onSubmit({
      title: v.title,
      listing_type: v.listing_type,
      description: v.description || undefined,
      category_id: v.category_id,
      neighbourhood_id: v.neighbourhood_id,
      price_cents: eurosToCents(v.price_euros),
    });
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <TextField label={t('form.title')} error={errors.title?.message} {...register('title')} />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-navy">{t('form.type')}</span>
        <select {...register('listing_type')} className="rounded-md border border-gray px-3 py-2">
          {LISTING_TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`type.${ty}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-navy">{t('form.description')}</span>
        <textarea
          {...register('description')}
          rows={4}
          className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
        />
      </label>

      <Controller
        control={control}
        name="category_id"
        render={({ field }) => (
          <CategorySelect
            label={t('form.category')}
            emptyLabel={t('form.none')}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="neighbourhood_id"
        render={({ field }) => (
          <NeighbourhoodSelect
            label={t('form.neighbourhood')}
            emptyLabel={t('form.none')}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <TextField
        label={t('form.price_euros')}
        type="number"
        step="0.01"
        min="0"
        error={errors.price_euros?.message}
        {...register('price_euros')}
      />
      <p className="-mt-2 text-xs text-gray">{t('form.price_hint')}</p>

      <Button type="submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
