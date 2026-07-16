import { useMyVote, useRemoveVote, useVote } from './usePolls';
import { getPollStatus } from '../utils';
import type { Poll } from '@/types/polls';

/**
 * Logique de vote partagée entre toutes les surfaces où un sondage peut être
 * voté (carte inline dans le fil de discussion, carte de l'onglet Sondages) —
 * évite de dupliquer le calcul du statut/pourcentages/toggle single-vs-multiple
 * à chaque endroit. Accepte `undefined` (sondage encore en chargement) pour
 * rester appelable inconditionnellement (règle des hooks) par les composants
 * dont le poll n'est disponible qu'après un fetch (ex. PollMessageCard).
 */
export function usePollVoting(poll: Poll | undefined) {
  const { data: myVote } = useMyVote(poll?.id);
  const vote = useVote(poll?.id ?? '');
  const removeVote = useRemoveVote(poll?.id ?? '');

  const status = poll ? getPollStatus(poll) : 'scheduled';
  const canVote = Boolean(poll) && status === 'active';
  const votesByOption = new Map(myVote?.votes.map((v) => [v.optionId, v]) ?? []);
  const totalVotes = (poll?.results ?? []).reduce((sum, r) => sum + r.vote_count, 0);
  const maxVotes = Math.max(0, ...(poll?.results ?? []).map((r) => r.vote_count));

  // single et weighted sont à choix unique côté back (un nouveau vote
  // remplace le précédent) ; multiple accepte plusieurs sélections indépendantes.
  function handleOptionClick(optionId: string) {
    if (!canVote) return;
    if (votesByOption.has(optionId)) {
      removeVote.mutate(optionId);
      return;
    }
    vote.mutate(optionId);
  }

  return {
    status,
    canVote,
    votesByOption,
    totalVotes,
    maxVotes,
    handleOptionClick,
    isVoting: vote.isPending || removeVote.isPending,
  };
}
