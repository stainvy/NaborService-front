import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  seeAllTo?: string; // affiche un lien « voir tout » si fourni
  seeAllLabel?: string;
  align?: 'left' | 'center'; // 'center' pour les grandes sections de vitrine
  invert?: boolean; // texte clair sur fond sombre
}

// En-tête de section : titre + sous-titre optionnel + lien « voir tout ».
// `align='center'` centre le bloc (largeur de texte limitée) — pour la landing.
export function SectionHeading({
  title,
  subtitle,
  seeAllTo,
  seeAllLabel,
  align = 'left',
  invert = false,
}: SectionHeadingProps) {
  const titleColor = invert ? 'text-white' : 'text-fg';
  const subtitleColor = invert ? 'text-white/70' : 'text-muted';

  if (align === 'center') {
    return (
      <div className="mb-10 text-center">
        <h2 className={`text-2xl font-bold sm:text-3xl ${titleColor}`}>{title}</h2>
        {subtitle && <p className={`mx-auto mt-3 max-w-2xl text-base ${subtitleColor}`}>{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className={`text-lg font-semibold ${titleColor}`}>{title}</h2>
        {subtitle && <p className={`mt-0.5 text-sm ${subtitleColor}`}>{subtitle}</p>}
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
