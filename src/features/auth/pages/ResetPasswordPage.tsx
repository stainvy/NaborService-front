import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { AuthCard } from '../components/AuthCard';
import { useResetPassword } from '../hooks/useResetPassword';
import { resetPasswordSchema, type ResetPasswordForm } from '../schemas';

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const reset = useResetPassword();
  const schema = useMemo(() => resetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    reset.mutate(
      { token, password: values.password },
      { onSuccess: () => navigate('/login', { state: { reset: true } }) },
    );
  });

  // Sans token dans l'URL, le lien de réinitialisation est invalide.
  if (!token) {
    return (
      <AuthCard title={t('reset.title')}>
        <p className="text-sm text-error">{t('reset.invalid_link')}</p>
        <Link
          to="/forgot-password"
          className="mt-4 block text-center text-sm text-orange underline"
        >
          {t('reset.request_new')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('reset.title')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t('reset.new_password')}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label={t('reset.confirm_password')}
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        {reset.isError && <p className="text-sm text-error">{t('reset.error')}</p>}

        <Button type="submit" disabled={reset.isPending}>
          {t('reset.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
