import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { NeighbourhoodSelect } from '@/features/listings/components/NeighbourhoodSelect';
import { EventCategorySelect } from './EventCategorySelect';
import { eventFormSchema, type EventFormValues } from '../schemas';
import type { CreateEventPayload } from '../types';

interface Props {
  defaultValues?: Partial<EventFormValues>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (payload: CreateEventPayload) => void;
}

const toIso = (local?: string) => (local ? new Date(local).toISOString() : undefined);

// Formulaire partagé création/édition d'un événement.
export function EventForm({ defaultValues, submitLabel, submitting, onSubmit }: Props) {
  const { t } = useTranslation('events');
  const schema = useMemo(() => eventFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cost_points: 0, ...defaultValues },
  });

  const submit = handleSubmit((v) => {
    onSubmit({
      title: v.title,
      description: v.description || undefined,
      category_id: v.category_id,
      neighbourhood_id: v.neighbourhood_id,
      starts_at: toIso(v.starts_at),
      ends_at: toIso(v.ends_at),
      max_participants: v.max_participants,
      // 1 point = 1 unité de cost_cents (système de points, comme les annonces).
      cost_cents: v.cost_points,
      refund_deadline_hours: v.refund_deadline_hours,
      invite_code: v.invite_code || undefined,
    });
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <TextField label={t('form.title')} error={errors.title?.message} {...register('title')} />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-fg">{t('form.description')}</span>
          <textarea
            {...register('description')}
            rows={4}
            className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
          />
        </label>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 border-t border-gray/20 pt-4 sm:grid-cols-2">
        <TextField label={t('form.starts_at')} type="datetime-local" {...register('starts_at')} />
        <TextField label={t('form.ends_at')} type="datetime-local" {...register('ends_at')} />
      </div>

      {/* Catégorie / quartier */}
      <div className="flex flex-col gap-4 border-t border-gray/20 pt-4">
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <EventCategorySelect
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
      </div>

      {/* Capacité / coût / remboursement / code */}
      <div className="grid grid-cols-1 gap-4 border-t border-gray/20 pt-4 sm:grid-cols-2">
        <TextField
          label={t('form.max_participants')}
          type="number"
          min="1"
          {...register('max_participants')}
        />
        <TextField
          label={t('form.cost_points')}
          type="number"
          step="1"
          min="0"
          error={errors.cost_points?.message}
          {...register('cost_points')}
        />
        <TextField
          label={t('form.refund_deadline_hours')}
          type="number"
          min="0"
          {...register('refund_deadline_hours')}
        />
        <TextField label={t('form.invite_code')} {...register('invite_code')} />
      </div>
      <p className="-mt-2 text-xs text-gray">{t('form.cost_hint')}</p>

      <Button type="submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
