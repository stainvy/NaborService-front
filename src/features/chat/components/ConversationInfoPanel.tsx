import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Download, Eye, FileText, Shield, UserPlus, Users } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';
import { MediaViewer, type ViewableFile } from '@/components/MediaViewer';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { mediaUrl } from '@/lib/media';
import { useBlock, useBlocks, useUnblock } from '@/features/social/hooks/useBlock';
import type { ChatGroup, ChatGroupMember, GroupRole } from '@/types/chat';
import {
  useAddMember,
  useMuteGroup,
  useRemoveMember,
  useUnmuteGroup,
  useUpdateMemberRole,
} from '../hooks/useChatGroups';
import { useGroupAttachments } from '../hooks/useGroupAttachments';
import { MemberPicker } from './MemberPicker';
import { getGroupAvatarProps, getGroupDisplayName } from '../utils';

const ROLES: GroupRole[] = ['watch', 'message', 'actions', 'admin'];
const MEMBERS_PREVIEW_COUNT = 5;

interface ConversationInfoPanelProps {
  group: ChatGroup;
  members?: ChatGroupMember[];
  myRole?: GroupRole | null;
  /** Fait défiler le fil jusqu'au message d'origine d'un fichier partagé. */
  onJumpToMessage?: (messageId: string) => void;
}

// Panneau droit du Messagerie : réglages + membres + rôles pour un groupe,
// ou profil + fichiers partagés + blocage pour une conversation privée
// (mockup Messagerie.dc.html — panneaux "GROUP PANEL" / "MP PANEL").
export function ConversationInfoPanel({ group, members, myRole, onJumpToMessage }: ConversationInfoPanelProps) {
  const { t } = useTranslation('messages');
  const isGroup = group.type !== 'direct_message';
  const isAdmin = myRole === 'admin';

  const muteGroup = useMuteGroup();
  const unmuteGroup = useUnmuteGroup();

  function handleToggleMute() {
    if (group.is_muted) unmuteGroup.mutate(group.id);
    else muteGroup.mutate({ groupId: group.id });
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-gray/20 bg-surface">
      <div className="flex flex-col items-center gap-2 border-b border-gray/10 p-6 text-center">
        <Avatar {...getGroupAvatarProps(group)} size={76} />
        <h2 className="text-lg font-bold text-fg">{getGroupDisplayName(group, t)}</h2>
        {isGroup && group.member_count != null && (
          <p className="text-xs text-gray">{t('chat.member_count', { count: group.member_count })}</p>
        )}
      </div>

      <div className="flex justify-center gap-6 border-b border-gray/10 py-4">
        <button type="button" onClick={handleToggleMute} className="flex flex-col items-center gap-1.5 text-gray hover:text-fg">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${group.is_muted ? 'bg-orange/10 text-orange' : 'bg-gray/10'}`}>
            {group.is_muted ? <BellOff className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
          </span>
          <span className="text-[11px]">{group.is_muted ? t('chat.unmute') : t('chat.mute')}</span>
        </button>
        {isGroup ? (
          <InviteQuickAction groupId={group.id} existingMemberIds={members?.map((m) => m.user_id) ?? []} />
        ) : (
          group.other_participant && (
            <Link to={`/users/${group.other_participant.id}`} className="flex flex-col items-center gap-1.5 text-gray hover:text-fg">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray/10">
                <Users className="h-4.5 w-4.5" />
              </span>
              <span className="text-[11px]">{t('chat.view_profile')}</span>
            </Link>
          )
        )}
      </div>

      {isGroup ? (
        <GroupPanelBody group={group} members={members} isAdmin={isAdmin} onJumpToMessage={onJumpToMessage} />
      ) : (
        <DmPanelBody group={group} onJumpToMessage={onJumpToMessage} />
      )}
    </aside>
  );
}

function InviteQuickAction({ groupId, existingMemberIds }: { groupId: string; existingMemberIds: string[] }) {
  const { t } = useTranslation('messages');
  const { user } = useAuth();
  const addMember = useAddMember();
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  function toggle(userId: string) {
    setIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function handleInvite() {
    if (ids.length === 0) return;
    addMember.mutate({ groupId, memberIds: ids }, { onSuccess: () => { setIds([]); setOpen(false); } });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-1.5 text-gray hover:text-fg">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray/10">
          <UserPlus className="h-4.5 w-4.5" />
        </span>
        <span className="text-[11px]">{t('chat.invite_members')}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('chat.invite_members')}>
        <div className="flex flex-col gap-4">
          <MemberPicker
            selectedIds={ids}
            onToggle={toggle}
            excludeIds={[user?.id, ...existingMemberIds].filter((id): id is string => Boolean(id))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('chat.cancel')}</Button>
            <Button type="button" onClick={handleInvite} disabled={ids.length === 0 || addMember.isPending}>
              {addMember.isPending ? '…' : t('chat.add_members')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function GroupPanelBody({
  group,
  members,
  isAdmin,
  onJumpToMessage,
}: {
  group: ChatGroup;
  members?: ChatGroupMember[];
  isAdmin: boolean;
  onJumpToMessage?: (messageId: string) => void;
}) {
  const { t } = useTranslation('messages');
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const preview = (members ?? []).slice(0, MEMBERS_PREVIEW_COUNT);

  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-gray/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray">{t('chat.group_description')}</span>
          <Link to={`/chat/${group.id}/settings`} className="text-xs font-semibold text-orange hover:underline">
            {t('chat.edit')}
          </Link>
        </div>
        <p className="text-sm text-gray">{group.description || t('chat.no_description')}</p>
      </div>

      <div className="border-b border-gray/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray">
            {t('chat.members')} {members ? `· ${members.length}` : ''}
          </span>
          <Link to={`/chat/${group.id}/members`} className="text-xs font-semibold text-orange hover:underline">
            {t('chat.manage')}
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {preview.map((member) => (
            <div key={member.user_id} className="flex items-center gap-2.5">
              <Avatar mongoId={member.profile_picture_mongo_id} firstName={member.first_name} lastName={member.last_name} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                {member.first_name} {member.last_name}
              </span>
              {isAdmin ? (
                <select
                  value={member.role}
                  onChange={(e) => updateRole.mutate({ groupId: group.id, userId: member.user_id, role: e.target.value as GroupRole })}
                  className="rounded-md border border-gray bg-surface px-2 py-1 text-xs font-medium text-fg outline-none focus:border-navy"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{t(`chat.role_${role}`)}</option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full bg-gray/10 px-2 py-0.5 text-[10px] font-bold text-gray">
                  {t(`chat.role_${member.role}`)}
                </span>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => removeMember.mutate({ groupId: group.id, userId: member.user_id })}
                  aria-label={t('chat.remove_member')}
                  className="text-xs text-error hover:underline"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {members && members.length > MEMBERS_PREVIEW_COUNT && (
          <Link
            to={`/chat/${group.id}/members`}
            className="mt-3 block rounded-lg border border-gray/20 py-2 text-center text-xs font-semibold text-fg hover:bg-gray/5"
          >
            {t('chat.view_all_members', { count: members.length })}
          </Link>
        )}
      </div>

      <SharedFilesSection groupId={group.id} onJumpToMessage={onJumpToMessage} />

      <div className="p-4">
        <span className="mb-3 block text-[11px] font-bold uppercase tracking-wide text-gray">{t('chat.roles_help_title')}</span>
        <div className="flex flex-col gap-2.5">
          {ROLES.map((role) => (
            <div key={role} className="flex items-start gap-2.5">
              <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray" />
              <div>
                <p className="text-sm font-semibold text-fg">{t(`chat.role_${role}`)}</p>
                <p className="text-xs text-gray">{t(`chat.role_${role}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DmPanelBody({
  group,
  onJumpToMessage,
}: {
  group: ChatGroup;
  onJumpToMessage?: (messageId: string) => void;
}) {
  const { t } = useTranslation('messages');
  const otherId = group.other_participant?.id;
  const { data: blocks } = useBlocks();
  const block = useBlock();
  const unblock = useUnblock();
  const isBlocked = Boolean(otherId && blocks?.data.some((u) => u.id === otherId));

  function handleToggleBlock() {
    if (!otherId) return;
    if (isBlocked) unblock.mutate(otherId);
    else block.mutate(otherId);
  }

  return (
    <>
      <SharedFilesSection groupId={group.id} onJumpToMessage={onJumpToMessage} />

      {otherId && (
        <div className="p-4">
          <button
            type="button"
            onClick={handleToggleBlock}
            disabled={block.isPending || unblock.isPending}
            className="w-full rounded-lg border border-error/30 py-2.5 text-sm font-semibold text-error hover:bg-error/5"
          >
            {isBlocked ? t('chat.unblock_contact') : t('chat.block_contact')}
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Fichiers partagés du groupe — commun aux panneaux groupe et DM. Alimenté par
 * un endpoint dédié (useGroupAttachments), pas par les messages déjà chargés
 * dans le fil : l'ancienne dérivation ne listait que les pièces jointes des
 * messages présents au DOM, donc rien tant qu'on n'avait pas scrollé jusqu'à eux.
 */
function SharedFilesSection({
  groupId,
  onJumpToMessage,
}: {
  groupId: string;
  onJumpToMessage?: (messageId: string) => void;
}) {
  const { t } = useTranslation('messages');
  const { data: sharedFiles } = useGroupAttachments(groupId);
  const [viewFile, setViewFile] = useState<ViewableFile | null>(null);

  return (
    <div className="border-b border-gray/10 p-4">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray">{t('chat.shared_files')}</span>
      {!sharedFiles || sharedFiles.length === 0 ? (
        <p className="text-xs text-gray">{t('chat.no_shared_files')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sharedFiles.slice(0, 8).map((file) => {
            const url = mediaUrl(file.media_id);
            return (
              <div key={file.media_id} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onJumpToMessage?.(file.message_id)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange hover:bg-orange/20"
                  aria-label={t('chat.jump_to_message')}
                  title={t('chat.jump_to_message')}
                >
                  <FileText className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToMessage?.(file.message_id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium text-fg hover:underline">{file.filename}</p>
                  <p className="text-xs text-gray">{Math.round(file.size_bytes / 1024)} Ko</p>
                </button>
                <button
                  type="button"
                  onClick={() => setViewFile({ media_id: file.media_id, filename: file.filename, mimetype: file.mimetype })}
                  className="flex-shrink-0 rounded-full p-1.5 text-gray hover:bg-gray/10 hover:text-fg"
                  aria-label={t('chat.view_file')}
                  title={t('chat.view_file')}
                >
                  <Eye className="h-4 w-4" />
                </button>
                {url && (
                  <a
                    href={url}
                    download={file.filename}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 rounded-full p-1.5 text-gray hover:bg-gray/10 hover:text-fg"
                    aria-label={t('chat.download')}
                    title={t('chat.download')}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
      <MediaViewer file={viewFile} onClose={() => setViewFile(null)} />
    </div>
  );
}
