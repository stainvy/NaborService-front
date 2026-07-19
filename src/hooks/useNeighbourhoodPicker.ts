import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { neighbourhoodsService } from '@/services/neighbourhoods.service';
import { geoService } from '@/services/geo.service';

export interface Coords {
  lat: number;
  lng: number;
}

const AUTOCOMPLETE_MIN = 3;

// Débounce une valeur (par défaut 300 ms) — pour l'autocomplétion d'adresse.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Liste complète des quartiers (source unique, clé partagée avec le module
// annonces : ['neighbourhoods']).
export function useAllNeighbourhoods() {
  return useQuery({
    queryKey: ['neighbourhoods'] as const,
    queryFn: () => neighbourhoodsService.listAll(),
    staleTime: 5 * 60_000,
  });
}

// Quartiers proches d'un point GPS — activé seulement quand des coordonnées existent.
export function useNearbyNeighbourhoods(coords: Coords | null) {
  return useQuery({
    queryKey: ['neighbourhoods', 'nearby', coords?.lat, coords?.lng] as const,
    queryFn: () => neighbourhoodsService.nearby(coords!.lat, coords!.lng),
    enabled: coords !== null,
  });
}

// Autocomplétion d'adresse BAN — activée à partir d'une longueur minimale.
export function useAddressAutocomplete(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['geo', 'autocomplete', q] as const,
    queryFn: () => geoService.autocomplete(q),
    enabled: q.length >= AUTOCOMPLETE_MIN,
    retry: false,
  });
}

// Résout une adresse choisie en quartier recommandé (BAN).
export function useResolveNeighbourhood() {
  return useMutation({
    mutationFn: (address: string) => geoService.resolveNeighbourhood(address),
  });
}
