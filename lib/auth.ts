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

export function getPortalUrl(role: UserRole): string {
  switch (role) {
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
      return '/login';
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
  window.dispatchEvent(new Event('tms:auth'));
}

export function authenticate(identifier: string, password: string): DemoUser | null {
  const norm = identifier.trim().toLowerCase();
  const match = DEMO_USERS.find(
    (u) =>
      (u.username.toLowerCase() === norm ||
        u.email.toLowerCase() === norm ||
        u.employeeId.toLowerCase() === norm) &&
      u.password === password
  );
  return match || null;
}

export function isRolePermitted(userRole: UserRole, targetPortal: 'worker' | 'accounts' | 'manager' | 'md' | 'admin'): boolean {
  // Strict role boundaries as per requirement
  if (userRole === 'ADMIN') return true; // Admin can access configuration & audit
  if (userRole === 'MD') return true; // MD can inspect all views
  if (userRole === 'MANAGER') {
    return targetPortal === 'manager' || targetPortal === 'worker';
  }
  if (userRole === 'ACCOUNTS') {
    return targetPortal === 'accounts';
  }
  if (userRole === 'WORKER') {
    return targetPortal === 'worker';
  }
  return false;
}
