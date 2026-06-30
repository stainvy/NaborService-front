import { api } from '@/lib/api';
import type { Listing } from '@/types/listing';

export const listingsService = {
  getById(listingId: string): Promise<Listing> {
    return api.get<Listing>(`/listings/${listingId}`).then((r) => r.data);
  },
};
