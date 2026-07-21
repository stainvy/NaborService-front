// Illustration décorative du hero (formes géométriques, sans dépendance).
// Le hero étant sur fond sombre fixe, les couleurs sont volontairement claires
// (maisons blanches, toits/épingles orange, ouvertures navy) via `currentColor`
// par groupe — pas de hex, et pas de token thème (qui virerait au sombre).
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
        <circle cx="200" cy="160" r="150" fill="currentColor" opacity="0.14" />
      </g>
      {/* sol */}
      <g className="text-white">
        <rect x="40" y="250" width="320" height="8" rx="4" fill="currentColor" opacity="0.18" />
      </g>
      {/* maison gauche (corps clair) */}
      <g className="text-white">
        <rect x="70" y="170" width="90" height="80" rx="6" fill="currentColor" opacity="0.92" />
      </g>
      <g className="text-orange">
        <polygon points="62,172 115,126 168,172" fill="currentColor" />
      </g>
      <g className="text-navy">
        <rect x="88" y="192" width="24" height="24" rx="3" fill="currentColor" />
        <rect x="122" y="205" width="22" height="45" rx="3" fill="currentColor" />
      </g>
      {/* maison droite (corps clair) */}
      <g className="text-white">
        <rect x="235" y="150" width="100" height="100" rx="6" fill="currentColor" opacity="0.82" />
      </g>
      <g className="text-orange">
        <polygon points="226,152 285,104 344,152" fill="currentColor" />
      </g>
      <g className="text-navy">
        <rect x="255" y="174" width="26" height="26" rx="3" fill="currentColor" />
        <rect x="293" y="174" width="26" height="26" rx="3" fill="currentColor" />
        <rect x="278" y="212" width="24" height="38" rx="3" fill="currentColor" />
      </g>
      {/* épingles de carte (lien entre voisins) */}
      <g className="text-orange">
        <circle cx="115" cy="86" r="18" fill="currentColor" />
        <circle cx="285" cy="66" r="18" fill="currentColor" />
        <path d="M115 104 L108 124 L122 124 Z" fill="currentColor" />
        <path d="M285 84 L278 104 L292 104 Z" fill="currentColor" />
      </g>
      <g className="text-white">
        <circle cx="115" cy="86" r="7" fill="currentColor" />
        <circle cx="285" cy="66" r="7" fill="currentColor" />
      </g>
      {/* trait de connexion */}
      <g className="text-white">
        <path
          d="M133 88 Q200 36 267 68"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="6 8"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
