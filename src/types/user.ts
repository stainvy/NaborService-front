import type { Role } from './roles';

export interface User {
  id: string; // UUID v7
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  locale?: string;
  avatar_media_id?: string;
}
