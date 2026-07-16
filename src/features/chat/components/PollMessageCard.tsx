import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { usePoll } from '@/features/polls/hooks/usePolls';
import { usePollVoting } from '@/features/polls/hooks/usePollVoting';
import { PollSelectionIcon } from '@/features/polls/components/PollSelectionIcon';

interface PollMessageCardProps {
  pollId: string;
  isOwn: boolean;
  onViewResults: () => void;
}

// Sondage de groupe affiché inline dans le fil de discussion (message.type
// === 'poll') — votable directement ici, pas seulement depuis l'onglet
// Sondages (mockup Messagerie.dc.html : la carte inline mène à l'onglet
// Sondages pour la vue complète — avatars des votants, gestion — mais le
// vote lui-même ne doit pas obliger à y basculer).
export function PollMessageCard({ pollId, isOwn, onViewResults }: PollMessageCardProps) {
  const { t } = useTranslation('polls');
  const { data: poll } = usePoll(pollId);
  const { canVote, votesByOption, totalVotes, handleOptionClick } = usePollVoting(poll);

  if (!poll) return null;

  const mutedText = isOwn ? 'text-white/80' : 'text-gray';

  return (
    <div className={`min-w-[240px] rounded-lg border p-3 ${isOwn ? 'border-white/30 bg-white/10' : 'border-gray/20 bg-white'}`}>
      <div className={`mb-2 flex items-center gap-2 text-xs font-semibold ${isOwn ? 'text-white' : 'text-orange'}`}>
        <BarChart3 className="h-3.5 w-3.5" />
        {t('title')}
        {poll.isWeighted && <span className={`font-normal ${mutedText}`}>· {t('poll_type_weighted')}</span>}
      </div>
      <p className="mb-2 text-sm font-medium">{poll.title}</p>
      <div className="flex flex-col gap-1.5">
        {poll.options.map((option) => {
          const voteCount = poll.results?.find((r) => r.option_id === option.id)?.vote_count ?? 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = votesByOption.has(option.id);

          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote}
              onClick={() => handleOptionClick(option.id)}
              className={`relative overflow-hidden rounded border text-left text-xs ${
                isSelected ? 'border-current' : 'border-current/10'
              } ${canVote ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`absolute inset-y-0 left-0 ${isOwn ? 'bg-white/20' : 'bg-orange/10'}`}
                style={{ width: `${percentage}%` }}
                aria-hidden
              />
              <div className="relative flex items-center gap-1.5 px-2 py-1">
                <PollSelectionIcon pollType={poll.pollType} selected={isSelected} className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1 truncate">{option.label}</span>
                {poll.isWeighted && <span className={mutedText}>{t('weight_badge', { weight: option.weight })}</span>}
                <span className="opacity-80">{percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onViewResults}
        className={`mt-2 text-xs font-semibold underline ${isOwn ? 'text-white' : 'text-orange'}`}
      >
        {t('poll_detail')} →
      </button>
    </div>
  );
}
