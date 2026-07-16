import { mediaUrl } from '@/lib/media';

interface AvatarProps {
  mongoId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
}

// Avatar avec fallback initiales quand aucune image n'est disponible.
export function Avatar({ mongoId, firstName, lastName, size = 48 }: AvatarProps) {
  const url = mediaUrl(mongoId);
  const first = firstName ?? '';
  const last = lastName ?? '';
  const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
  const dimension = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt={`${first} ${last}`.trim()}
        style={dimension}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ ...dimension, fontSize: size * 0.4 }}
      className="flex items-center justify-center rounded-full bg-navy font-semibold text-white"
      aria-label={`${first} ${last}`.trim() || 'avatar'}
    >
      {initials}
    </div>
  );
}
