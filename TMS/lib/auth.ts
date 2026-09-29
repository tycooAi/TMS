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
    id: 'USR-001',
    username: 'worker',
    password: 'password123',
    name: 'Arun Kumar',
    email: 'arun@transflow.internal',
    role: 'WORKER',
    employeeId: 'WRK-0024',
    designation: 'Data Entry Operator',
  },
  {
    id: 'USR-002',
    username: 'accounts',
    password: 'password123',
    name: 'Anitha S',
    email: 'anitha@transflow.internal',
    role: 'ACCOUNTS',
    employeeId: 'ACC-0018',
    designation: 'Accounts Executive',
  },
  {
    id: 'USR-003',
    username: 'manager',
    password: 'password123',
    name: 'Rajesh V',
    email: 'rajesh@transflow.internal',
    role: 'MANAGER',
    employeeId: 'MGR-0005',
    designation: 'Operations Manager',
  },
  {
    id: 'USR-004',
    username: 'md',
    password: 'password123',
    name: 'Vikramaditya Rao',
    email: 'md@transflow.internal',
    role: 'MD',
    employeeId: 'EXEC-0001',
    designation: 'Managing Director',
  },
  {
    id: 'USR-005',
    username: 'admin',
    password: 'password123',
    name: 'Karthik Raja',
    email: 'admin@transflow.internal',
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
  return [...DEMO_USERS, ...getStoredUsers()];
}

export function authenticate(identifier: string, password: string): DemoUser | null {
  const norm = identifier.trim().toLowerCase();
  const allUsers = getAllApplicationUsers();
  const match = allUsers.find(
    (u) =>
      (u.username.toLowerCase() === norm ||
        u.email.toLowerCase() === norm ||
        u.employeeId.toLowerCase() === norm) &&
      u.password === password
  );
  return match || null;
}

export async function authenticateAsync(identifier: string, password: string): Promise<DemoUser | null> {
  const norm = identifier.trim();
  try {
    const { apiClient, setAuthToken } = await import('./api');
    const res = await apiClient.auth.login(norm, password);
    if (res && res.token) {
      setAuthToken(res.token);
      let roleName = (res.role || 'WORKER').toUpperCase().replace(/^ROLE_/, '');
      return {
        id: res.userId || res.employeeId || 'USR-' + res.username,
        username: res.username,
        password: '',
        name: res.fullName || res.username,
        email: res.email || `${res.username}@transflow.internal`,
        role: roleName as UserRole,
        employeeId: res.employeeId || 'EMP-' + res.username,
        designation: roleName + ' Specialist',
      };
    }
  } catch (err) {
    console.warn('Backend login attempt fell back to demo/registered users:', err);
  }

  // Fallback to local demo & stored registered users
  return authenticate(identifier, password);
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

