'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AuthSession,
  UserRole,
} from '../../types';
import {
  clearSession,
  DEMO_USERS,
  getCurrentSession,
  getPortalUrl,
  isRolePermitted,
  setSession,
} from '../../lib/auth';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardList,
  Database,
  DollarSign,
  Factory,
  FileText,
  Fuel,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Truck,
  Upload,
  UserRound,
  Users,
  Wrench,
} from '../ui/Icons';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

interface AppShellProps {
  portal?: 'worker' | 'accounts' | 'manager' | 'md' | 'admin';
  portalName?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function AppShell({ portal = 'admin', portalName = 'Portal', children, headerActions }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setLocalSession] = useState<AuthSession | null>(() => {
    if (typeof window !== 'undefined') {
      const s = getCurrentSession();
      if (s) return s;
      return DEMO_USERS.find((u) => u.role.toLowerCase() === portal) || DEMO_USERS[0];
    }
    return null;
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Retrieve authenticated accountant details dynamically for Accounts Portal
  const accountantFallback = portal === 'accounts' ? DEMO_USERS.find((u) => u.role === 'ACCOUNTS') : null;
  const currentAccountant = portal === 'accounts'
    ? (session?.role === 'ACCOUNTS' ? session : getCurrentSession()?.role === 'ACCOUNTS' ? getCurrentSession() : accountantFallback)
    : session;
  const displayName = portal === 'accounts' ? (currentAccountant?.name || session?.name || 'Accountant') : (session?.name || 'User');
  const displayRole = portal === 'accounts' ? (currentAccountant?.role || session?.role || 'ACCOUNTS') : (session?.role || portal.toUpperCase());
  const displayEmail = portal === 'accounts' ? (currentAccountant?.email || session?.email) : session?.email;
  const displayEmployeeId = portal === 'accounts' ? (currentAccountant?.employeeId || session?.employeeId) : session?.employeeId;

  // Sync session
  useEffect(() => {
    const s = getCurrentSession();
    if (!s) {
      // Default to demo user for this portal if unauthenticated in prototype
      const defaultUser =
        DEMO_USERS.find((u) => u.role.toLowerCase() === portal) || DEMO_USERS[0];
      setSession(defaultUser);
      setLocalSession(defaultUser);
    } else {
      setLocalSession(s);
    }

    const onAuth = () => setLocalSession(getCurrentSession());
    window.addEventListener('tms:auth', onAuth);
    return () => window.removeEventListener('tms:auth', onAuth);
  }, [portal]);

  // Close profile on click outside
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Define nav items per portal
  const portalNavs: Record<'worker' | 'accounts' | 'manager' | 'md' | 'admin', NavItem[]> = {
    worker: [
      { label: 'Dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
      { label: 'New Trip', href: '/worker/trips/new', icon: Plus },
      { label: 'My Trips', href: '/worker/trips', icon: ClipboardList },
    ],
    accounts: [
      { label: 'Dashboard', href: '/accounts/dashboard', icon: LayoutDashboard },
      { label: 'Customers', href: '/accounts/customers', icon: Building2 },
      { label: 'Invoices', href: '/accounts/invoices', icon: FileText },
      { label: 'Workers & Wages', href: '/accounts/workers-wages', icon: Users },
      { label: 'Vehicle Expenses', href: '/accounts/vehicle-expenses', icon: Wrench },
      { label: 'Diesel Log', href: '/accounts/diesel', icon: Fuel },
      { label: 'Other Expenses', href: '/accounts/other-expenses', icon: DollarSign },
      { label: 'Cash & Bank', href: '/accounts/cash-bank', icon: DollarSign },
      { label: 'Central Ledger', href: '/accounts/transactions', icon: ClipboardList },
      { label: 'Reports', href: '/accounts/reports', icon: FileText },
    ],
    manager: [
      { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
      { label: 'Workers', href: '/manager/workers', icon: Users },
      { label: 'Customers', href: '/manager/customers', icon: Building2 },
      { label: 'Vehicles', href: '/manager/vehicles', icon: Truck },
      { label: 'Drivers', href: '/manager/drivers', icon: UserRound },
      { label: 'Materials', href: '/manager/materials', icon: Database },
      { label: 'Crushers / Sources', href: '/manager/crushers', icon: Factory },
      { label: 'Locations', href: '/manager/locations', icon: MapPin },
      { label: 'Rates Configuration', href: '/manager/rates', icon: ClipboardList },
    ],
    md: [
      { label: 'Executive Cockpit', href: '/md/dashboard', icon: LayoutDashboard },
      { label: 'Operations', href: '/md/operations', icon: Truck },
      { label: 'Customers', href: '/md/customers', icon: Building2 },
      { label: 'Vehicles Fleet', href: '/md/vehicles', icon: Wrench },
      { label: 'Workers & Payroll', href: '/md/workers', icon: Users },
      { label: 'Finance Overview', href: '/md/finance', icon: DollarSign },
      { label: 'Approvals Center', href: '/md/approvals', icon: Shield },
      { label: 'Executive Reports', href: '/md/reports', icon: FileText },
    ],
    admin: [
      { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'User Management', href: '/admin/users', icon: Users },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
      { label: 'Master Center', href: '/admin/masters', icon: Database },
      { label: 'Audit Trail', href: '/admin/audit', icon: ClipboardList },
      { label: 'Excel Import', href: '/admin/imports', icon: Upload },
      { label: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  };

  const navItems = portalNavs[portal] || portalNavs.admin || [];

  const handleRoleSwitch = (newRole: UserRole) => {
    const user = DEMO_USERS.find((u) => u.role === newRole);
    if (user) {
      setSession(user);
      router.push(getPortalUrl(newRole));
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  // Route Guard Check
  const permitted = session ? isRolePermitted(session.role, portal) : true;

  if (session && !permitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f7fa]">
        <div className="max-w-md w-full bg-white p-8 rounded-xl border border-[#D9DBD6] shadow-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-bold text-[#16425B]">Access Restricted</h2>
          <p className="text-xs text-[#5A6E7F] mt-2 leading-relaxed">
            Your current role (<strong>{session.role}</strong>) does not have authorization to view the{' '}
            <strong>{portalName}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => router.push(getPortalUrl(session.role))}
              className="w-full py-2 px-4 rounded-md text-xs font-semibold text-white bg-[#2F668F] hover:bg-[#255273] transition-colors"
            >
              Return to My Portal ({session.role})
            </button>
            <button
              onClick={() => {
                clearSession();
                router.push('/login');
              }}
              className="w-full py-2 px-4 rounded-md text-xs font-semibold text-[#5A6E7F] bg-[#f8faf5] border border-[#D9DBD6] hover:bg-[#edeee9]"
            >
              Sign In as Different User
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active breadcrumb label
  const activeNav = navItems.find(
    (item) => item.href === pathname || (item.href !== `/${portal}/dashboard` && pathname.startsWith(item.href))
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7fa] font-sans antialiased text-[#16425B]">
      {/* SIDEBAR */}
      <aside
        className={`w-64 bg-[#16425B] text-white flex flex-col flex-shrink-0 z-30 transition-all duration-200 border-r border-[#225470] ${
          isMobileNavOpen ? 'fixed inset-y-0 left-0' : 'hidden md:flex'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 bg-[#113550] border-b border-[#215473] flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg bg-[#2F668F] border border-[#81C4D7] text-white flex items-center justify-center shadow-sm">
            <Truck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <strong className="text-sm font-black tracking-wider text-white">TMS</strong>
              <span className="text-[10px] uppercase font-bold text-[#81C4D7] tracking-widest">
                TRANSLOGIX
              </span>
            </div>
            <p className="text-[10px] font-semibold text-[#81C4D7] tracking-wide uppercase">
              {portalName}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#81C4D7]/70">
            Navigation Core
          </p>
          <nav className="space-y-1">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                pathname === href || (href !== `/${portal}/dashboard` && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2F668F] text-white shadow-sm'
                      : 'text-[#c9d6e2] hover:bg-[#1f506e] hover:text-white'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#81C4D7]' : 'text-[#8da3b5]'} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Portal Switcher (Prototype feature for rapid testing) */}
        <div className="p-3 mx-3 mb-3 rounded-lg bg-[#113550]/80 border border-[#215473]">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#81C4D7] uppercase tracking-wider mb-2">
            <span>Prototype Switcher</span>
            <span className="text-white bg-[#2F668F] px-1.5 py-0.5 rounded text-[9px]">Demo</span>
          </div>
          <select
            value={session?.role || 'WORKER'}
            onChange={(e) => handleRoleSwitch(e.target.value as UserRole)}
            className="w-full text-xs font-semibold bg-[#16425B] text-white border border-[#265d7e] rounded p-1.5 focus:outline-none"
          >
            <option value="WORKER">Worker Portal</option>
            <option value="ACCOUNTS">Accounts Portal</option>
            <option value="MANAGER">Manager Portal</option>
            <option value="MD">MD Executive Portal</option>
            <option value="ADMIN">Admin Control Center</option>
          </select>
        </div>

        {/* User Badge */}
        <div className="p-3 bg-[#113550] border-t border-[#215473] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#35566f] border border-[#81C4D7] text-[#81C4D7] flex items-center justify-center font-bold text-xs">
            {session?.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'US'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{session?.name || 'User'}</p>
            <p className="text-[10px] text-[#81C4D7] font-medium truncate">
              {session?.employeeId} · {session?.role}
            </p>
          </div>
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="p-1 text-[#81C4D7] hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP STATUS BAR */}
        <header className="h-16 bg-white border-b border-[#D9DBD6] px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 text-[#5A6E7F] hover:bg-[#f4f7fa] rounded"
              aria-label="Toggle navigation"
            >
              <LayoutDashboard size={20} />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-[#5A6E7F]">
              <span className="font-semibold text-[#16425B]">{portalName}</span>
              <span className="mx-2 text-[#D9DBD6]">/</span>
              <span className="text-[#2F668F] font-bold">{activeNav?.label || 'Workspace'}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {headerActions}

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#f4f7fa] border border-transparent hover:border-[#D9DBD6] transition-all"
                aria-expanded={isProfileOpen}
              >
                <div className="w-7 h-7 rounded-full bg-[#2F668F] text-white flex items-center justify-center font-bold text-xs">
                  {displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#16425B] leading-tight">{displayName}</p>
                  <p className="text-[10px] text-[#5A6E7F] leading-tight">{displayRole}</p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-[#D9DBD6] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="pb-3 mb-3 border-b border-[#D9DBD6]">
                    <p className="text-xs font-bold text-[#16425B]">{displayName}</p>
                    <p className="text-[11px] text-[#5A6E7F]">{displayEmail}</p>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-[#5A6E7F]">Employee ID:</dt>
                      <dd className="font-semibold text-[#16425B]">{displayEmployeeId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#5A6E7F]">Assigned Role:</dt>
                      <dd className="font-semibold text-[#2F668F]">{displayRole}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#5A6E7F]">Status:</dt>
                      <dd className="text-emerald-700 font-semibold">Active</dd>
                    </div>
                  </dl>
                  <div className="mt-4 pt-3 border-t border-[#D9DBD6] space-y-1">
                    <button
                      onClick={() => setIsLogoutOpen(true)}
                      className="w-full text-left px-2 py-1.5 text-xs text-red-600 font-semibold rounded hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of the Transportation Management System?"
        confirmLabel="Sign Out"
        isDestructive
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
