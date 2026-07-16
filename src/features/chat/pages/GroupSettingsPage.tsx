import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Bell, BellOff } from 'lucide-react';
import { FullPageLoader } from '@/components/FullPageLoader';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { getGroupDisplayName } from '../utils';
import {
  useChatGroup,
  useUpdateGroup,
  useDeleteGroup,
  useGroupMembers,
  useMuteGroup,
  useUnmuteGroup,
} from '../hooks/useChatGroups';

const MUTE_DURATIONS: { key: string; minutes?: number }[] = [
  { key: 'mute_1h', minutes: 60 },
  { key: 'mute_8h', minutes: 8 * 60 },
  { key: 'mute_1d', minutes: 24 * 60 },
  { key: 'mute_1w', minutes: 7 * 24 * 60 },
  { key: 'mute_forever', minutes: undefined },
];

export function GroupSettingsPage() {
  const { t } = useTranslation('messages');
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: group, isLoading } = useChatGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const muteGroup = useMuteGroup();
  const unmuteGroup = useUnmuteGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muteDuration, setMuteDuration] = useState(MUTE_DURATIONS[2].key); // 1 jour par défaut
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name ?? '');
      setDescription(group.description ?? '');
    }
  }, [group]);

  const isDirectMessage = group?.type === 'direct_message';
  const isAdmin = members?.some((m) => m.user_id === user?.id && m.role === 'admin') ?? false;
  const myRole = group?.my_role ?? members?.find((m) => m.user_id === user?.id)?.role;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId || !name.trim()) return;
    updateGroup.mutate({ groupId, payload: { name: name.trim(), description: description.trim() } });
  }

  function handleDelete() {
    if (!groupId) return;
    deleteGroup.mutate(groupId, { onSuccess: () => navigate('/chat') });
  }

  function handleToggleMute() {
    if (!groupId) return;
    if (group?.is_muted) {
      unmuteGroup.mutate(groupId);
      return;
    }
    const durationMinutes = MUTE_DURATIONS.find((d) => d.key === muteDuration)?.minutes;
    muteGroup.mutate({ groupId, durationMinutes });
  }

  if (isLoading) return <FullPageLoader />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Link to={`/chat/${groupId}`} aria-label={t('chat.title')}>
          <ArrowLeft className="h-5 w-5 text-navy" />
        </Link>
        <h1 className="text-xl font-bold text-navy">
          {isDirectMessage && group ? getGroupDisplayName(group, t) : t('chat.group_settings')}
        </h1>
      </header>

      {myRole && !isDirectMessage && (
        <p className="text-sm text-gray">
          {t('chat.your_role')}: <span className="font-medium text-navy">{t(`chat.role_${myRole}`)}</span>
        </p>
      )}

      {!isDirectMessage && (
        <Link
          to={`/chat/${groupId}/members`}
          className="flex items-center gap-2 rounded-lg border border-gray/20 p-3 text-sm font-medium text-navy hover:border-orange/40"
        >
          <Users className="h-4 w-4" /> {t('chat.members')}
          {members && <span className="text-gray">({members.length})</span>}
        </Link>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-gray/20 p-3">
        {!group?.is_muted && (
          <label className="flex items-center justify-between gap-2 text-sm text-navy">
            {t('chat.mute_duration_label')}
            <select
              value={muteDuration}
              onChange={(e) => setMuteDuration(e.target.value)}
              className="rounded-md border border-gray bg-white px-2 py-1 text-xs font-medium text-navy outline-none focus:border-navy"
            >
              {MUTE_DURATIONS.map((d) => (
                <option key={d.key} value={d.key}>{t(`chat.${d.key}`)}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={handleToggleMute}
          disabled={muteGroup.isPending || unmuteGroup.isPending}
          className="flex items-center gap-2 text-sm font-medium text-navy hover:text-orange"
        >
          {group?.is_muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {group?.is_muted ? t('chat.unmute') : t('chat.mute')}
        </button>
      </div>

      {!isDirectMessage && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <TextField
            label={t('chat.group_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin}
            maxLength={100}
          />
          <TextField
            label={t('chat.group_description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isAdmin}
            maxLength={280}
          />
          {isAdmin && (
            <Button type="submit" disabled={!name.trim() || updateGroup.isPending} className="self-start">
              {updateGroup.isPending ? '…' : t('chat.save_changes')}
            </Button>
          )}
        </form>
      )}

      {!isDirectMessage && isAdmin && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setConfirmDeleteOpen(true)}
          className="self-start !bg-error text-white hover:opacity-90"
        >
          {t('chat.delete_group')}
        </Button>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('chat.delete_group')}
        message={t('chat.confirm_delete_group')}
        destructive
        loading={deleteGroup.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
