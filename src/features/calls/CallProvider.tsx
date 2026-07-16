import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import type SimplePeer from 'simple-peer';
import { useAuth } from '@/hooks/useAuth';
import { getCallsSocket } from '@/lib/socket';
import { socialService } from '@/services/social.service';
import { callsService } from '@/services/calls.service';
import { CallContext } from './callContext';
import type { CallPeer, CallPhase, CallType, IceServers, IncomingCall } from './types';

interface ActiveCallRef {
  callId: string;
  groupId: string;
  type: CallType;
  peerUserId: string;
  initiator: boolean;
}

/**
 * Porte l'appareil précis (micro ou caméra) dont l'accès a été refusé — le
 * `name`/`message` restent ceux d'une DOMException NotAllowedError classique
 * pour que le code existant qui teste `.name === 'NotAllowedError'` continue
 * de fonctionner sans changement.
 */
class MediaPermissionError extends Error {
  readonly name = 'NotAllowedError';
  readonly deviceKind: 'microphone' | 'camera';
  constructor(deviceKind: 'microphone' | 'camera') {
    super(`${deviceKind} permission denied`);
    this.deviceKind = deviceKind;
  }
}

/** Traduit une erreur de capture média en code d'erreur affichable (mic/caméra/générique). */
function mediaErrorCode(e: unknown): 'mic_denied' | 'camera_denied' | 'call_failed' {
  if (e instanceof MediaPermissionError) {
    return e.deviceKind === 'microphone' ? 'mic_denied' : 'camera_denied';
  }
  if ((e as Error)?.name === 'NotAllowedError') return 'mic_denied';
  return 'call_failed';
}

// Fournisseur global d'appels audio/vidéo 1:1. Signalisation via le namespace
// socket `/calls` (offer/answer/ICE relayés par le back), négociation WebRTC
// déléguée à simple-peer. Monté haut dans l'arbre pour capter un appel entrant
// quelle que soit la page affichée.
export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [phase, setPhase] = useState<CallPhase>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [peer, setPeer] = useState<CallPeer | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const callRef = useRef<ActiveCallRef | null>(null);
  const peerConnRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<IceServers | null>(null);
  const pendingSignalsRef = useRef<SimplePeer.SignalData[]>([]);
  // Miroir de `incoming` pour le garde des listeners socket (fermeture figée sur
  // l'user, donc l'état `incoming` y serait périmé).
  const incomingRef = useRef<IncomingCall | null>(null);

  // Résout nom + avatar d'un participant (id → identité) pour l'affichage.
  const resolvePeer = useCallback((userId: string) => {
    socialService
      .getPublicProfile(userId)
      .then((p) =>
        setPeer({ id: p.id, name: `${p.firstName} ${p.lastName}`.trim(), avatarMongoId: p.profilePictureMongoId }),
      )
      .catch(() => undefined);
  }, []);

  // ── Teardown ─────────────────────────────────────────────
  const cleanup = useCallback(() => {
    peerConnRef.current?.destroy();
    peerConnRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingSignalsRef.current = [];
    callRef.current = null;
    incomingRef.current = null;
    iceServersRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setPhase('idle');
    setCallType(null);
    setPeer(null);
    setIncoming(null);
    setMuted(false);
    setCameraOff(false);
    setDurationSec(0);
  }, []);

  // ── simple-peer wiring ───────────────────────────────────
  const createPeerConnection = useCallback((initiator: boolean) => {
    const socket = getCallsSocket();
    const active = callRef.current;
    if (!socket || !active || !localStreamRef.current) return;

    const conn = new Peer({
      initiator,
      trickle: true,
      stream: localStreamRef.current,
      config: iceServersRef.current
        ? {
            iceServers: iceServersRef.current,
            // TODO(turn-only-test): force le relais TURN pour valider Cloudflare
            // (aucune connexion directe/STUN). À RETIRER après test — un appel
            // échoue si aucun serveur TURN joignable n'est configuré côté back.
            iceTransportPolicy: 'relay',
          }
        : undefined,
    });

    conn.on('signal', (data) => {
      const kind =
        (data as { type?: string }).type === 'offer'
          ? 'offer'
          : (data as { type?: string }).type === 'answer'
            ? 'answer'
            : 'ice-candidate';
      socket.emit('call:signal', {
        call_id: active.callId,
        to_user_id: active.peerUserId,
        signal: { kind, data },
      });
    });
    conn.on('stream', (stream) => setRemoteStream(stream));
    // Un passage audio→vidéo en cours d'appel ajoute une piste (renégociation) :
    // elle arrive via 'track', pas 'stream'. On bascule l'UI en vidéo quand une
    // piste vidéo distante apparaît.
    conn.on('track', (track, stream) => {
      setRemoteStream(stream);
      if (track.kind === 'video') setCallType('video');
    });
    conn.on('connect', () => setPhase('active'));
    conn.on('close', () => endCallInternal(false));
    conn.on('error', () => endCallInternal(false));

    peerConnRef.current = conn;
    // Rejoue les signaux reçus avant que la connexion n'existe (offer arrivé
    // pile au moment où l'on rejoignait).
    pendingSignalsRef.current.forEach((s) => conn.signal(s));
    pendingSignalsRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Termine localement (et, si `notify`, prévient le serveur).
  const endCallInternal = useCallback(
    (notify: boolean) => {
      const active = callRef.current;
      const socket = getCallsSocket();
      if (active && notify) {
        callsService.end(active.callId).catch(() => undefined);
        socket?.emit('leave_call', { call_id: active.callId });
      }
      cleanup();
    },
    [cleanup],
  );

  // Micro et caméra sont demandés séparément (plutôt qu'un seul getUserMedia
  // combiné) afin de savoir précisément lequel des deux a été refusé, pour
  // afficher le bon message ("autorisez votre micro" vs "votre caméra").
  const getLocalMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
    let audioStream: MediaStream;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      if ((e as Error)?.name === 'NotAllowedError') throw new MediaPermissionError('microphone');
      throw e;
    }

    if (type !== 'video') {
      localStreamRef.current = audioStream;
      setLocalStream(audioStream);
      return audioStream;
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const combined = new MediaStream([...audioStream.getTracks(), ...videoStream.getTracks()]);
      localStreamRef.current = combined;
      setLocalStream(combined);
      return combined;
    } catch (e) {
      // Caméra indisponible (déjà captée par un autre onglet en test local, ou
      // absente) mais micro OK : on retombe sur l'audio seul plutôt que d'échouer
      // tout l'appel. Un refus explicite de permission (NotAllowedError) reste bloquant.
      if ((e as Error)?.name !== 'NotAllowedError') {
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        return audioStream;
      }
      throw new MediaPermissionError('camera');
    }
  }, []);

  // ── Public actions ───────────────────────────────────────
  const startCall = useCallback(
    async (groupId: string, type: CallType, callPeer: CallPeer) => {
      if (callRef.current) return;
      setError(null);
      setPhase('outgoing');
      setCallType(type);
      setPeer(callPeer);
      try {
        const res = await callsService.initiate(groupId, type);
        callRef.current = {
          callId: res.id,
          groupId,
          type,
          peerUserId: callPeer.id,
          initiator: true,
        };
        iceServersRef.current = res.ice_servers;
        await getLocalMedia(type);
        // Rejoint la room : le peer (offer) est créé quand le correspondant
        // rejoint (`call:participant_joined`), pas avant.
        getCallsSocket()?.emit('join_call', { call_id: res.id });
      } catch (e) {
        setError(mediaErrorCode(e));
        endCallInternal(true);
      }
    },
    [getLocalMedia, endCallInternal],
  );

  const acceptCall = useCallback(async () => {
    const inc = incoming;
    if (!inc) return;
    setError(null);
    callRef.current = {
      callId: inc.callId,
      groupId: inc.groupId,
      type: inc.type,
      peerUserId: inc.fromUserId,
      initiator: false,
    };
    iceServersRef.current = inc.iceServers;
    incomingRef.current = null;
    setCallType(inc.type);
    setIncoming(null);
    setPhase('active');
    // Identité déjà résolue à la réception de l'appel ; on rafraîchit par sûreté.
    resolvePeer(inc.fromUserId);
    try {
      await getLocalMedia(inc.type);
      // Peer non-initiateur prêt à recevoir l'offer AVANT de signaler qu'on a
      // rejoint (sinon l'offer de l'appelant pourrait arriver dans le vide).
      createPeerConnection(false);
      getCallsSocket()?.emit('join_call', { call_id: inc.callId });
    } catch (e) {
      setError(mediaErrorCode(e));
      endCallInternal(true);
    }
  }, [incoming, getLocalMedia, createPeerConnection, endCallInternal, resolvePeer]);

  const declineCall = useCallback(() => {
    if (incoming) getCallsSocket()?.emit('call:decline', { call_id: incoming.callId });
    incomingRef.current = null;
    setIncoming(null);
    if (!callRef.current) setPhase('idle');
  }, [incoming]);

  const endCall = useCallback(() => endCallInternal(true), [endCallInternal]);

  // Contrairement à `cleanup()` (raccrochage), l'erreur n'est PAS effacée
  // automatiquement — sinon un refus de permission disparaîtrait avant que
  // l'utilisateur ait pu le voir. Elle ne l'est qu'explicitement ici.
  const clearError = useCallback(() => setError(null), []);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const nowMuted = !track.enabled;
    setMuted(nowMuted);
    const active = callRef.current;
    if (active)
      getCallsSocket()?.emit('call:media-state', {
        call_id: active.callId,
        muted: nowMuted,
        video_enabled: !cameraOff,
      });
  }, [cameraOff]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const nowOff = !track.enabled;
    setCameraOff(nowOff);
    const active = callRef.current;
    if (active)
      getCallsSocket()?.emit('call:media-state', {
        call_id: active.callId,
        muted,
        video_enabled: !nowOff,
      });
  }, [muted]);

  // Passe un appel audio en vidéo en cours de route : capte la caméra, ajoute
  // la piste à la connexion existante (simple-peer renégocie tout seul via le
  // flux call:signal) et bascule l'UI en vidéo. Le correspondant reçoit la
  // nouvelle piste via l'écouteur 'track' de sa propre connexion.
  const switchToVideo = useCallback(async () => {
    const active = callRef.current;
    const conn = peerConnRef.current;
    const local = localStreamRef.current;
    if (!active || !conn || !local || local.getVideoTracks().length > 0) return;
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = cam.getVideoTracks()[0];
      if (!track) return;
      local.addTrack(track);
      conn.addTrack(track, local); // déclenche la renégociation
      setCallType('video');
      setCameraOff(false);
      getCallsSocket()?.emit('call:media-state', {
        call_id: active.callId,
        muted,
        video_enabled: true,
      });
    } catch (e) {
      setError((e as Error)?.name === 'NotAllowedError' ? 'camera_denied' : 'call_failed');
    }
  }, [muted]);

  // ── Socket listeners (persistent, keyed on the logged-in user) ──
  useEffect(() => {
    if (!user) return;

    let detach: (() => void) | null = null;

    const attach = (socket: NonNullable<ReturnType<typeof getCallsSocket>>) => {
      const onIncoming = (p: {
        call_id: string;
        group_id: string;
        type: CallType;
        from_user_id: string;
        ice_servers: IceServers;
      }) => {
        // Ignore un nouvel appel entrant si on est déjà occupé.
        if (callRef.current || incomingRef.current) return;
        const inc: IncomingCall = {
          callId: p.call_id,
          groupId: p.group_id,
          type: p.type,
          fromUserId: p.from_user_id,
          iceServers: p.ice_servers,
        };
        incomingRef.current = inc;
        setIncoming(inc);
        setPhase('incoming');
        // Résout tout de suite l'identité de l'appelant : l'écran d'appel entrant
        // doit afficher son nom/avatar, pas « Inconnu », avant même de décrocher.
        resolvePeer(p.from_user_id);
      };

      const onSignal = (p: { from_user_id: string; signal: { data: SimplePeer.SignalData } }) => {
        const conn = peerConnRef.current;
        if (conn) conn.signal(p.signal.data);
        else pendingSignalsRef.current.push(p.signal.data);
      };

      const onParticipantJoined = (p: { user_id: string }) => {
        const active = callRef.current;
        if (!active) return;
        // L'appelant crée l'offer quand le correspondant rejoint.
        if (active.initiator && p.user_id === active.peerUserId && !peerConnRef.current) {
          createPeerConnection(true);
        }
      };

      const onParticipantLeft = (p: { user_id: string }) => {
        if (callRef.current && p.user_id === callRef.current.peerUserId) endCallInternal(false);
      };

      const onDeclined = (p: { user_id: string }) => {
        if (callRef.current && p.user_id === callRef.current.peerUserId) endCallInternal(false);
      };

      const onEnded = () => {
        if (callRef.current) {
          endCallInternal(false);
        } else {
          incomingRef.current = null;
          setIncoming(null);
          setPhase('idle');
        }
      };

      socket.on('call:incoming', onIncoming);
      socket.on('call:signal', onSignal);
      socket.on('call:participant_joined', onParticipantJoined);
      socket.on('call:participant_left', onParticipantLeft);
      socket.on('call:declined', onDeclined);
      socket.on('call:ended', onEnded);

      detach = () => {
        socket.off('call:incoming', onIncoming);
        socket.off('call:signal', onSignal);
        socket.off('call:participant_joined', onParticipantJoined);
        socket.off('call:participant_left', onParticipantLeft);
        socket.off('call:declined', onDeclined);
        socket.off('call:ended', onEnded);
      };
    };

    // Le socket est créé par AuthProvider ; il peut ne pas encore exister au
    // montage — on réessaie brièvement jusqu'à ce qu'il soit disponible.
    const existing = getCallsSocket();
    let interval: ReturnType<typeof setInterval> | null = null;
    if (existing) attach(existing);
    else {
      interval = setInterval(() => {
        const s = getCallsSocket();
        if (s) {
          if (interval) clearInterval(interval);
          interval = null;
          attach(s);
        }
      }, 400);
    }

    return () => {
      if (interval) clearInterval(interval);
      detach?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Chronomètre de durée d'appel (phase active).
  useEffect(() => {
    if (phase !== 'active') return;
    const iv = setInterval(() => setDurationSec((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Coupe proprement l'appel si le composant est démonté / logout.
  useEffect(() => cleanup, [cleanup]);

  return (
    <CallContext.Provider
      value={{
        phase,
        callType,
        peer,
        incoming,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        durationSec,
        error,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        clearError,
        toggleMute,
        toggleCamera,
        switchToVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}
