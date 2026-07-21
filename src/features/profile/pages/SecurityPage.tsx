import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ConfirmTotpModal } from '@/components/ConfirmTotpModal';
import { useChangePassword, useChangeEmail } from '../hooks/useSecurity';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}
interface EmailForm {
  newEmail: string;
}

export function SecurityPage() {
  const { t } = useTranslation('profile');
  const changePassword = useChangePassword();
  const changeEmail = useChangeEmail();

  // Quelle action attend une confirmation TOTP ?
  const [pending, setPending] = useState<null | 'password' | 'email'>(null);

  const passwordForm = useForm<PasswordForm>();
  const emailForm = useForm<EmailForm>();

  const submitPassword = passwordForm.handleSubmit(() => setPending('password'));
  const submitEmail = emailForm.handleSubmit(() => setPending('email'));

  const onConfirmTotp = (code: string) => {
    if (pending === 'password') {
      const { currentPassword, newPassword } = passwordForm.getValues();
      changePassword.mutate(
        { currentPassword, newPassword, totpCode: code },
        { onSuccess: () => (setPending(null), passwordForm.reset()) },
      );
    } else if (pending === 'email') {
      const { newEmail } = emailForm.getValues();
      changeEmail.mutate(
        { newEmail, totpCode: code },
        { onSuccess: () => (setPending(null), emailForm.reset()) },
      );
    }
  };

  const activeMutation = pending === 'password' ? changePassword : changeEmail;

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('security.title')}</h1>

      {/* Mot de passe */}
      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-navy">{t('security.change_password')}</h2>
        <form onSubmit={submitPassword} className="flex flex-col gap-4">
          <TextField
            label={t('security.current_password')}
            type="password"
            autoComplete="current-password"
            {...passwordForm.register('currentPassword', { required: true })}
          />
          <TextField
            label={t('security.new_password')}
            type="password"
            autoComplete="new-password"
            {...passwordForm.register('newPassword', { required: true, minLength: 12 })}
          />
          {changePassword.isSuccess && (
            <p className="text-sm text-success">{t('security.password_changed')}</p>
          )}
          <Button type="submit">{t('security.password_submit')}</Button>
        </form>
      </section>

      {/* E-mail */}
      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-navy">{t('security.change_email')}</h2>
        <form onSubmit={submitEmail} className="flex flex-col gap-4">
          <TextField
            label={t('security.new_email')}
            type="email"
            autoComplete="email"
            {...emailForm.register('newEmail', { required: true })}
          />
          {changeEmail.isSuccess && (
            <p className="text-sm text-success">{t('security.email_changed')}</p>
          )}
          <Button type="submit">{t('security.email_submit')}</Button>
        </form>
      </section>

      <Link to="/sessions" className="text-sm text-orange underline">
        {t('security.sessions_link')}
      </Link>

      <ConfirmTotpModal
        open={pending !== null}
        title={t('security.totp_title')}
        onClose={() => setPending(null)}
        onConfirm={onConfirmTotp}
        isPending={activeMutation.isPending}
        isError={activeMutation.isError}
      />
    </div>
  );
}
