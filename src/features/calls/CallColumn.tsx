import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useCall } from './callContext';

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function StreamMedia({
  stream,
  kind,
  mirror,
}: {
  stream: MediaStream | null;
  kind: 'video' | 'audio';
  mirror?: boolean;
}) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  if (kind === 'audio') return <audio ref={ref} autoPlay />;
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={mirror}
      className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
    />
  );
}

// Colonne d'appel (mockup CallColumn.dc.html) : panneau flottant affichant
// l'état d'appel courant — appel sortant (sonnerie), entrant (accepter/refuser)
// ou actif (audio : avatar + durée ; vidéo : flux distant plein cadre + PiP
// local), avec les contrôles micro / caméra / raccrocher.
export function CallColumn() {
  const { t } = useTranslation('messages');
  const {
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
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchToVideo,
  } = useCall();

  if (phase === 'idle') return null;

  const name = peer?.name || t('call.unknown');
  const [firstName, ...restName] = name.split(' ');
  const isVideo = (callType ?? incoming?.type) === 'video';
  const hasLocalVideo = Boolean(localStream && localStream.getVideoTracks().length > 0);
  const showLocalPip = phase === 'active' && hasLocalVideo && !cameraOff;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-navy text-white shadow-2xl sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[560px] sm:w-[360px] sm:rounded-2xl">
      {/* Fond : flux vidéo distant en plein cadre si dispo, sinon avatar centré. */}
      <div className="absolute inset-0">
        {phase === 'active' && isVideo && remoteStream ? (
          <StreamMedia stream={remoteStream} kind="video" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-b from-navy to-navy/80">
            <Avatar mongoId={peer?.avatarMongoId} firstName={firstName} lastName={restName.join(' ')} size={120} />
          </div>
        )}
        {phase === 'active' && !isVideo && remoteStream && <StreamMedia stream={remoteStream} kind="audio" />}
      </div>

      {/* En-tête : nom + statut. */}
      <div className="relative z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <p className="truncate text-base font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
          {name}
        </p>
        <p className="mt-0.5 text-sm text-white/85" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
          {phase === 'incoming'
            ? isVideo
              ? t('call.incoming_video')
              : t('call.incoming_audio')
            : phase === 'outgoing'
              ? t('call.ringing')
              : formatDuration(durationSec)}
        </p>
        {/* mic_denied/camera_denied ont leur propre popup persistante (MediaPermissionDialog),
            rendue hors de ce composant — ici on ne garde que le message générique. */}
        {error && error !== 'mic_denied' && error !== 'camera_denied' && (
          <p className="mt-1 text-xs font-semibold text-error">{t('call.error_call_failed')}</p>
        )}
      </div>

      {/* PiP caméra locale (appel vidéo actif). */}
      {showLocalPip && localStream && (
        <div className="absolute right-3 top-16 z-10 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/30 shadow-lg">
          <StreamMedia stream={localStream} kind="video" mirror />
        </div>
      )}

      {/* Contrôles selon la phase. */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 bg-gradient-to-t from-black/55 to-transparent p-6">
        {phase === 'incoming' ? (
          <div className="flex items-center gap-14">
            <CallButton onClick={declineCall} label={t('call.decline')} variant="end">
              <PhoneOff className="h-6 w-6" />
            </CallButton>
            <CallButton onClick={() => void acceptCall()} label={t('call.accept')} variant="accept">
              <Phone className="h-6 w-6" />
            </CallButton>
          </div>
        ) : phase === 'outgoing' ? (
          <CallButton onClick={endCall} label={t('call.hang_up')} variant="end">
            <PhoneOff className="h-6 w-6" />
          </CallButton>
        ) : (
          <div className="flex items-center gap-4 rounded-full bg-white/10 p-3 backdrop-blur">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? t('call.unmute') : t('call.mute')}
              className={`flex h-12 w-12 items-center justify-center rounded-full ${muted ? 'bg-white text-navy' : 'bg-white/15 text-white'}`}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            {hasLocalVideo ? (
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={cameraOff ? t('call.camera_on') : t('call.camera_off')}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${cameraOff ? 'bg-white text-navy' : 'bg-white/15 text-white'}`}
              >
                {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void switchToVideo()}
                aria-label={t('call.switch_to_video')}
                title={t('call.switch_to_video')}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white"
              >
                <Video className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={endCall}
              aria-label={t('call.hang_up')}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-error text-white"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CallButton({
  onClick,
  label,
  variant,
  children,
}: {
  onClick: () => void;
  label: string;
  variant: 'end' | 'accept';
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ${
          variant === 'end' ? 'bg-error' : 'bg-success'
        }`}
      >
        {children}
      </button>
      <span className="text-xs text-white/85">{label}</span>
    </div>
  );
}
