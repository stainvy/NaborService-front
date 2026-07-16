import type { TFunction } from 'i18next';
import type { ChatGroup } from '@/types/chat';

/**
 * Nom affiché pour un groupe. Pour une conversation directe (DM), utilise le
 * nom du participant distant (`other_participant`, résolu côté back) plutôt
 * que `group.name`, qui n'est pas toujours assigné pour les DMs.
 */
export function getGroupDisplayName(group: ChatGroup, t: TFunction): string {
  if (group.type === 'direct_message' && group.other_participant) {
    const { first_name, last_name } = group.other_participant;
    return `${first_name} ${last_name}`.trim();
  }
  return group.name ?? t('chat.unnamed_group');
}

/** Props à passer à <Avatar> : photo du participant pour un DM, initiales du nom de groupe sinon. */
export function getGroupAvatarProps(group: ChatGroup): { mongoId?: string | null; firstName?: string | null; lastName?: string | null } {
  if (group.type === 'direct_message' && group.other_participant) {
    return {
      mongoId: group.other_participant.profile_picture_mongo_id,
      firstName: group.other_participant.first_name,
      lastName: group.other_participant.last_name,
    };
  }
  return { firstName: group.name };
}
