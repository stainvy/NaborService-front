import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'flat' | 'interactive';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const BASE = 'rounded-2xl border border-brand-border bg-brand-surface';
const VARIANTS: Record<CardVariant, string> = {
  flat: 'shadow-soft',
  interactive:
    'shadow-soft transition-all hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-card',
};

// Surface de contenu réutilisable (remplace les `div rounded-xl border …`
// dispersés). `interactive` ajoute un survol pour les cartes cliquables.
export function Card({ variant = 'flat', className = '', children, ...props }: CardProps) {
  return (
    <div className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
