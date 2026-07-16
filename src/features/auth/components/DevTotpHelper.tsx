import { useEffect, useState } from 'react';

// Helper de DÉVELOPPEMENT uniquement (rendu seulement si import.meta.env.DEV).
// Calcule le code TOTP courant à partir de l'otpauthUrl, sur l'horloge du
// navigateur (= celle du back en local). Évite d'avoir à utiliser un téléphone
// dont l'heure réelle diffère de la date simulée du back.

function base32ToBytes(b32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of b32.replace(/=+$/, '').toUpperCase()) {
    const val = alphabet.indexOf(c);
    if (val >= 0) bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(bytes);
}

async function computeTotp(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    base32ToBytes(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
  const offset = sig[sig.length - 1] & 0xf;
  const code =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  return (code % 1e6).toString().padStart(6, '0');
}

export function DevTotpHelper({
  otpauthUrl,
  onUseCode,
}: {
  otpauthUrl: string;
  onUseCode: (code: string) => void;
}) {
  const secret = otpauthUrl.match(/secret=([^&]+)/)?.[1] ?? '';
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    if (!secret) return;
    let active = true;
    const tick = async () => {
      const c = await computeTotp(secret);
      if (!active) return;
      setCode(c);
      setRemaining(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    void tick();
    const iv = setInterval(() => void tick(), 1000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [secret]);

  if (!secret) return null;

  return (
    <div className="w-full rounded-md border border-dashed border-orange bg-orange/5 p-3 text-center text-xs">
      <p className="font-semibold text-orange">DEV — code calculé sur l'horloge du back</p>
      <button
        type="button"
        onClick={() => onUseCode(code)}
        className="mt-1 font-mono text-lg tracking-widest text-navy underline"
      >
        {code || '······'}
      </button>
      <p className="text-gray">expire dans {remaining}s — clique pour pré-remplir</p>
      <p className="mt-1 break-all font-mono text-[10px] text-gray">secret : {secret}</p>
    </div>
  );
}
