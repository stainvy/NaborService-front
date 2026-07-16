import { useRef, useState } from 'react';

interface UseFilePickerOptions {
  accept?: string;
  maxSizeBytes?: number;
  onPick: (file: File) => void;
}

// Généralise le pattern <input type="file" hidden> + ref + validation de
// taille déjà écrit à la main dans ProfileEditPage.tsx (avatar/bannière) ;
// première extraction, déclenchée par un deuxième usage réel (pièces jointes
// de chat) — ProfileEditPage n'est pas touché.
export function useFilePicker({ accept, maxSizeBytes, onPick }: UseFilePickerOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (maxSizeBytes && file.size > maxSizeBytes) {
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
