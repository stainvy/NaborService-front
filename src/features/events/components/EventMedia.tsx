import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { useUploadEventMedia } from '../hooks/useEventMutations';

const MAX = 5 * 1024 * 1024; // 5 Mo

// Téléversement de médias (couverture / pièce jointe). ⚠️ Le back n'expose pas
// de liste des médias sur l'événement : on gère l'ajout ; l'aperçu/suppression
// des médias existants viendra quand la liste sera disponible.
export function EventMedia({ id }: { id: string }) {
  const { t } = useTranslation('events');
  const upload = useUploadEventMedia(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX) {
      setError(t('media.too_large'));
      return;
    }
    setError(null);
    upload.mutate(file, { onSuccess: (res) => setUploaded(res.name ?? res.type) });
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onPick}
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
        {t('media.add')}
      </Button>
      <p className="text-xs text-gray">{t('media.hint')}</p>
      {uploaded && (
        <p className="text-sm text-success">{t('media.uploaded', { name: uploaded })}</p>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
