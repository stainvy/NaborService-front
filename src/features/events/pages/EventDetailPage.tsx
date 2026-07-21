import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import DOMPurify from 'dompurify';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FullPageLoader } from '@/components/FullPageLoader';
import { EventStatusBadge } from '../components/EventStatusBadge';
import { LifecycleActions } from '../components/LifecycleActions';
import { ParticipantsList } from '../components/ParticipantsList';
import { WaitlistBadge } from '../components/WaitlistBadge';
import { EventMedia } from '../components/EventMedia';
import { useEvent, useEventContent } from '../hooks/useEvents';
import { useEventSocket } from '../hooks/useEventSocket';
import {
  useRegisterEvent,
  useUnregisterEvent,
  useEventParticipants,
  useEventWaitlist,
  useReportEvent,
  useDownloadTicket,
  useEventChat,
} from '../hooks/useEventParticipation';
import { useDeleteEvent } from '../hooks/useEventMutations';
import { formatDateTime, eventPoints } from '../format';
import { isPastEvent } from '../utils';

export function EventDetailPage() {
  const { t, i18n } = useTranslation('events');
  const { eventId: id = '' } = useParams();
  const { user } = useAuth();
  const locale = i18n.resolvedLanguage;

  const { data: event, isLoading } = useEvent(id);
  const { data: content } = useEventContent(id);
  const { outcome } = useEventSocket(id);

  const register = useRegisterEvent(id);
  const unregister = useUnregisterEvent(id);
  const report = useReportEvent(id);
  const ticket = useDownloadTicket(id);
  const remove = useDeleteEvent();

  const isCreator = event?.creatorId === user?.id;
  // Statut de participation : la Socket donne le résultat immédiat d'une
  // inscription ; la valeur persistée vient de GET /events/:id (rechargement).
  // Après une désinscription réussie, le résultat Socket est obsolète.
  const socketStatus = unregister.isSuccess ? null : outcome?.status;
  const participation = socketStatus ?? event?.participationStatus ?? null;
  const registered = participation === 'registered';
  const waitlisted = participation === 'waitlisted';
  const participants = useEventParticipants(id, Boolean(isCreator));
  const waitlist = useEventWaitlist(id, Boolean(isCreator));
  const chat = useEventChat(id, Boolean(isCreator) || registered);

  // « Inscription en cours » tant que le résultat Socket n'est pas arrivé.
  const [awaiting, setAwaiting] = useState(false);
  useEffect(() => {
    if (outcome) setAwaiting(false);
  }, [outcome]);

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (isLoading || !event) return <FullPageLoader />;

  const safeHtml = content?.body_html ? DOMPurify.sanitize(content.body_html) : null;
  const past = isPastEvent(event);
  // 409 = l'événement a démarré entre l'affichage et le clic (inscription tardive).
  const isConflict = isAxiosError(register.error) && register.error.response?.status === 409;

  const onRegister = () => {
    setAwaiting(true);
    register.mutate(undefined, { onError: () => setAwaiting(false) });
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to="/events" className="text-sm text-orange underline">
        ← {t('feed.title')}
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-fg">{event.title}</h1>
        {past ? (
          <span className="inline-block rounded-full bg-gray/20 px-2 py-0.5 text-xs font-medium text-gray">
            {t('status.past')}
          </span>
        ) : (
          <EventStatusBadge status={event.status} />
        )}
      </header>

      <div className="mt-3 flex flex-col gap-1 text-sm text-gray">
        {event.startsAt && (
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDateTime(event.startsAt, locale)}
            {event.endsAt && ` → ${formatDateTime(event.endsAt, locale)}`}
          </p>
        )}
        <p className="font-semibold text-fg">
          {event.costCents === 0 ? t('card.free') : t('card.points', { points: eventPoints(event) })}
        </p>
        {event.maxParticipants != null && (
          <p>{t('card.capacity', { count: event.maxParticipants })}</p>
        )}
      </div>

      {event.description && (
        <p className="mt-4 whitespace-pre-line text-gray">{event.description}</p>
      )}

      {/* Contenu enrichi — assaini par DOMPurify */}
      {safeHtml && (
        <div
          className="prose mt-4 max-w-none text-fg"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}
      {content?.programme && content.programme.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1 text-sm text-fg">
          {content.programme.map((item, i) => (
            <li key={i}>
              <span className="font-medium">{item.time}</span> — {item.label}
            </li>
          ))}
        </ul>
      )}

      {/* Médias (galerie ; upload/suppression réservés au créateur) */}
      <section className="mt-6">
        <EventMedia id={id} editable={Boolean(isCreator)} />
      </section>

      {/* Événement payant : coût en points débité à l'inscription */}
      {event.costCents > 0 && (
        <p className="mt-4 rounded-md bg-orange/10 p-3 text-sm text-orange">
          {t('payment.required', { cost: t('card.points', { points: eventPoints(event) }) })}
        </p>
      )}

      {/* Inscription (asynchrone) — non-créateur, événement ouvert et à venir.
          On garde la section pour un inscrit (accès au billet) même passé. */}
      {!isCreator && (event.status === 'open' || registered || waitlisted) && (
        <section className="mt-6 rounded-md border border-gray/30 p-4">
          {past ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray">{t('register.closed_past')}</p>
              <Button disabled>{t('register.participate')}</Button>
              {registered && (
                <Button onClick={() => ticket.mutate()} disabled={ticket.isPending}>
                  {t('ticket.download')}
                </Button>
              )}
            </div>
          ) : outcome?.failedReason ? (
            <div>
              <p className="text-sm text-error">{t('register.failed')}</p>
              <Button className="mt-2" onClick={onRegister} disabled={register.isPending}>
                {t('register.retry')}
              </Button>
            </div>
          ) : registered ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-success">
                {outcome?.promoted ? t('register.promoted') : t('register.registered')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => ticket.mutate()} disabled={ticket.isPending}>
                  {t('ticket.download')}
                </Button>
                {chat.data?.id && (
                  <Link to={`/chat/${chat.data.id}`}>
                    <Button variant="secondary">{t('chat.open')}</Button>
                  </Link>
                )}
                <Button
                  variant="secondary"
                  onClick={() => unregister.mutate()}
                  disabled={unregister.isPending}
                >
                  {t('register.unregister')}
                </Button>
              </div>
            </div>
          ) : waitlisted ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-fg">{t('register.waitlisted')}</span>
                <WaitlistBadge />
              </div>
              <Button
                variant="secondary"
                onClick={() => unregister.mutate()}
                disabled={unregister.isPending}
              >
                {t('register.unregister')}
              </Button>
            </div>
          ) : awaiting ? (
            <p className="text-sm text-gray">{t('register.pending')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {register.isError && (
                <p className="text-sm text-error">
                  {isConflict ? t('register.closed_conflict') : t('register.failed')}
                </p>
              )}
              <Button onClick={onRegister} disabled={register.isPending}>
                {t('register.participate')}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Créateur : cycle de vie + édition + participants + liste d'attente */}
      {isCreator && (
        <>
          <section className="mt-6">
            <LifecycleActions event={event} />
          </section>
          <section className="mt-4 flex gap-2">
            <Link to={`/events/${id}/edit`}>
              <Button variant="secondary">{t('detail.edit')}</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => remove.mutate(id)}
              disabled={remove.isPending}
            >
              {t('detail.delete')}
            </Button>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 font-semibold text-fg">{t('participants.title')}</h2>
            <ParticipantsList participants={participants.data ?? []} />
          </section>

          {(waitlist.data?.length ?? 0) > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 font-semibold text-fg">{t('waitlist.title')}</h2>
              <ul className="flex flex-col gap-1">
                {waitlist.data!.map((p, i) => (
                  <li key={p.userId ?? i} className="flex items-center gap-2 text-sm text-fg">
                    <WaitlistBadge position={i + 1} />
                    {p.user
                      ? `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim()
                      : p.userId}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Signalement (non-créateur) */}
      {!isCreator && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="text-sm font-semibold text-error underline"
          >
            {t('report.action')}
          </button>
        </section>
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('report.title')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            report.mutate({ reason }, { onSuccess: () => setReportOpen(false) });
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">{t('report.reason')}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          {report.isSuccess && <p className="text-sm text-success">{t('report.done')}</p>}
          <Button type="submit" disabled={report.isPending || reason.trim().length === 0}>
            {t('report.submit')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
