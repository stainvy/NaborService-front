import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { AuthCard } from '../components/AuthCard';
import { TotpChallengeStep } from '../components/TotpChallengeStep';
import { TotpSetupStep } from '../components/TotpSetupStep';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginForm } from '../schemas';
import type { LoginChallenge } from '@/types/auth';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered ?? false;

  const login = useLogin();
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const schema = useMemo(() => loginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onAuthenticated = () => navigate('/', { replace: true });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: setChallenge });
  });

  // Étape 2 — TOTP, selon le type de challenge renvoyé par le login.
  if (challenge?.challenge === 'totp_required') {
    return (
      <AuthCard title={t('totp.title')}>
        <TotpChallengeStep
          challengeToken={challenge.challenge_token}
          onAuthenticated={onAuthenticated}
        />
      </AuthCard>
    );
  }
  if (challenge?.challenge === 'totp_setup_required') {
    return (
      <AuthCard title={t('totp.setup_title')}>
        <TotpSetupStep
          challengeToken={challenge.challenge_token}
          otpauthUrl={challenge.otpauthUrl}
          onAuthenticated={onAuthenticated}
        />
      </AuthCard>
    );
  }

  // Étape 1 — identifiants.
  return (
    <AuthCard title={t('login.title')}>
      {justRegistered && <p className="mb-4 text-sm text-success">{t('register.success')}</p>}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {login.isError && <p className="text-sm text-error">{t('login.error')}</p>}

        <Button type="submit" disabled={login.isPending}>
          {t('login.submit')}
        </Button>

        <div className="flex flex-col gap-1 text-center text-sm">
          <Link to="/forgot-password" className="text-orange underline">
            {t('login.forgot')}
          </Link>
          <Link to="/register" className="text-orange underline">
            {t('login.to_register')}
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
