import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { mediaUrl } from '@/lib/media';
import { useUploadListingMedia, useDeleteListingMedia } from '../hooks/useListingMedia';

const PHOTO_MAX = 5 * 1024 * 1024; // 5 MB

interface Props {
  id: string;
  mediaIds: string[];
  editable?: boolean;
}

// Galerie de photos d'une annonce + upload/suppression en mode édition.
export function ListingMedia({ id, mediaIds, editable = false }: Props) {
  const { t } = useTranslation('listings');
  const upload = useUploadListingMedia(id);
  const remove = useDeleteListingMedia(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > PHOTO_MAX) {
      setError(t('media.too_large'));
      return;
    }
    setError(null);
    upload.mutate(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {mediaIds.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {mediaIds.map((mid) => (
            <div key={mid} className="relative">
              <img
                src={mediaUrl(mid) ?? ''}
                alt=""
                className="h-32 w-full rounded-md object-cover"
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => remove.mutate(mid)}
                  className="absolute right-1 top-1 rounded-full bg-error px-2 text-xs text-white"
                  aria-label={t('media.remove')}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending || mediaIds.length >= 8}
          >
            {t('media.add')}
          </Button>
          <p className="mt-1 text-xs text-gray">{t('media.hint')}</p>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
