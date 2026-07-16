// Arbre des catégories d'annonces (GET /categories/listings, public).
// ⚠️ Liste vide en local au sondage : la forme exacte des nœuds n'est pas
// confirmée. Type tolérant — on lit le libellé et les enfants défensivement
// (cf. categoryLabel / categoryChildren).
export interface CategoryNode {
  id: number;
  name?: string;
  categoryName?: string;
  parentCategory?: number | null;
  children?: CategoryNode[];
  subcategories?: CategoryNode[];
  [key: string]: unknown;
}

export function categoryLabel(node: CategoryNode): string {
  return node.name ?? node.categoryName ?? `#${node.id}`;
}

export function categoryChildren(node: CategoryNode): CategoryNode[] {
  return node.children ?? node.subcategories ?? [];
}

// Aplatit l'arbre en options indentées { id, label } pour un <select>.
export function flattenCategories(
  nodes: CategoryNode[],
  depth = 0,
): { id: number; label: string }[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${'  '.repeat(depth)}${categoryLabel(node)}` },
    ...flattenCategories(categoryChildren(node), depth + 1),
  ]);
}
