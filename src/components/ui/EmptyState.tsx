import type { ComponentType, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode; // ex. un <Link><Button/></Link>
}

// État vide : icône + message + CTA optionnel. Pour les listes sans contenu.
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy/70">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="font-semibold text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-brand-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
