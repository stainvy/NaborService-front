import { hasMinRole, type Role } from '@/types/roles';
import type { Poll } from '@/types/polls';

/** Miroir de la garde backend `@Roles('neighbourhood_rep', 'moderator', 'admin')` sur POST /polls. */
export function canCreatePoll(role: Role | undefined | null): boolean {
  return hasMinRole(role, 'neighbourhood_rep');
}

export type PollStatus = 'scheduled' | 'active' | 'ended' | 'closed';

export function getPollStatus(poll: Poll, now: Date = new Date()): PollStatus {
  if (poll.closedAt) return 'closed';
  if (poll.endsAt && new Date(poll.endsAt) < now) return 'ended';
  if (poll.startsAt && new Date(poll.startsAt) > now) return 'scheduled';
  return 'active';
}

export function canManagePoll(poll: Poll, userId: string | undefined, role: Role | undefined | null): boolean {
  if (!userId) return false;
  return poll.creatorId === userId || hasMinRole(role, 'moderator');
}
