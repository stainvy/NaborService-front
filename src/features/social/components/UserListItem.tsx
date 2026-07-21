import { Link } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import type { SocialUserSummary } from '../types';

// Élément de liste cliquable vers le profil public.
export function UserListItem({ user }: { user: SocialUserSummary }) {
  return (
    <Link
      to={`/users/${user.id}`}
      className="flex items-center gap-3 rounded-md border border-gray/30 p-3 hover:bg-gray/5"
    >
      <Avatar
        mongoId={user.profilePictureMongoId}
        firstName={user.firstName}
        lastName={user.lastName}
        size={40}
      />
      <span className="font-medium text-fg">
        {user.firstName} {user.lastName}
      </span>
    </Link>
  );
}
