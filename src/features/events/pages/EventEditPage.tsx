import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { FullPageLoader } from '@/components/FullPageLoader';
import { EventForm } from '../components/EventForm';
import { EventMedia } from '../components/EventMedia';
import { useEvent, useEventContent } from '../hooks/useEvents';
import { useUpdateEvent, useUpdateEventContent } from '../hooks/useEventMutations';
import { toDatetimeLocal } from '../format';

export function EventEditPage() {
  const { t } = useTranslation('events');
  const { eventId: id = '' } = useParams();

  const { data: event, isLoading } = useEvent(id);
  const { data: content } = useEventContent(id);
  const update = useUpdateEvent(id);
  const updateContent = useUpdateEventContent(id);

  const [bodyHtml, setBodyHtml] = useState('');
  useEffect(() => {
    if (content) setBodyHtml(content.body_html ?? '');
  }, [content]);

  if (isLoading || !event) return <FullPageLoader />;

  const saveContent = (e: React.FormEvent) => {
    e.preventDefault();
    updateContent.mutate({ body_html: bodyHtml || undefined });
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link to={`/events/${id}`} className="text-sm text-orange underline">
        ← {t('detail.back')}
      </Link>
      <h1 className="my-6 text-xl font-bold text-navy">{t('edit.title')}</h1>

      <EventForm
        submitLabel={t('edit.submit')}
        submitting={update.isPending}
        defaultValues={{
          title: event.title,
          description: event.description ?? undefined,
          category_id: event.categoryId ?? undefined,
          neighbourhood_id: event.neighbourhoodId ?? undefined,
          starts_at: toDatetimeLocal(event.startsAt),
          ends_at: toDatetimeLocal(event.endsAt),
          max_participants: event.maxParticipants ?? undefined,
          cost_euros: event.costCents / 100,
          refund_deadline_hours: event.refundDeadlineHours,
          invite_code: event.inviteCode ?? undefined,
        }}
        onSubmit={(payload) => update.mutate(payload)}
      />
      {update.isSuccess && <p className="mt-2 text-sm text-success">{t('edit.saved')}</p>}

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-navy">{t('edit.content_title')}</h2>
        <form onSubmit={saveContent} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy">{t('edit.body_html')}</span>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={5}
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          <Button type="submit" disabled={updateContent.isPending}>
            {t('edit.save_content')}
          </Button>
          {updateContent.isSuccess && (
            <p className="text-sm text-success">{t('edit.content_saved')}</p>
          )}
        </form>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-navy">{t('edit.media')}</h2>
        <EventMedia id={id} />
      </section>
    </div>
  );
}
