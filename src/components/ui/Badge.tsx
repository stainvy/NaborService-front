import type { ReactNode } from 'react';

type BadgeTone = 'navy' | 'orange' | 'success' | 'error' | 'muted';

const TONES: Record<BadgeTone, string> = {
  navy: 'bg-navy/10 text-fg',
  orange: 'bg-orange/15 text-orange',
  success: 'bg-success/15 text-success',
  error: 'bg-error/15 text-error',
  muted: 'bg-brand-border text-brand-muted',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

// Pastille de statut ou de compteur, déclinée par tonalité de marque.
export function Badge({ tone = 'navy', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
