// Illustration décorative de la vitrine (formes géométriques, sans dépendance).
// Emplacement volontairement remplaçable par un vrai visuel plus tard.
// Les couleurs viennent de `currentColor` par groupe → tokens Tailwind, pas de hex.
export function HeroIllustration({ alt }: { alt: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      role="img"
      aria-label={alt}
      className="h-auto w-full max-w-md"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* halo */}
      <g className="text-orange">
        <circle cx="200" cy="160" r="150" fill="currentColor" opacity="0.08" />
      </g>
      {/* sol */}
      <g className="text-navy">
        <rect x="40" y="250" width="320" height="8" rx="4" fill="currentColor" opacity="0.15" />
      </g>
      {/* maison gauche */}
      <g className="text-navy">
        <rect x="70" y="170" width="90" height="80" rx="6" fill="currentColor" />
        <polygon points="65,172 115,130 165,172" fill="currentColor" opacity="0.85" />
      </g>
      <g className="text-white">
        <rect x="88" y="195" width="24" height="24" rx="3" fill="currentColor" opacity="0.9" />
        <rect x="120" y="205" width="22" height="45" rx="3" fill="currentColor" opacity="0.9" />
      </g>
      {/* maison droite */}
      <g className="text-navy">
        <rect x="235" y="150" width="100" height="100" rx="6" fill="currentColor" opacity="0.9" />
        <polygon points="228,152 285,108 342,152" fill="currentColor" />
      </g>
      <g className="text-white">
        <rect x="255" y="175" width="26" height="26" rx="3" fill="currentColor" opacity="0.9" />
        <rect x="292" y="175" width="26" height="26" rx="3" fill="currentColor" opacity="0.9" />
        <rect x="278" y="212" width="24" height="38" rx="3" fill="currentColor" opacity="0.9" />
      </g>
      {/* épingles de carte (lien entre voisins) */}
      <g className="text-orange">
        <circle cx="115" cy="90" r="18" fill="currentColor" />
        <circle cx="285" cy="70" r="18" fill="currentColor" />
        <path d="M115 108 L108 128 L122 128 Z" fill="currentColor" />
        <path d="M285 88 L278 108 L292 108 Z" fill="currentColor" />
      </g>
      <g className="text-white">
        <circle cx="115" cy="90" r="7" fill="currentColor" />
        <circle cx="285" cy="70" r="7" fill="currentColor" />
      </g>
      {/* trait de connexion */}
      <g className="text-orange">
        <path
          d="M133 92 Q200 40 267 72"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="6 8"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
