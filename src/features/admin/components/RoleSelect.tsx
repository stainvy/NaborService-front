import { ROLES, type Role } from '@/types/roles';

interface RoleSelectProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

export function RoleSelect({ value, onChange, disabled }: RoleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Role)}
      disabled={disabled}
      className="rounded border border-admin-border px-2 py-1 text-sm text-admin-text outline-none focus:border-admin-accent disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
