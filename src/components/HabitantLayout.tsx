import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';

// Coquille de la zone habitant : montée une seule fois autour de toutes les
// pages protégées. L'en-tête reste fixe ; les pages défilent dans <main>.
// Les pages pleine hauteur (messagerie) posent un enfant `h-full` qui gère
// son propre scroll interne.
export function HabitantLayout() {
  return (
    <div className="flex h-screen flex-col bg-surface">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
