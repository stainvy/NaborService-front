import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, UserPlus, HelpCircle } from 'lucide-react';
import { FullPageLoader } from '@/components/FullPageLoader';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/hooks/useAuth';
import type { GroupRole } from '@/types/chat';
import {
  useGroupMembers,
  useAddMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '../hooks/useChatGroups';
import { MemberPicker } from '../components/MemberPicker';

const ROLES: GroupRole[] = ['watch', 'message', 'actions', 'admin'];

export function GroupMembersPage() {
  const { t } = useTranslation('messages');
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: members, isLoading } = useGroupMembers(groupId);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<{ userId: string; isSelf: boolean } | null>(null);
  const [rolesHelpOpen, setRolesHelpOpen] = useState(false);

  const isAdmin = members?.some((m) => m.user_id === user?.id && m.role === 'admin') ?? false;

  function toggleInvite(userId: string) {
    setInviteIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function handleInvite() {
    if (!groupId || inviteIds.length === 0) return;
    addMember.mutate({ groupId, memberIds: inviteIds }, {
      onSuccess: () => {
        setInviteIds([]);
        setInviteOpen(false);
      },
    });
  }

  function handleRemoveConfirmed() {
    if (!groupId || !confirmTarget) return;
    removeMember.mutate({ groupId, userId: confirmTarget.userId }, {
      onSuccess: () => {
        if (confirmTarget.isSelf) navigate('/chat');
        setConfirmTarget(null);
      },
    });
  }

  if (isLoading) return <FullPageLoader />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center gap-3">
        <Link to={`/chat/${groupId}/settings`} aria-label={t('chat.group_settings')}>
          <ArrowLeft className="h-5 w-5 text-fg" />
        </Link>
        <h1 className="flex-1 text-xl font-bold text-fg">{t('chat.members')}</h1>
        <button
          type="button"
          onClick={() => setRolesHelpOpen((v) => !v)}
          aria-expanded={rolesHelpOpen}
          aria-label={t('chat.roles_help_title')}
          className="text-fg/60 hover:text-fg"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          aria-label={t('chat.invite_members')}
          className="text-orange"
        >
          <UserPlus className="h-5 w-5" />
        </button>
      </header>

      {rolesHelpOpen && (
        <div className="flex flex-col gap-2 rounded-lg border border-gray/20 bg-gray/5 p-3 text-sm">
          <p className="font-medium text-fg">{t('chat.roles_help_title')}</p>
          {ROLES.map((role) => (
            <p key={role}>
              <span className="font-medium text-fg">{t(`chat.role_${role}`)}</span>
              {' · '}
              <span className="text-gray">{t(`chat.role_${role}_desc`)}</span>
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {members?.map((member) => {
          const isSelf = member.user_id === user?.id;
          return (
            <div key={member.user_id} className="flex items-center gap-3 rounded-lg border border-gray/20 p-3">
              <Avatar mongoId={member.profile_picture_mongo_id} firstName={member.first_name} lastName={member.last_name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg">
                  {member.first_name} {member.last_name} {isSelf && `(${t('chat.you')})`}
                </p>
                {isAdmin && !isSelf ? (
                  <select
                    value={member.role}
                    onChange={(e) => groupId && updateRole.mutate({ groupId, userId: member.user_id, role: e.target.value as GroupRole })}
                    className="mt-0.5 rounded-md border border-gray bg-surface px-2 py-1 text-xs font-medium text-fg outline-none focus:border-navy"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{t(`chat.role_${role}`)}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray">{t(`chat.role_${member.role}`)}</p>
                )}
              </div>
              {(isSelf || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setConfirmTarget({ userId: member.user_id, isSelf })}
                  className="text-xs text-error hover:underline"
                >
                  {isSelf ? t('chat.leave_group') : t('chat.remove_member')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('chat.invite_members')}>
        <div className="flex flex-col gap-4">
          <MemberPicker
            selectedIds={inviteIds}
            onToggle={toggleInvite}
            excludeIds={[user?.id, ...(members?.map((m) => m.user_id) ?? [])].filter((id): id is string => Boolean(id))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>{t('chat.cancel')}</Button>
            <Button type="button" onClick={handleInvite} disabled={inviteIds.length === 0 || addMember.isPending}>
              {addMember.isPending ? '…' : t('chat.add_members')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.isSelf ? t('chat.leave_group') : t('chat.remove_member')}
        message={confirmTarget?.isSelf ? t('chat.confirm_leave_group') : t('chat.confirm_remove_member')}
        destructive
        loading={removeMember.isPending}
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
