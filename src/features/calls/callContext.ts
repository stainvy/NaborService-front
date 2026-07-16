import { createContext, useContext } from 'react';
import type { CallPeer, CallPhase, CallType, IncomingCall } from './types';

export interface CallContextValue {
  phase: CallPhase;
  callType: CallType | null;
  peer: CallPeer | null;
  incoming: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  durationSec: number;
  error: string | null;
  startCall: (groupId: string, type: CallType, peer: CallPeer) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchToVideo: () => Promise<void>;
}

export const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
