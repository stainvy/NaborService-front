import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { AuthCard } from '../components/AuthCard';
import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterForm } from '../schemas';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const register_ = useRegister();
  const schema = useMemo(() => registerSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    register_.mutate(values, {
      // Redirige vers /login avec un message de succès (flux du back).
      onSuccess: () => navigate('/login', { state: { registered: true } }),
    });
  });

  return (
    <AuthCard title={t('register.title')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t('register.first_name')}
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label={t('register.last_name')}
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <TextField
          label={t('login.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label={t('login.password')}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {register_.isError && <p className="text-sm text-error">{t('register.error')}</p>}

        <Button type="submit" disabled={register_.isPending}>
          {t('register.submit')}
        </Button>

        <Link to="/login" className="text-center text-sm text-orange underline">
          {t('register.to_login')}
        </Link>
      </form>
    </AuthCard>
  );
}
