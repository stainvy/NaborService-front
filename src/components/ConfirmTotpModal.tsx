import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { TotpInput } from './TotpInput';

interface ConfirmTotpModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (code: string) => void;
  isPending?: boolean;
  isError?: boolean;
}

// Modale de confirmation TOTP pour les actions sensibles (email, suppression,
// rectification RGPD…). Réutilise le TotpInput.
export function ConfirmTotpModal({
  open,
  title,
  onClose,
  onConfirm,
  isPending = false,
  isError = false,
}: ConfirmTotpModalProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [code, setCode] = useState('');

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(code);
        }}
        className="flex flex-col items-center gap-4"
      >
        <p className="text-center text-sm text-gray">{t('auth:totp.prompt')}</p>
        <TotpInput
          value={code}
          onChange={setCode}
          label={t('auth:totp.code_label')}
          disabled={isPending}
        />
        {isError && <p className="text-sm text-error">{t('auth:totp.error')}</p>}
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" disabled={code.length !== 6 || isPending}>
            {t('auth:totp.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
