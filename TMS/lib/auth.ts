import { AuthSession, UserRole } from '../types';

export const SESSION_KEY = 'tms_unified_session_v1';

export interface DemoUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
  designation: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'USR-PROD-WRK',
    username: 'worker@transports',
    password: '',
    name: 'Operational Worker',
    email: 'worker@transports',
    role: 'WORKER',
    employeeId: 'WRK-0001',
    designation: 'Operations Specialist',
  },
  {
    id: 'USR-PROD-ACC',
    username: 'accounts@transports',
    password: '',
    name: 'Finance & Accounts',
    email: 'accounts@transports',
    role: 'ACCOUNTS',
    employeeId: 'ACC-0001',
    designation: 'Finance Officer',
  },
  {
    id: 'USR-PROD-MGR',
    username: 'manager@transports',
    password: '',
    name: 'Operations Manager',
    email: 'manager@transports',
    role: 'MANAGER',
    employeeId: 'MGR-0001',
    designation: 'Operations Manager',
  },
  {
    id: 'USR-PROD-MD',
    username: 'md@transports',
    password: '',
    name: 'Managing Director',
    email: 'md@transports',
    role: 'MD',
    employeeId: 'EXEC-0001',
    designation: 'Managing Director',
  },
  {
    id: 'USR-PROD-ADM',
    username: 'admin@transports',
    password: '',
    name: 'System Administrator',
    email: 'admin@transports',
    role: 'ADMIN',
    employeeId: 'ADM-0001',
    designation: 'System Administrator',
  },
];

export function getPortalUrl(role: UserRole | string): string {
  const cleanRole = (role || '').toUpperCase().replace(/^ROLE_/, '');
  switch (cleanRole) {
    case 'WORKER':
      return '/worker/dashboard';
    case 'ACCOUNTS':
      return '/accounts/dashboard';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'MD':
      return '/md/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/worker/dashboard';
  }
}

export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(user: DemoUser | AuthSession): void {
  if (typeof window === 'undefined') return;
  const session: AuthSession = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('tms:auth'));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('tms_jwt_token');
  window.dispatchEvent(new Event('tms:auth'));
}

export const REGISTERED_USERS_KEY = 'tms_registered_users';

export function getStoredUsers(): DemoUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerApplicationUser(user: DemoUser): void {
  if (typeof window === 'undefined') return;
  const current = getStoredUsers();
  const existingIdx = current.findIndex(
    (u) => u.username.toLowerCase() === user.username.toLowerCase() || u.id === user.id
  );
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...user };
  } else {
    current.push(user);
  }
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('tms:users-updated'));
}

export function removeStoredUser(userIdOrUsername: string): void {
  if (typeof window === 'undefined') return;
  const current = getStoredUsers();
  const updated = current.filter(
    (u) =>
      u.id !== userIdOrUsername &&
      u.username.toLowerCase() !== userIdOrUsername.toLowerCase() &&
      u.email.toLowerCase() !== userIdOrUsername.toLowerCase()
  );
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('tms:users-updated'));
}

export function updateStoredUserPassword(usernameOrId: string, newPassword: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getStoredUsers();
  const user = current.find(
    (u) => u.username.toLowerCase() === usernameOrId.toLowerCase() || u.id === usernameOrId
  );
  if (user) {
    user.password = newPassword;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('tms:users-updated'));
    return true;
  }
  return false;
}

export function getAllApplicationUsers(): DemoUser[] {
  return [...getStoredUsers()];
}

export function authenticate(_identifier: string, _password: string): DemoUser | null {
  // Local bypass removed for production security. All logins must authenticate against backend.
  return null;
}

export async function authenticateAsync(identifier: string, password: string): Promise<DemoUser | null> {
  const norm = identifier.trim();
  const { apiClient, setAuthToken } = await import('./api');
  const res = await apiClient.auth.login(norm, password);
  if (res && res.token) {
    setAuthToken(res.token);
    const roleName = (res.role || 'WORKER').toUpperCase().replace(/^ROLE_/, '');
    const user: DemoUser = {
      id: res.userId || res.employeeId || 'USR-' + res.username,
      username: res.username,
      password: '',
      name: res.fullName || res.username,
      email: res.email || `${res.username}@transflow.internal`,
      role: roleName as UserRole,
      employeeId: res.employeeId || 'EMP-' + res.username,
      designation: roleName + ' Specialist',
    };
    setSession(user);
    return user;
  }
  return null;
}

export function isRolePermitted(userRole: UserRole | string, targetPortal: 'worker' | 'accounts' | 'manager' | 'md' | 'admin'): boolean {
  if (!userRole) return false;
  const cleanRole = (userRole || '').toUpperCase().replace(/^ROLE_/, '');
  if (cleanRole === 'ADMIN') return true;
  if (cleanRole === 'MD') return true;
  if (cleanRole === 'MANAGER') {
    return targetPortal === 'manager' || targetPortal === 'worker';
  }
  if (cleanRole === 'ACCOUNTS') {
    return targetPortal === 'accounts';
  }
  if (cleanRole === 'WORKER') {
    return targetPortal === 'worker';
  }
  return false;
}

