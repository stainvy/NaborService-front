// Placeholder animé pour les états de chargement.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-brand-border/70 ${className}`} />;
}

// Squelette prêt à l'emploi imitant une carte de contenu (image + lignes).
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-soft">
      <Skeleton className="mb-3 h-32 w-full" />
      <Skeleton className="mb-2 h-4 w-1/3" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
