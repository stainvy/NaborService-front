import { useCallback, useEffect, useRef, useState } from 'react';

interface PickedFormat {
  /** Mimetype passé à MediaRecorder (avec codecs). */
  recorderMime: string;
  /** Mimetype de base du fichier produit (celui validé par l'API media). */
  mime: string;
  ext: string;
}

// Formats par capacité navigateur : Chrome/Edge → webm/opus, Firefox →
// ogg/opus, Safari → mp4 (AAC). Le mimetype de base (sans ";codecs=") est
// celui envoyé au back, qui l'autorise pour les pièces jointes de message.
function pickFormat(): PickedFormat | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates: PickedFormat[] = [
    { recorderMime: 'audio/webm;codecs=opus', mime: 'audio/webm', ext: 'webm' },
    { recorderMime: 'audio/ogg;codecs=opus', mime: 'audio/ogg', ext: 'ogg' },
    { recorderMime: 'audio/mp4', mime: 'audio/mp4', ext: 'm4a' },
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c.recorderMime)) ?? null;
}

/**
 * Enregistreur de message vocal : capte le micro via MediaRecorder et produit
 * un File audio remis à `onRecorded` — le flux d'envoi de pièces jointes
 * existant (useSendAttachment) fait le reste, le mimetype audio classant le
 * message en type "voice".
 */
export function useVoiceRecorder(onRecorded: (file: File) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  const supported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && pickFormat() !== null;

  // Chronomètre d'enregistrement.
  useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  // Coupe le micro si le composant est démonté en plein enregistrement.
  useEffect(
    () => () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        cancelledRef.current = true;
        recorderRef.current.stop();
      }
    },
    [],
  );

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    const format = pickFormat();
    if (!format) {
      setError('voice_unsupported');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: format.recorderMime });
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        setRecording(false);
        setSeconds(0);
        if (!cancelledRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: format.mime });
          const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
          onRecordedRef.current(new File([blob], `vocal-${stamp}.${format.ext}`, { type: format.mime }));
        }
        chunksRef.current = [];
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
    } catch (e) {
      setError((e as Error)?.name === 'NotAllowedError' ? 'voice_denied' : 'voice_failed');
    }
  }, []);

  /** Termine l'enregistrement et envoie le vocal. */
  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  /** Abandonne l'enregistrement sans rien envoyer. */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    recorderRef.current?.stop();
  }, []);

  return { supported, recording, seconds, error, start, stop, cancel };
}
