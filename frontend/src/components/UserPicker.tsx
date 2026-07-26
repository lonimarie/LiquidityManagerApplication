import { DEMO_USERS } from '../lib/users';

interface Props {
  userId: string;
  onChange: (userId: string) => void;
}

export default function UserPicker({ userId, onChange }: Props) {
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <label
        htmlFor="user-picker"
        className="text-xs font-medium text-[var(--text-secondary)]"
      >
        Demo user — no authentication
      </label>
      <select
        id="user-picker"
        value={userId}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-[var(--grid-line)] bg-[var(--surface-1)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
      >
        {DEMO_USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.label}
          </option>
        ))}
      </select>
    </div>
  );
}
