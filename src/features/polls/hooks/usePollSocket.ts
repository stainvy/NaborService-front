import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPollsSocket } from '@/lib/socket';
import type { Poll, PollResult, PollOption } from '@/types/polls';
import { pollsKeys } from './queryKeys';

interface PollUpdatedPayload {
  poll_id: string;
  results: PollResult[];
}
interface PollClosedPayload {
  poll_id: string;
  final_results: PollResult[];
}
interface OptionAddedPayload {
  poll_id: string;
  option: { id: string; label: string; weight?: number };
}

/** Rejoint la room du sondage actif et applique les mises à jour temps réel (résultats, clôture, nouvelles options). */
export function usePollSocket(pollId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pollId) return;
    const socket = getPollsSocket();
    socket?.emit('join_poll', { poll_id: pollId });
    return () => {
      socket?.emit('leave_poll', { poll_id: pollId });
    };
  }, [pollId]);

  useEffect(() => {
    const socket = getPollsSocket();
    if (!socket) return;

    function patchPoll(id: string, updater: (poll: Poll) => Poll) {
      queryClient.setQueryData<Poll>(pollsKeys.detail(id), (current) =>
        current ? updater(current) : current,
      );
    }

    function onUpdated(payload: PollUpdatedPayload) {
      patchPoll(payload.poll_id, (poll) => ({ ...poll, results: payload.results }));
    }

    function onClosed(payload: PollClosedPayload) {
      patchPoll(payload.poll_id, (poll) => ({
        ...poll,
        results: payload.final_results,
        closedAt: new Date().toISOString(),
      }));
    }

    function onOptionAdded(payload: OptionAddedPayload) {
      patchPoll(payload.poll_id, (poll) => {
        if (poll.options.some((o) => o.id === payload.option.id)) return poll;
        const newOption: PollOption = { id: payload.option.id, label: payload.option.label, weight: payload.option.weight ?? 1 };
        return { ...poll, options: [...poll.options, newOption] };
      });
    }

    socket.on('poll:updated', onUpdated);
    socket.on('poll:closed', onClosed);
    socket.on('poll:option_added', onOptionAdded);

    return () => {
      socket.off('poll:updated', onUpdated);
      socket.off('poll:closed', onClosed);
      socket.off('poll:option_added', onOptionAdded);
    };
  }, [queryClient]);
}
