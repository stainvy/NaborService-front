import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { adminKeys } from './queryKeys';

export function useStatsOverview() {
  return useQuery({ queryKey: adminKeys.statsOverview, queryFn: () => adminService.getStatsOverview() });
}

export function useStatsListings() {
  return useQuery({ queryKey: adminKeys.statsListings, queryFn: () => adminService.getStatsListings() });
}

export function useStatsEvents() {
  return useQuery({ queryKey: adminKeys.statsEvents, queryFn: () => adminService.getStatsEvents() });
}

export function useStatsPayments() {
  return useQuery({ queryKey: adminKeys.statsPayments, queryFn: () => adminService.getStatsPayments() });
}

export function useStatsUsers() {
  return useQuery({ queryKey: adminKeys.statsUsers, queryFn: () => adminService.getStatsUsers() });
}

export function useStatsIncidents() {
  return useQuery({ queryKey: adminKeys.statsIncidents, queryFn: () => adminService.getStatsIncidents() });
}
