import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { useCall } from './callContext';

/**
 * Popup persistante affichée quand l'accès micro/caméra a été refusé —
 * rendue à côté de `CallColumn` (pas dedans) pour ne pas dépendre de
 * `phase`, qui repasse à 'idle' dès que l'appel est raccroché en réponse
 * au refus (voir CallProvider.getLocalMedia / cleanup).
 */
export function MediaPermissionDialog() {
  const { t } = useTranslation('messages');
  const { error, clearError } = useCall();

  const isPermissionError = error === 'mic_denied' || error === 'camera_denied';
  if (!isPermissionError) return null;

  return (
    <Modal open={isPermissionError} onClose={clearError} title={t('call.permission_dialog_title')}>
      <p className="mb-5 text-sm text-gray">
        {t(error === 'mic_denied' ? 'call.error_mic_denied' : 'call.error_camera_denied')}
      </p>
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={clearError}>
          {t('call.permission_dialog_ok')}
        </Button>
      </div>
    </Modal>
  );
}
