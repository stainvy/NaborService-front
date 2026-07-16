import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, Trash2, Trophy } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useClosePoll, useDeletePoll, usePolls, usePollsByGroup } from '@/features/polls/hooks/usePolls';
import { usePollVoting } from '@/features/polls/hooks/usePollVoting';
import { CreatePollModal } from '@/features/polls/components/CreatePollModal';
import { PollSelectionIcon } from '@/features/polls/components/PollSelectionIcon';
import { canManagePoll } from '@/features/polls/utils';
import type { Poll } from '@/types/polls';

interface GroupPollsTabProps {
  groupId: string;
  /** Groupe de quartier (auto-provisionné) : les sondages y sont ceux du quartier (neighbourhood_id), pas du groupe. */
  isNeighbourhood: boolean;
  neighbourhoodId?: string | null;
  canCreate: boolean;
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-success/10 text-success',
  scheduled: 'bg-gray/10 text-gray',
  ended: 'bg-gray/10 text-gray',
  closed: 'bg-gray/10 text-gray',
};

// Onglet "Sondages" (mockup Messagerie.dc.html) — statut + vote directement
// dans les cartes, sans navigation vers une page de détail séparée. Couvre à
// la fois les sondages de groupe (Poll.groupId) et, pour le groupe de
// quartier auto-provisionné, les sondages de quartier existants (Poll.neighbourhoodId).
export function GroupPollsTab({ groupId, isNeighbourhood, neighbourhoodId, canCreate }: GroupPollsTabProps) {
  const { t } = useTranslation('polls');
  const neighbourhoodPolls = usePolls(neighbourhoodId ?? undefined, { enabled: isNeighbourhood });
  const groupPolls = usePollsByGroup(groupId, { enabled: !isNeighbourhood });
  const { data: polls, isLoading } = isNeighbourhood ? neighbourhoodPolls : groupPolls;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-gray/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">{t('group_title')}</h2>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> {t('create_poll')}
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray">…</p>}
      {!isLoading && !polls?.length && <p className="text-sm text-gray">{t('empty_list')}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {polls?.map((poll) => (
          <GroupPollCard key={poll.id} poll={poll} />
        ))}
      </div>

      {canCreate && (
        <CreatePollModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          groupId={isNeighbourhood ? undefined : groupId}
          neighbourhoodId={isNeighbourhood ? neighbourhoodId : undefined}
        />
      )}
    </div>
  );
}

function GroupPollCard({ poll }: { poll: Poll }) {
  const { t } = useTranslation('polls');
  const { user, role } = useAuth();
  const { status, canVote, votesByOption, totalVotes, maxVotes, handleOptionClick } = usePollVoting(poll);
  const closePoll = useClosePoll(poll.id);
  const deletePoll = useDeletePoll();
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const canManage = canManagePoll(poll, user?.id, role);

  return (
    <div className="rounded-xl border border-gray/20 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-gray/10 px-2 py-0.5 text-xs font-medium text-gray">
          <PollSelectionIcon pollType={poll.pollType} selected={false} className="h-3 w-3" />
          {t(`poll_type_${poll.pollType}`)}
        </span>
        {poll.isWeighted && <span className="text-xs text-gray">{t('poll_type_weighted')}</span>}
        {poll.isAnonymous && <span className="text-xs text-gray">{t('anonymous_badge')}</span>}
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
          {t(`status_${status}`)}
        </span>
        {canManage && status === 'active' && (
          <button
            type="button"
            onClick={() => setConfirmCloseOpen(true)}
            aria-label={t('close_poll')}
            className="text-gray hover:text-navy"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label={t('delete_poll')}
            className="text-gray hover:text-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mb-3 font-semibold text-navy">{poll.title}</p>

      <div className="flex flex-col gap-3">
        {poll.options.map((option) => {
          const result = poll.results?.find((r) => r.option_id === option.id);
          const voteCount = result?.vote_count ?? 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isWinner = totalVotes > 0 && maxVotes > 0 && voteCount === maxVotes;
          const isSelected = votesByOption.has(option.id);

          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote}
              onClick={() => handleOptionClick(option.id)}
              className={`text-left ${!canVote ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className={`flex items-center gap-1.5 ${isSelected ? 'font-semibold text-orange' : 'font-medium text-navy'}`}>
                  <PollSelectionIcon pollType={poll.pollType} selected={isSelected} className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-orange' : 'text-gray'}`} />
                  {isWinner && <Trophy className="h-3.5 w-3.5 text-orange" />}
                  {option.label}
                  {poll.isWeighted && (
                    <span className="text-xs text-gray">{t('weight_badge', { weight: option.weight })}</span>
                  )}
                </span>
                <span className="text-xs font-semibold text-gray">{percentage}%</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full bg-gray/10 ${isSelected ? 'ring-1 ring-orange' : ''}`}>
                <div className="h-full rounded-full bg-orange" style={{ width: `${percentage}%` }} />
              </div>
              {result?.voters && result.voters.length > 0 && (
                <div className="mt-1.5 flex">
                  {result.voters.slice(0, 5).map((voter) => (
                    <span key={voter.id} className="-ml-2 rounded-full border-2 border-white first:ml-0">
                      <Avatar mongoId={voter.profile_picture_mongo_id} firstName={voter.first_name} lastName={voter.last_name} size={22} />
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray">{t('total_votes', { count: totalVotes })}</p>

      <ConfirmDialog
        open={confirmCloseOpen}
        title={t('close_poll')}
        message={t('confirm_close_poll')}
        loading={closePoll.isPending}
        onConfirm={() => closePoll.mutate(undefined, { onSuccess: () => setConfirmCloseOpen(false) })}
        onCancel={() => setConfirmCloseOpen(false)}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('delete_poll')}
        message={t('confirm_delete_poll')}
        destructive
        loading={deletePoll.isPending}
        onConfirm={() => deletePoll.mutate(poll.id, { onSuccess: () => setConfirmDeleteOpen(false) })}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
