import { useQuery } from '@tanstack/react-query';
import { geoService } from '@/services/geo.service';
import { neighbourhoodsService } from '@/services/neighbourhoods.service';
import { geoKeys } from './queryKeys';

export function useBanAutocomplete(query: string, limit = 5) {
  return useQuery({
    queryKey: geoKeys.autocomplete(query),
    queryFn: () => geoService.autocomplete(query, limit),
    enabled: query.length >= 3,
  });
}

export function useResolveNeighbourhood(query: string | undefined) {
  return useQuery({
    queryKey: geoKeys.resolve(query ?? ''),
    queryFn: () => geoService.resolveNeighbourhood(query!),
    enabled: Boolean(query),
    retry: false,
  });
}

export function useNearbyNeighbourhoods(
  point: { latitude: number; longitude: number } | undefined,
  radius = 5000,
) {
  return useQuery({
    queryKey: geoKeys.nearby(point?.latitude ?? 0, point?.longitude ?? 0, radius),
    queryFn: () => neighbourhoodsService.nearby(point!.latitude, point!.longitude, radius),
    enabled: Boolean(point),
  });
}
