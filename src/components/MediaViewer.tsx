import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Modal } from './Modal';
import { mediaUrl } from '@/lib/media';

export interface ViewableFile {
  media_id: string;
  filename: string;
  mimetype: string;
}

// Aperçu inline d'un fichier (image / audio / vidéo / PDF) avec repli
// « téléchargement » pour les formats non affichables. Composant portable
// (namespace `common`, aucune dépendance à une feature) : réutilisable dans la
// messagerie comme dans l'administration. Le endpoint /media/:id/stream est
// servable directement (déjà utilisé par <img>/<video>), donc aucun en-tête
// d'authentification n'est nécessaire ici.
export function MediaViewer({ file, onClose }: { file: ViewableFile | null; onClose: () => void }) {
  const { t } = useTranslation('common');
  if (!file) return null;

  const url = mediaUrl(file.media_id);
  const { mimetype } = file;
  const isImage = mimetype.startsWith('image/');
  const isAudio = mimetype.startsWith('audio/');
  const isVideo = mimetype.startsWith('video/');
  const isPdf = mimetype === 'application/pdf';
  const previewable = isImage || isAudio || isVideo || isPdf;

  return (
    <Modal open onClose={onClose} title={file.filename} maxWidthClass="max-w-4xl">
      <div className="flex flex-col gap-3">
        <div className="flex max-h-[75vh] min-h-[8rem] items-center justify-center overflow-auto rounded-md bg-gray/10">
          {url && isImage && <img src={url} alt={file.filename} className="max-h-[75vh] max-w-full object-contain" />}
          {url && isAudio && <audio controls src={url} className="w-full p-4" />}
          {url && isVideo && <video controls src={url} className="max-h-[75vh] max-w-full" />}
          {url && isPdf && <iframe title={file.filename} src={url} className="h-[75vh] w-full" />}
          {(!url || !previewable) && (
            <p className="p-8 text-sm text-gray">{t('media.preview_unavailable')}</p>
          )}
        </div>
        {url && (
          <a
            href={url}
            download={file.filename}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-gray/30 px-3 py-1.5 text-sm text-fg hover:bg-gray/10"
          >
            <Download className="h-4 w-4" /> {t('media.download')}
          </a>
        )}
      </div>
    </Modal>
  );
}
