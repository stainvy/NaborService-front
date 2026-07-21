import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasMinRole } from '@/types/roles';

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-admin-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function AdminNavLink({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-admin-sidebarHover font-medium text-admin-accent'
            : 'text-admin-textInverse hover:bg-admin-sidebarHover'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function AdminLayout() {
  const { t } = useTranslation('admin');
  const { role } = useAuth();
  const isAdmin = hasMinRole(role, 'admin');

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <aside className="flex w-56 shrink-0 flex-col gap-1 bg-admin-sidebar px-3 py-4">
        <Link to="/app" className="mb-1 flex items-center gap-1 px-3 text-xs text-admin-muted underline hover:text-admin-textInverse">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('nav_home')}
        </Link>
        <h1 className="mb-2 px-3 text-lg font-bold text-white">{t('title')}</h1>

        <nav className="flex flex-col">
          <NavSection label={t('nav.overview')}>
            <AdminNavLink to="/admin" end>
              {t('nav.dashboard')}
            </AdminNavLink>
          </NavSection>

          <NavSection label={t('nav.moderation')}>
            <AdminNavLink to="/admin/moderation/listings">{t('nav.moderation_listings')}</AdminNavLink>
            <AdminNavLink to="/admin/moderation/events">{t('nav.moderation_events')}</AdminNavLink>
            <AdminNavLink to="/admin/messages">{t('nav.messages')}</AdminNavLink>
            <AdminNavLink to="/admin/incidents">{t('nav.incidents')}</AdminNavLink>
          </NavSection>

          {isAdmin && (
            <NavSection label={t('nav.users')}>
              <AdminNavLink to="/admin/users">{t('nav.users')}</AdminNavLink>
            </NavSection>
          )}

          <NavSection label={t('nav.community')}>
            <AdminNavLink to="/admin/geo">{t('nav.geo')}</AdminNavLink>
          </NavSection>

          {isAdmin && (
            <NavSection label={t('nav.platform')}>
              <AdminNavLink to="/admin/config">{t('nav.config')}</AdminNavLink>
              <AdminNavLink to="/admin/rgpd">{t('nav.rgpd')}</AdminNavLink>
              <AdminNavLink to="/admin/points">{t('nav.points')}</AdminNavLink>
            </NavSection>
          )}

          <NavSection label={t('nav.dev_tools')}>
            <AdminNavLink to="/admin/dsl/console">{t('nav.dsl_console')}</AdminNavLink>
            <AdminNavLink to="/admin/dsl/audit">{t('nav.dsl_audit')}</AdminNavLink>
            <AdminNavLink to="/admin/dsl/explorer">{t('nav.dsl_explorer')}</AdminNavLink>
            <AdminNavLink to="/admin/api-explorer">{t('nav.api_explorer')}</AdminNavLink>
          </NavSection>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
