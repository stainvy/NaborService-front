import { api } from '@/lib/api';
import type { CategoryNode } from '@/types/category';

// Catégories (arbres hiérarchiques). Routes publiques.
export const categoriesService = {
  listingCategories(): Promise<CategoryNode[]> {
    return api.get<CategoryNode[]>('/categories/listings').then((r) => r.data);
  },

  eventCategories(): Promise<CategoryNode[]> {
    return api.get<CategoryNode[]>('/categories/events').then((r) => r.data);
  },
};
