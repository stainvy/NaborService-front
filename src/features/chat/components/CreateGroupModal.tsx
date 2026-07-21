import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCreateGroup } from '../hooks/useChatGroups';
import { MemberPicker } from './MemberPicker';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const { t } = useTranslation('messages');
  const { user } = useAuth();
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);

  function toggleMember(userId: string) {
    setMemberIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function reset() {
    setName('');
    setDescription('');
    setMemberIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const group = await createGroup.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      memberIds,
    });
    reset();
    onClose();
    navigate(`/chat/${group.id}`);
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t('chat.create_group')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label={t('chat.group_name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
        <TextField
          label={t('chat.group_description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
        />
        <div>
          <p className="mb-1 text-sm font-medium text-fg">{t('chat.add_members')}</p>
          <MemberPicker selectedIds={memberIds} onToggle={toggleMember} excludeIds={user ? [user.id] : []} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>
            {t('chat.cancel')}
          </Button>
          <Button type="submit" disabled={!name.trim() || createGroup.isPending}>
            {createGroup.isPending ? '…' : t('chat.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
