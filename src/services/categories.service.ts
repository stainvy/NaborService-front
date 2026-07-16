import { api } from '@/lib/api';
import type { CategoryNode } from '@/types/category';

// Catégories d'annonces (arbre hiérarchique). Route publique.
export const categoriesService = {
  listingCategories(): Promise<CategoryNode[]> {
    return api.get<CategoryNode[]>('/categories/listings').then((r) => r.data);
  },
};
