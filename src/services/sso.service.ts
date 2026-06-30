import { api } from '@/lib/api';

function getDefaultDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = 'Navigateur';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  let os = '';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac/.test(ua)) os = 'Mac';
  else if (/Linux/.test(ua) && !/Android/.test(ua)) os = 'Linux';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

  const type = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'web';
  return os ? `${browser} sur ${os} (${type})` : `${browser} (${type})`;
}

export interface SsoGenerateResponse {
  qr_code: string; // data:image/png;base64,...
  scan_url: string; // URL contenue dans le QR
}

export interface SsoStatusResponse {
  status: 'pending' | 'validated' | 'expired';
  access_token?: string;
}

export interface SsoValidatePayload {
  token_uuid: string;
}

export const ssoService = {
  /** Émetteur : génère un QR code et un token de session SSO. */
  generateQr(deviceName?: string): Promise<SsoGenerateResponse> {
    return api.post<SsoGenerateResponse>('/auth/sso/qr/generate', {
      device_name: deviceName ?? getDefaultDeviceName(),
    }).then((r) => r.data);
  },

  /** Émetteur : poll le statut de la session SSO jusqu'à validation. */
  getQrStatus(tokenUuid: string): Promise<SsoStatusResponse> {
    return api.get<SsoStatusResponse>(`/auth/sso/qr/${tokenUuid}/status`).then((r) => r.data);
  },

  /** Scanneur : valide le QR scanné → crée une session pour le device émetteur. */
  validateQr(payload: SsoValidatePayload): Promise<void> {
    return api.post('/auth/sso/qr/validate', payload).then(() => undefined);
  },
};
