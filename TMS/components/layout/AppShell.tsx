'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AuthSession,
  SystemControlState,
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
import { apiClient } from '../../lib/api';
import { readStore } from '../../lib/store';
import {
  Activity,
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
  Menu,
  Network,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Terminal,
  Truck,
  Upload,
  UserRound,
  Users,
  Wrench,
  X,
} from '../ui/Icons';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
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
  const [session, setLocalSession] = useState<AuthSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global System State Monitoring
  const [systemControl, setSystemControl] = useState<SystemControlState | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkGlobalSystemStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await apiClient.system.getStatus();
      if (res && res.data) {
        setSystemControl(res.data);
      }
    } catch {
      const s = readStore();
      if (s && s.systemControl) {
        setSystemControl(s.systemControl);
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkGlobalSystemStatus();
    const handleStoreUpdate = () => {
      const s = readStore();
      if (s && s.systemControl) {
        setSystemControl(s.systemControl);
      }
    };
    const handleShutdownEvent = (e: any) => {
      const detail = e.detail || {};
      setSystemControl((prev) => ({
        ...(prev || ({} as any)),
        systemState: 'SHUTDOWN',
        shutdownReason: detail.message || detail.shutdownReason || 'Emergency global system shutdown',
        shutdownBy: detail.shutdownBy || 'ADMIN',
        shutdownAt: detail.shutdownAt || new Date().toISOString(),
      }));
    };

    window.addEventListener('tms:store-update', handleStoreUpdate);
    window.addEventListener('tms:system-shutdown', handleShutdownEvent);

    // Adaptive polling: 5s during shutdown/maintenance so users auto-recover immediately when resumed
    const isRestricted = systemControl && (systemControl.systemState === 'SHUTDOWN' || systemControl.systemState === 'MAINTENANCE');
    const interval = setInterval(checkGlobalSystemStatus, isRestricted ? 5000 : 15000);

    return () => {
      window.removeEventListener('tms:store-update', handleStoreUpdate);
      window.removeEventListener('tms:system-shutdown', handleShutdownEvent);
      clearInterval(interval);
    };
  }, [systemControl?.systemState]);

  // Sync session
  useEffect(() => {
    const s = getCurrentSession();
    if (!s) {
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

  // Automatically close mobile menu on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Developer & System Control Groups for Admin Portal
  const adminNavGroups: NavGroup[] = [
    {
      groupTitle: 'SYSTEM',
      items: [
        { label: 'System Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'System Health', href: '/admin/system-health', icon: Activity },
        { label: 'Database Explorer', href: '/admin/database', icon: Database },
        { label: 'Entities & ER Map', href: '/admin/entities', icon: Network },
        { label: 'Calculations & Rules', href: '/admin/calculations', icon: Terminal },
      ],
    },
    {
      groupTitle: 'APPLICATION',
      items: [
        { label: 'Users & Accounts', href: '/admin/users', icon: Users },
        { label: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
        { label: 'System Configuration', href: '/admin/settings', icon: Settings },
        { label: 'API & Backend Services', href: '/admin/api', icon: Server },
        { label: 'System Logs', href: '/admin/logs', icon: Terminal },
      ],
    },
    {
      groupTitle: 'DATA',
      items: [
        { label: 'Data Explorer', href: '/admin/data-explorer', icon: ClipboardList },
        { label: 'Data Integrity Scan', href: '/admin/integrity', icon: Activity },
        { label: 'Global Search', href: '/admin/search', icon: Search },
      ],
    },
    {
      groupTitle: 'AUDIT',
      items: [
        { label: 'Audit Trails', href: '/admin/audit', icon: ClipboardList },
        { label: 'Activity Logs', href: '/admin/activity', icon: Activity },
      ],
    },
    {
      groupTitle: 'DEVELOPER',
      items: [
        { label: 'Database Schema', href: '/admin/schema', icon: Database },
        { label: 'Diagnostics Suite', href: '/admin/diagnostics', icon: Wrench },
        { label: 'System Information', href: '/admin/info', icon: Server },
        { label: 'Excel Import Center', href: '/admin/imports', icon: Upload },
      ],
    },
    {
      groupTitle: 'SYSTEM CONTROL',
      items: [
        { label: 'System State Control', href: '/admin/system-control', icon: Server },
        { label: 'Emergency Deck', href: '/admin/emergency', icon: AlertTriangle },
        { label: 'Backups Center', href: '/admin/backups', icon: Database },
        { label: 'Recovery Center', href: '/admin/recovery', icon: Wrench },
      ],
    },
  ];

  // Standard Nav items for other portals
  const portalNavs: Record<'worker' | 'accounts' | 'manager' | 'md', NavItem[]> = {
    worker: [
      { label: 'Dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
      { label: 'New Trip', href: '/worker/trips/new', icon: Plus },
      { label: 'My Trips', href: '/worker/trips', icon: ClipboardList },
      { label: 'Add Vehicles', href: '/worker/vehicles', icon: Truck },
      { label: 'Add Drivers', href: '/worker/drivers', icon: UserRound },
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
      { label: 'Customer Requests', href: '/manager/customer-requests', icon: Shield },
      { label: 'Customers', href: '/manager/customers', icon: Building2 },
      { label: 'Vehicles', href: '/manager/vehicles', icon: Truck },
      { label: 'Drivers', href: '/manager/drivers', icon: UserRound },
      { label: 'Materials', href: '/manager/materials', icon: Database },
      { label: 'Crushers / Sources', href: '/manager/crushers', icon: Factory },
      { label: 'Locations', href: '/manager/locations', icon: MapPin },
      { label: 'Rates Configuration', href: '/manager/rates', icon: ClipboardList },
      { label: 'Audit Trails', href: '/manager/audit', icon: ClipboardList },
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
      { label: 'Audit Trails', href: '/md/audit', icon: ClipboardList },
    ],
  };

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

  // GLOBAL SYSTEM SHUTDOWN / MAINTENANCE SCREEN FOR NON-ADMINS
  const isSystemRestricted =
    systemControl &&
    (systemControl.systemState === 'MAINTENANCE' || systemControl.systemState === 'SHUTDOWN');

  const isAdminUser = session?.role === 'ADMIN';

  if (isSystemRestricted && !isAdminUser) {
    return (
      <div className="min-h-screen bg-[#0d1e2e] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-[#112638] rounded-2xl border border-[#21435f] shadow-2xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F668F] border border-[#81C4D7] text-white flex items-center justify-center shadow">
              <Truck size={22} />
            </div>
            <div className="text-left">
              <strong className="text-sm font-black tracking-wider text-white uppercase block">
                SRI AMMAN ARUL TRANSPORTS
              </strong>
              <span className="text-[10px] text-[#81C4D7] tracking-widest font-semibold uppercase">
                TransFlow TMS Enterprise SaaS
              </span>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
              systemControl.systemState === 'SHUTDOWN'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                systemControl.systemState === 'SHUTDOWN' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span>
              {systemControl.systemState === 'SHUTDOWN' ? 'System Temporarily Unavailable' : 'Scheduled Maintenance Mode'}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {systemControl.systemState === 'SHUTDOWN'
                ? 'System Temporarily Unavailable'
                : systemControl.maintenanceTitle || 'System Under Maintenance'}
            </h1>
            <p className="text-sm text-[#a1b8cc] leading-relaxed max-w-md mx-auto">
              {systemControl.systemState === 'SHUTDOWN'
                ? 'The system is currently shut down for maintenance. Please contact the administrator.'
                : systemControl.maintenanceMessage ||
                  'The system is currently undergoing scheduled maintenance. Please check back shortly.'}
            </p>
            {systemControl.systemState === 'SHUTDOWN' && (
              <div className="pt-2">
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-300">Lock Enforcement:</span>
                    <span className="font-mono text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">HTTP 503 Backend Enforced</span>
                  </div>
                  {systemControl.shutdownReason && (
                    <p className="text-[11px] text-rose-200">
                      <strong>Reason:</strong> {systemControl.shutdownReason}
                    </p>
                  )}
                  {systemControl.shutdownBy && (
                    <p className="text-[11px] text-rose-200">
                      <strong>Authorized By:</strong> {systemControl.shutdownBy}
                    </p>
                  )}
                  {systemControl.shutdownAt && (
                    <p className="text-[11px] text-rose-200">
                      <strong>Timestamp:</strong> {new Date(systemControl.shutdownAt).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {systemControl.expectedRecoveryTime && (
            <div className="p-3 rounded-lg bg-[#16354f] border border-[#234e73] inline-block text-xs font-semibold text-[#81C4D7]">
              <span>Expected Service Recovery: </span>
              <strong className="text-white">
                {new Date(systemControl.expectedRecoveryTime).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={checkGlobalSystemStatus}
              disabled={checkingStatus}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-extrabold text-[#112638] bg-[#81C4D7] hover:bg-[#9bd4e3] transition-all flex items-center justify-center gap-2 shadow"
            >
              <RefreshCw size={14} className={checkingStatus ? 'animate-spin' : ''} />
              <span>Check System Status</span>
            </button>
            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1e4463] hover:bg-[#285982] border border-[#2d608a] transition-all flex items-center justify-center gap-2"
            >
              <Shield size={14} />
              <span>Admin Recovery Login</span>
            </button>
          </div>

          <p className="text-[10px] text-[#5A6E7F] pt-4 border-t border-[#1c3c57]">
            TransFlow TMS Control Room · Sri Amman Arul Transports Operations Infrastructure
          </p>
        </div>
      </div>
    );
  }

  // Find active navigation item
  const allNavItems =
    portal === 'admin'
      ? adminNavGroups.flatMap((g) => g.items)
      : portalNavs[portal] || [];

  const activeNav = allNavItems.find(
    (item) => item.href === pathname || (item.href !== `/${portal}/dashboard` && pathname.startsWith(item.href))
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7fa] font-sans antialiased text-[#16425B] relative overflow-x-hidden">
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-[#0d1e2e]/70 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR (Desktop static, Mobile/Tablet slide-in drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#16425B] text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out border-r border-[#225470] print:hidden lg:static lg:w-64 lg:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 bg-[#113550] border-b border-[#215473] flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2F668F] border border-[#81C4D7] text-white flex items-center justify-center shadow-sm shrink-0">
              <Truck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="text-xs font-black tracking-wider text-white uppercase block leading-tight truncate">
                SRI AMMAN ARUL TRANSPORTS
              </strong>
            </div>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="lg:hidden p-1.5 text-[#81C4D7] hover:text-white rounded-lg hover:bg-[#16425B] transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-3 px-3 overflow-y-auto space-y-4">
          {portal === 'admin' ? (
            // Render Categorized Sections for Admin
            adminNavGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#81C4D7]/70">
                  {group.groupTitle}
                </p>
                <nav className="space-y-0.5">
                  {group.items.map(({ label, href, icon: Icon }) => {
                    const isActive =
                      pathname === href ||
                      (href !== '/admin/dashboard' && pathname.startsWith(href));
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsMobileNavOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#2F668F] text-white shadow-sm'
                            : 'text-[#c9d6e2] hover:bg-[#1f506e] hover:text-white'
                        }`}
                      >
                        <Icon size={15} className={isActive ? 'text-[#81C4D7]' : 'text-[#8da3b5]'} />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))
          ) : (
            // Standard single-group nav for other portals
            <div>
              <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#81C4D7]/70">
                Navigation Core
              </p>
              <nav className="space-y-1">
                {(portalNavs[portal] || []).map(({ label, href, icon: Icon }) => {
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
          )}
        </div>

        {/* Quick Portal Switcher */}
        <div className="p-3 mx-3 mb-2 rounded-lg bg-[#113550]/80 border border-[#215473]">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#81C4D7] uppercase tracking-wider mb-1.5">
            <span>Control Persona</span>
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
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* PERSISTENT ADMIN SYSTEM STATE WARNING BANNER */}
        {isSystemRestricted && isAdminUser && (
          <div
            className={`px-4 sm:px-6 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md print:hidden ${
              systemControl?.systemState === 'SHUTDOWN'
                ? 'bg-gradient-to-r from-rose-700 to-rose-900 text-white'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-200 shrink-0" />
              <span>
                SYSTEM IS IN <strong>{systemControl?.systemState}</strong> MODE — Administrator Emergency Bypass Active
              </span>
            </div>
            <Link
              href="/admin/system-control"
              className="underline text-amber-100 hover:text-white font-extrabold transition-colors flex items-center gap-1"
            >
              <span>Manage in System Control Center</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}

        {/* TOP STATUS BAR */}
        <header className="h-16 bg-white border-b border-[#D9DBD6] px-3 sm:px-6 flex items-center justify-between z-20 print:hidden shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-1 text-[#16425B] hover:bg-[#f4f7fa] rounded-lg transition-colors flex items-center justify-center shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-[#5A6E7F] min-w-0">
              <span className="font-semibold text-[#16425B] truncate max-w-[100px] sm:max-w-none">{portalName}</span>
              <span className="mx-1.5 sm:mx-2 text-[#D9DBD6] shrink-0">/</span>
              <span className="text-[#2F668F] font-bold truncate max-w-[130px] sm:max-w-none">{activeNav?.label || 'Workspace'}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {headerActions && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {headerActions}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#f4f7fa] border border-transparent hover:border-[#D9DBD6] transition-all"
                aria-expanded={isProfileOpen}
              >
                <div className="w-7 h-7 rounded-full bg-[#2F668F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {session?.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#16425B] leading-tight">{session?.name}</p>
                  <p className="text-[10px] text-[#5A6E7F] leading-tight">{session?.role}</p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-[#D9DBD6] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="pb-3 mb-3 border-b border-[#D9DBD6]">
                    <p className="text-xs font-bold text-[#16425B] truncate">{session?.name}</p>
                    <p className="text-[11px] text-[#5A6E7F] truncate">{session?.email}</p>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-[#5A6E7F]">Employee ID:</dt>
                      <dd className="font-semibold text-[#16425B]">{session?.employeeId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#5A6E7F]">Assigned Role:</dt>
                      <dd className="font-semibold text-[#2F668F]">{session?.role}</dd>
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 min-w-0">{children}</main>
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
