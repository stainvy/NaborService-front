export const ROLES = ['resident', 'neighbourhood_rep', 'moderator', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/** Rang numérique d'un rôle (plus c'est haut, plus il y a de droits). */
const ROLE_RANK: Record<Role, number> = {
  resident: 0,
  neighbourhood_rep: 1,
  moderator: 2,
  admin: 3,
};

/** `true` si `role` est au moins aussi élevé que `minRole`. */
export function hasMinRole(role: Role | undefined | null, minRole: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}
