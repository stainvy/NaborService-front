import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TotpInput } from '@/components/TotpInput';
import { useVerifyTotp } from '../hooks/useVerifyTotp';

interface Props {
  challengeToken: string;
  onAuthenticated: () => void;
}

// Cas totp_required : l'utilisateur a déjà configuré le TOTP, il saisit son code.
export function TotpChallengeStep({ challengeToken, onAuthenticated }: Props) {
  const { t } = useTranslation('auth');
  const [code, setCode] = useState('');
  const verify = useVerifyTotp();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    verify.mutate({ challenge_token: challengeToken, code }, { onSuccess: onAuthenticated });
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-4">
      <p className="text-center text-sm text-gray">{t('totp.prompt')}</p>
      <TotpInput
        value={code}
        onChange={setCode}
        label={t('totp.code_label')}
        disabled={verify.isPending}
      />
      {verify.isError && <p className="text-sm text-error">{t('totp.error')}</p>}
      <Button type="submit" disabled={code.length !== 6 || verify.isPending}>
        {t('totp.submit')}
      </Button>
    </form>
  );
}
