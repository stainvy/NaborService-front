import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ssoService } from '@/services/sso.service';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';

type EmitterStatus = 'idle' | 'loading' | 'displaying' | 'success' | 'expired' | 'error';

export function SsoQrLogin() {
  const { t } = useTranslation('auth');
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<EmitterStatus>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenUuidRef = useRef<string | null>(null);

  // Nettoyage du polling au démontage
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startQrLogin() {
    setStatus('loading');
    setError(null);
    try {
      const res = await ssoService.generateQr();
      // Extraire le token_uuid de l'URL de scan
      const url = new URL(res.scan_url);
      const tokenUuid = url.searchParams.get('token');
      if (!tokenUuid) throw new Error('Token missing');

      tokenUuidRef.current = tokenUuid;
      setQrCode(res.qr_code);
      setScanUrl(res.scan_url);
      setCopied(false);
      setStatus('displaying');

      // Démarrer le polling toutes les 2 secondes
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await ssoService.getQrStatus(tokenUuid);
          if (statusRes.status === 'validated') {
            clearInterval(pollRef.current!);
            if (!statusRes.access_token) {
              setStatus('error');
              return;
            }
            setStatus('success');
            // Réutilise le même système que la connexion classique.
            await setSession(statusRes.access_token);
            navigate('/', { replace: true });
          } else if (statusRes.status === 'expired') {
            clearInterval(pollRef.current!);
            setStatus('expired');
          }
        } catch {
          // erreur réseau silencieuse, on continue le polling
        }
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setError(t('sso.generic_error'));
    }
  }

  async function handleCopy() {
    if (!scanUrl) return;
    try {
      await navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback pour les contextes non-sécurisés
      const ta = document.createElement('textarea');
      ta.value = scanUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCancel() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('idle');
    setQrCode(null);
    setScanUrl(null);
    setCopied(false);
    setError(null);
  }

  // Bouton initial
  if (status === 'idle') {
    return (
      <Button variant="secondary" onClick={startQrLogin} className="w-full">
        {t('sso.login_via_qr')}
      </Button>
    );
  }

  // Chargement initial
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
        <p className="text-sm text-gray">{t('sso.generating')}</p>
      </div>
    );
  }

  // QR affiché + polling en cours
  if (status === 'displaying' && qrCode) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray">{t('sso.scan_instructions')}</p>
        <img src={qrCode} alt="QR Code SSO" className="h-48 w-48 rounded-lg border" />
        <p className="text-xs text-gray animate-pulse">{t('sso.awaiting_scan')}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopy} className="text-sm">
            {copied ? '✓ ' + t('sso.copied') : t('sso.copy_link')}
          </Button>
          <Button variant="secondary" onClick={handleCancel} className="text-sm">
            {t('sso.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  // Expiré
  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-red-600">{t('sso.expired')}</p>
        <Button variant="secondary" onClick={startQrLogin}>
          {t('sso.regenerate')}
        </Button>
      </div>
    );
  }

  // Succès
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-green-100 p-3 text-green-600 text-2xl">✓</div>
        <p className="text-sm font-medium text-green-700">{t('sso.emitter_success')}</p>
      </div>
    );
  }

  // Erreur
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-red-600">{error ?? t('sso.generic_error')}</p>
      <Button variant="secondary" onClick={startQrLogin}>
        {t('sso.retry')}
      </Button>
    </div>
  );
}
