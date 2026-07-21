import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  seeAllTo?: string; // affiche un lien « voir tout » si fourni
  seeAllLabel?: string;
}

// En-tête de section : titre + sous-titre optionnel + lien « voir tout ».
export function SectionHeading({ title, subtitle, seeAllTo, seeAllLabel }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>}
      </div>
      {seeAllTo && (
        <Link
          to={seeAllTo}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-orange hover:underline"
        >
          {seeAllLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
