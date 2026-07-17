import { useEffect, useRef, useState } from 'react';

const ERROR_DISMISS_MS = 5000;

interface UseFilePickerOptions {
  accept?: string;
  /** Taille max fixe, ou fonction du fichier (ex. limite plus basse pour les images). */
  maxSizeBytes?: number | ((file: File) => number);
  onPick: (file: File) => void;
}

// Généralise le pattern <input type="file" hidden> + ref + validation de
// taille déjà écrit à la main dans ProfileEditPage.tsx (avatar/bannière) ;
// première extraction, déclenchée par un deuxième usage réel (pièces jointes
// de chat) — ProfileEditPage n'est pas touché.
export function useFilePicker({ accept, maxSizeBytes, onPick }: UseFilePickerOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Sans ça, le message d'erreur reste affiché indéfiniment tant que
  // l'utilisateur ne retente pas une sélection de fichier.
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), ERROR_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const limit = typeof maxSizeBytes === 'function' ? maxSizeBytes(file) : maxSizeBytes;
    if (limit && file.size > limit) {
      setError('file_too_large');
      return;
    }
    setError(null);
    onPick(file);
  }

  return {
    error,
    triggerPick: () => inputRef.current?.click(),
    inputProps: {
      ref: inputRef,
      type: 'file' as const,
      accept,
      className: 'hidden',
      onChange: handleChange,
    },
  };
}
