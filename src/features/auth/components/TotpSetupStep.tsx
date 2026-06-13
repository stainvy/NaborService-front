import { useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TotpInput } from '@/components/TotpInput';
import { useConfirmTotpSetup } from '../hooks/useConfirmTotpSetup';

interface Props {
  challengeToken: string;
  otpauthUrl: string;
  onAuthenticated: () => void;
}

// Cas totp_setup_required : première connexion. On affiche le QR code (otpauthUrl)
// à scanner dans une app d'authentification, puis on confirme avec le code.
export function TotpSetupStep({ challengeToken, otpauthUrl, onAuthenticated }: Props) {
  const { t } = useTranslation('auth');
  const [code, setCode] = useState('');
  const confirm = useConfirmTotpSetup();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    confirm.mutate({ challenge_token: challengeToken, code }, { onSuccess: onAuthenticated });
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-4">
      <p className="text-center text-sm text-gray">{t('totp.setup_prompt')}</p>
      <div className="rounded-md bg-white p-2 ring-1 ring-gray/30">
        <QRCodeSVG value={otpauthUrl} size={176} aria-label={t('totp.qr_alt')} />
      </div>
      <p className="text-center text-sm text-gray">{t('totp.setup_then')}</p>
      <TotpInput
        value={code}
        onChange={setCode}
        label={t('totp.code_label')}
        disabled={confirm.isPending}
      />
      {confirm.isError && <p className="text-sm text-error">{t('totp.error')}</p>}
      <Button type="submit" disabled={code.length !== 6 || confirm.isPending}>
        {t('totp.submit')}
      </Button>
    </form>
  );
}
