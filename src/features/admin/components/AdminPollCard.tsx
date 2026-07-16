import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3, Lock, Trash2 } from 'lucide-react';
import { usePoll, useClosePoll, useDeletePoll } from '@/features/polls/hooks/usePolls';
import { getPollStatus } from '@/features/polls/utils';
import type { Poll } from '@/types/polls';

function userLabel(u: Poll['creator']): string {
  if (!u) return '—';
  return `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.id;
}

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '—';
}

// Sondage attaché à un message, rendu dans le fil d'administration. Réutilise
// les endpoints polls existants (getPoll / close / delete) qui autorisent déjà
// le bypass modérateur/admin (getPollOwned). Affiche résultats + statut et
// permet de clôturer / supprimer le sondage depuis la modération.
export function AdminPollCard({ pollId }: { pollId: string }) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const { data: poll, isLoading, isError } = usePoll(pollId);
  const closePoll = useClosePoll(pollId);
  const deletePoll = useDeletePoll();

  if (isLoading) return <p className="text-xs text-admin-muted">…</p>;
  // getPoll 404 sur un sondage supprimé : on l'indique plutôt que de masquer.
  if (isError || !poll) return <p className="text-xs text-admin-muted">{t('messages.poll_unavailable')}</p>;

  const status = getPollStatus(poll);
  const totalVotes = (poll.results ?? []).reduce((sum, r) => sum + r.vote_count, 0);

  function afterMutate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'chat'] });
  }

  return (
    <div className="mt-2 rounded-lg border border-admin-border bg-admin-bg p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-admin-accent">
        <BarChart3 className="h-3.5 w-3.5" />
        {t('messages.poll')}
        <span className="rounded-full bg-admin-border/40 px-2 py-0.5 text-[10px] font-medium text-admin-muted">
          {t(`messages.poll_status_${status}`)}
        </span>
        {poll.isAnonymous && (
          <span className="rounded-full bg-admin-border/40 px-2 py-0.5 text-[10px] font-normal text-admin-muted">
            {t('messages.poll_anonymous')}
          </span>
        )}
        {poll.isWeighted && (
          <span className="rounded-full bg-admin-border/40 px-2 py-0.5 text-[10px] font-normal text-admin-muted">
            {t('messages.poll_weighted')}
          </span>
        )}
      </div>
      <p className="mb-2 text-sm font-medium text-admin-text">{poll.title}</p>
      {poll.description && <p className="mb-2 text-xs text-admin-muted">{poll.description}</p>}

      <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px] text-admin-muted">
        <dt className="font-medium">{t('messages.poll_creator')}</dt>
        <dd className="text-admin-text">{userLabel(poll.creator)}</dd>

        <dt className="font-medium">{t('messages.poll_created')}</dt>
        <dd className="text-admin-text">{formatDate(poll.createdAt)}</dd>

        {poll.startsAt && (
          <>
            <dt className="font-medium">{t('messages.poll_started')}</dt>
            <dd className="text-admin-text">{formatDate(poll.startsAt)}</dd>
          </>
        )}
        {poll.endsAt && (
          <>
            <dt className="font-medium">{t('messages.poll_ends')}</dt>
            <dd className="text-admin-text">{formatDate(poll.endsAt)}</dd>
          </>
        )}
        {poll.closedAt && (
          <>
            <dt className="font-medium">{t('messages.poll_closed')}</dt>
            <dd className="text-admin-text">
              {formatDate(poll.closedAt)}
              {poll.closed_by_user ? ` · ${userLabel(poll.closed_by_user)}` : ''}
            </dd>
          </>
        )}
      </dl>

      <div className="flex flex-col gap-1">
        {poll.options.map((option) => {
          const voteCount = poll.results?.find((r) => r.option_id === option.id)?.vote_count ?? 0;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          return (
            <div key={option.id} className="flex items-center justify-between gap-2 text-xs text-admin-text">
              <span className="truncate">{option.label}</span>
              <span className="text-admin-muted">{voteCount} · {pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-admin-muted">{t('messages.poll_total', { count: totalVotes })}</p>

      <div className="mt-2 flex gap-2">
        {status === 'active' && (
          <button
            type="button"
            onClick={() => closePoll.mutate(undefined, { onSuccess: afterMutate })}
            disabled={closePoll.isPending}
            className="flex items-center gap-1 rounded-md border border-admin-border px-2 py-1 text-xs text-admin-text hover:bg-admin-border/30"
          >
            <Lock className="h-3 w-3" /> {t('messages.poll_close')}
          </button>
        )}
        <button
          type="button"
          onClick={() => deletePoll.mutate(pollId, { onSuccess: afterMutate })}
          disabled={deletePoll.isPending}
          className="flex items-center gap-1 rounded-md border border-error/40 px-2 py-1 text-xs text-error hover:bg-error/10"
        >
          <Trash2 className="h-3 w-3" /> {t('messages.poll_delete')}
        </button>
      </div>
    </div>
  );
}
