/** Remplace les champs binaires par "[BINARY]" et les champs chiffrés par "[ENCRYPTED]". */
export function redactDocument(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc)) {
    if (key === 'data' || key === 'pdf' || key === 'qr_png' || key === 'canvas_b64') {
      out[key] = `[BINARY: ${typeof val === 'string' ? val.length + ' chars' : '—'}]`;
    } else if (key === 'content_encrypted' || key === 'iv' || key === 'auth_tag') {
      out[key] = '[ENCRYPTED]';
    } else if (key === 'email' || key === 'signed_ip' || key === 'full_name') {
      out[key] = typeof val === 'string' ? val.slice(0, 3) + '***' : '[REDACTED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      out[key] = redactDocument(val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Bloc compact pour afficher un label + valeur JSON. */
export function MiniBlock({
  label,
  json,
  value,
}: {
  label: string;
  json?: unknown;
  value?: unknown;
}) {
  const display = json !== undefined ? JSON.stringify(json, null, 2) : String(value ?? '—');
  return (
    <div className="rounded border border-admin-border bg-admin-surface p-3">
      <p className="mb-1 text-xs font-medium text-admin-muted">{label}</p>
      <pre className="max-h-40 overflow-auto font-mono text-xs text-admin-text">{display}</pre>
    </div>
  );
}
