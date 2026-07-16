import { useCallback, useEffect, useRef } from 'react';
import { getChatSocket } from '@/lib/socket';

const STOP_DELAY_MS = 2000;

/** Émet typing:start/typing:stop pour le groupe, avec un debounce d'arrêt automatique. */
export function useTyping(groupId: string) {
  const isTypingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const stop = useCallback(() => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    getChatSocket()?.emit('typing:stop', { group_id: groupId });
  }, [groupId]);

  const notifyTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      getChatSocket()?.emit('typing:start', { group_id: groupId });
    }
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(stop, STOP_DELAY_MS);
  }, [groupId, stop]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stop();
    };
  }, [stop]);

  return { notifyTyping, stopTyping: stop };
}
