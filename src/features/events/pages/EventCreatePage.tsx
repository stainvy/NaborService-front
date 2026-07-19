import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EventForm } from '../components/EventForm';
import { useCreateEvent } from '../hooks/useEventMutations';

export function EventCreatePage() {
  const { t } = useTranslation('events');
  const navigate = useNavigate();
  const create = useCreateEvent();

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('create.title')}</h1>
      {create.isError && <p className="mb-4 text-sm text-error">{t('create.error')}</p>}
      <EventForm
        submitLabel={t('create.submit')}
        submitting={create.isPending}
        onSubmit={(payload) =>
          // Créé en brouillon → on file sur le détail pour publier / enrichir.
          create.mutate(payload, { onSuccess: (event) => navigate(`/events/${event.id}`) })
        }
      />
    </div>
  );
}
