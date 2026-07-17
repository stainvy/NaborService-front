import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Coins, MessageSquare, Minus } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoleSelect } from './RoleSelect';
import { adminUserStatus, type AdminUser } from '@/types/admin';
import type { Role } from '@/types/roles';
import {
  useUpdateUserRole,
  useSuspendUser,
  useRestoreUser,
  useResetUserTotp,
  useDeleteUser,
} from '../hooks/useAdminUsers';

interface UserDetailModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

type PendingAction = 'suspend' | 'restore' | 'reset_totp' | 'delete' | null;

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const { t } = useTranslation('admin');
  const [pending, setPending] = useState<PendingAction>(null);

  const updateRole = useUpdateUserRole();
  const suspend = useSuspendUser();
  const restore = useRestoreUser();
  const resetTotp = useResetUserTotp();
  const deleteUser = useDeleteUser();

  if (!user) return null;

  const loading = updateRole.isPending || suspend.isPending || restore.isPending || resetTotp.isPending || deleteUser.isPending;
  const status = adminUserStatus(user);

  function handleRoleChange(role: Role) {
    if (!user || role === user.role) return;
    updateRole.mutate({ id: user.id, role });
  }

  function runPending() {
    if (!user || !pending) return;
    const done = () => setPending(null);
    if (pending === 'suspend') suspend.mutate(user.id, { onSuccess: done });
    else if (pending === 'restore') restore.mutate(user.id, { onSuccess: done });
    else if (pending === 'reset_totp') resetTotp.mutate(user.id, { onSuccess: done });
    else if (pending === 'delete') deleteUser.mutate(user.id, { onSuccess: () => { done(); onClose(); } });
  }

  const confirmCopy: Record<Exclude<PendingAction, null>, string> = {
    suspend: t('users.confirm_suspend'),
    restore: t('users.confirm_restore'),
    reset_totp: t('users.confirm_reset_totp'),
    delete: t('users.confirm_delete'),
  };

  return (
    <>
      <Modal open onClose={onClose} title={t('users.user_detail')}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-semibold text-admin-text">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-admin-muted">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-admin-text">
            <span className="text-admin-muted">{t('users.col_status')}:</span>
            <span>{t(`users.status_${status}`)}</span>
            <span className="text-admin-muted">{t('users.col_totp')}:</span>
            <span>{user.mfaEnabled ? <Check className="h-4 w-4 text-green-600" /> : <Minus className="h-4 w-4 text-admin-muted" />}</span>
            <span className="text-admin-muted">{t('users.col_points')}:</span>
            <span>{user.pointsBalance}</span>
            <span className="text-admin-muted">{t('users.col_payouts_enabled')}:</span>
            <span>{user.payoutsEnabled ? <Check className="h-4 w-4 text-green-600" /> : <Minus className="h-4 w-4 text-admin-muted" />}</span>
            <span className="text-admin-muted">{t('users.col_created')}:</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-admin-muted">{t('users.change_role')}:</span>
            <RoleSelect value={user.role} onChange={handleRoleChange} disabled={loading} />
          </div>

          <Link
            to={`/admin/messages?userId=${user.id}`}
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-admin-accent hover:underline"
          >
            <MessageSquare className="h-4 w-4" /> {t('users.view_conversations')}
          </Link>

          <Link
            to={`/admin/points?userId=${user.id}`}
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-admin-accent hover:underline"
          >
            <Coins className="h-4 w-4" /> {t('users.view_points_ledger')}
          </Link>

          <div className="flex flex-wrap gap-2 border-t border-admin-border pt-3">
            {status === 'suspended' ? (
              <Button tone="admin" variant="secondary" disabled={loading} onClick={() => setPending('restore')}>
                {t('users.action_restore')}
              </Button>
            ) : (
              <Button tone="admin" variant="secondary" disabled={loading} onClick={() => setPending('suspend')}>
                {t('users.action_suspend')}
              </Button>
            )}
            <Button tone="admin" variant="secondary" disabled={loading} onClick={() => setPending('reset_totp')}>
              {t('users.action_reset_totp')}
            </Button>
            <Button
              tone="admin"
              disabled={loading}
              onClick={() => setPending('delete')}
              className="!bg-error hover:!opacity-90"
            >
              {t('users.action_delete')}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button tone="admin" variant="secondary" onClick={onClose}>
              {t('users.close')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pending !== null}
        tone="admin"
        destructive={pending === 'delete'}
        title={pending ? t(`users.action_${pending}`) : ''}
        message={pending ? confirmCopy[pending] : ''}
        loading={loading}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
