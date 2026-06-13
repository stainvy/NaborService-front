import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { AuthCard } from '../components/AuthCard';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { forgotPasswordSchema, type ForgotPasswordForm } from '../schemas';

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const forgot = useForgotPassword();
  const schema = useMemo(() => forgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => forgot.mutate(values));

  return (
    <AuthCard title={t('forgot.title')}>
      {/* Le back répond toujours 200 (ne révèle pas si l'email existe). */}
      {forgot.isSuccess ? (
        <p className="text-sm text-success">{t('forgot.sent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <p className="text-sm text-gray">{t('forgot.prompt')}</p>
          <TextField
            label={t('login.email')}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" disabled={forgot.isPending}>
            {t('forgot.submit')}
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-4 block text-center text-sm text-orange underline">
        {t('register.to_login')}
      </Link>
    </AuthCard>
  );
}
