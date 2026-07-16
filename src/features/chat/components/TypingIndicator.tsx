import { useTranslation } from 'react-i18next';

interface TypingIndicatorProps {
  userIds: string[];
}

// v1 : pas de résolution nom/avatar pour les typeurs (les membres de groupe
// n'exposent qu'un user_id, pas un nom) — message générique selon le nombre.
export function TypingIndicator({ userIds }: TypingIndicatorProps) {
  const { t } = useTranslation('messages');

  if (userIds.length === 0) return null;

  return (
    <p className="px-4 py-1 text-xs italic text-gray">
      {userIds.length === 1 ? t('chat.typing_one') : t('chat.typing_other')}
    </p>
  );
}
