import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLES, type Role } from '@/types/roles';
import { ServerDataTable } from '../components/ServerDataTable';
import { UserDetailModal } from '../components/UserDetailModal';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { adminUserStatus, type AdminUser } from '@/types/admin';

const LIMIT = 20;

export function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const [role, setRole] = useState<Role | ''>('');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const { data, isLoading } = useAdminUsers({ role: role || undefined, q: q || undefined, offset, limit: LIMIT });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('users.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('users.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOffset(0); }}
          placeholder={t('users.search_placeholder')}
          className="w-64 rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as Role | ''); setOffset(0); }}
          className="rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        >
          <option value="">{t('users.all_roles')}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <ServerDataTable<AdminUser>
        columns={[
          { key: 'email', label: t('users.col_email') },
          { key: 'name', label: t('users.col_name'), render: (u) => `${u.firstName} ${u.lastName}` },
          { key: 'role', label: t('users.col_role') },
          { key: 'status', label: t('users.col_status'), render: (u) => t(`users.status_${adminUserStatus(u)}`) },
          { key: 'totp', label: t('users.col_totp'), render: (u) => (u.mfaEnabled ? '✓' : '—') },
          { key: 'createdAt', label: t('users.col_created'), render: (u) => new Date(u.createdAt).toLocaleDateString() },
        ]}
        data={data?.users ?? []}
        total={data?.total ?? 0}
        offset={offset}
        limit={LIMIT}
        onPageChange={setOffset}
        onRowClick={setSelected}
        rowKey={(u) => u.id}
        loading={isLoading}
        emptyMessage={t('users.empty')}
      />

      <UserDetailModal user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
