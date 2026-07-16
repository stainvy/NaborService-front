import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from './AuthProvider';
import { CallProvider } from '@/features/calls/CallProvider';
import { CallColumn } from '@/features/calls/CallColumn';
import { MediaPermissionDialog } from '@/features/calls/MediaPermissionDialog';

/** Composition des providers globaux : TanStack Query + Auth + Appels. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CallProvider>
          {children}
          {/* Overlay d'appel global (entrant/sortant/actif), au-dessus de toute page. */}
          <CallColumn />
          {/* Rendue à part de CallColumn : survit au retour à phase 'idle' déclenché
              par le refus de permission lui-même (voir MediaPermissionDialog). */}
          <MediaPermissionDialog />
        </CallProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
