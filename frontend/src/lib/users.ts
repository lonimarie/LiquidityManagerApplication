/**
 * Seeded demo users. This is NOT authenticated
 */
export interface DemoUser {
  id: string;
  label: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'demo-user', label: 'Demo User' },
  { id: 'loni', label: 'Loni' },
  { id: 'alex', label: 'Alex' },
];

export const DEFAULT_USER_ID = 'demo-user';

const STORAGE_KEY = 'liquidity-manager.userId';

export function loadUserId(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  return DEMO_USERS.some((user) => user.id === stored) ? (stored as string) : DEFAULT_USER_ID;
}

export function saveUserId(userId: string): void {
  localStorage.setItem(STORAGE_KEY, userId);
}
