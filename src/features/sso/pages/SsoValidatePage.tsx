import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ssoService } from '@/services/sso.service';
import { Button } from '@/components/Button';

type PageStatus = 'preview' | 'loading' | 'success' | 'error';

export function SsoValidatePage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PageStatus>('preview');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const deviceRaw = searchParams.get('device');
  const device = deviceRaw ? decodeURIComponent(deviceRaw) : 'Nabor Services';

  useEffect(() => {
    if (!token) setStatus('error');
  }, [token]);

  async function handleAuthorize() {
    if (!token) return;
    setStatus('loading');
    setError(null);
    try {
      await ssoService.validateQr({ token_uuid: token });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      const code = err?.response?.status;
      if (code === 404) setError(t('sso.expired'));
      else if (code === 401) setError(t('sso.unauthorized'));
      else setError(t('sso.generic_error'));
    }
  }

  if (!token || status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6">
        <div className="rounded-full bg-red-100 p-4 text-red-600 text-3xl">✕</div>
        <h1 className="text-xl font-bold text-navy">{t('sso.error_title')}</h1>
        <p className="text-center text-gray">
          {error ?? t('sso.missing_token')}
        </p>
        <Link to="/" className="text-sm text-orange underline">
          ← {t('sso.back_home')}
        </Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6">
        <div className="rounded-full bg-green-100 p-4 text-green-600 text-3xl">✓</div>
        <h1 className="text-xl font-bold text-navy">{t('sso.success_title')}</h1>
        <p className="text-center text-gray">{t('sso.success_message', { device })}</p>
        <Link to="/" className="text-sm text-orange underline">
          ← {t('sso.back_home')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6">
      <div className="rounded-full bg-blue-100 p-4 text-blue-600 text-3xl">🔑</div>
      <h1 className="text-xl font-bold text-navy">{t('sso.preview_title')}</h1>
      <p className="text-center text-gray max-w-sm">
        {t('sso.preview_message', { device })}
      </p>

      <div className="flex gap-3">
        <Link to="/">
          <Button variant="secondary">{t('sso.deny')}</Button>
        </Link>
        <Button onClick={handleAuthorize} disabled={status === 'loading'}>
          {status === 'loading' ? t('sso.authorizing') : t('sso.authorize')}
        </Button>
      </div>
    </div>
  );
}
