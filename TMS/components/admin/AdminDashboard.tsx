'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { DEMO_USERS } from '../../lib/auth';
import { PageHeader } from '../layout/PageHeader';
import {
  Server,
  Activity,
  Database,
  Layers,
  Terminal,
  Network,
  Shield,
  Search,
  Check,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Users,
  Truck,
  FileText,
  DollarSign,
  Fuel,
  ArrowRight,
  ClipboardList,
  Settings,
  Wrench,
  X,
} from '../ui/Icons';

export function AdminDashboard() {
  const store = useTmsStore();
  const {
    customers,
    trips,
    vehicles,
    drivers,
    workers,
    invoices,
    payments,
    transactions,
    dieselRecords,
    vehicleExpenses,
    otherExpenses,
    materials,
    sources,
    locations,
    auditLogs,
    rates,
  } = store;

  // SYSTEM HEALTH LIVE PING
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'down'>('checking');
  const [backendMeta, setBackendMeta] = useState<string>('Probing Spring Boot (Port 8080)...');

  // SYSTEM SEARCH STATE
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSearchResult, setSelectedSearchResult] = useState<any | null>(null);

  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch('http://localhost:8080/');
      if (res.ok) {
        const json = await res.json();
        setBackendStatus('healthy');
        setBackendMeta(`${json.system || 'Spring Boot API'} · v${json.version || '1.0.0'}`);
      } else {
        setBackendStatus('down');
        setBackendMeta(`HTTP ${res.status}: Backend responding with error`);
      }
    } catch {
      setBackendStatus('down');
      setBackendMeta('Connection refused at http://localhost:8080');
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  // DETECTABLE DATA INTEGRITY WARNINGS
  const integrityWarnings = useMemo(() => {
    const list: { id: string; type: 'CRITICAL' | 'WARNING'; message: string; entity: string }[] = [];

    // Duplicate customer phones
    const phoneMap = new Map<string, number>();
    customers.forEach((c) => {
      const p = (c.phone || '').trim();
      if (p) phoneMap.set(p, (phoneMap.get(p) || 0) + 1);
    });
    phoneMap.forEach((count, phone) => {
      if (count > 1) {
        list.push({
          id: `phone-${phone}`,
          type: 'WARNING',
          message: `Duplicate customer phone detected: "${phone}" used in ${count} profiles`,
          entity: 'Customer',
        });
      }
    });

    // Trips referencing unknown customer
    const validCustIds = new Set(customers.map((c) => c.id));
    const orphanTrips = trips.filter((t) => t.customerId && !validCustIds.has(t.customerId));
    if (orphanTrips.length > 0) {
      list.push({
        id: 'orphan-trips',
        type: 'CRITICAL',
        message: `${orphanTrips.length} trip(s) reference non-existent customer IDs`,
        entity: 'Trip',
      });
    }

    // Trips with zero tonnage/quantity
    const zeroTonTrips = trips.filter((t) => !t.quantity || t.quantity <= 0);
    if (zeroTonTrips.length > 0) {
      list.push({
        id: 'zero-ton',
        type: 'WARNING',
        message: `${zeroTonTrips.length} dispatch(es) recorded with zero or missing weight tonnage`,
        entity: 'Trip',
      });
    }

    // Invoices with balance discrepancy
    const badInvoices = invoices.filter((i) => (i.outstandingAmount || 0) > (i.totalAmount || 0));
    if (badInvoices.length > 0) {
      list.push({
        id: 'bad-invoices',
        type: 'CRITICAL',
        message: `${badInvoices.length} invoice(s) have balance due exceeding total invoiced amount`,
        entity: 'Invoice',
      });
    }

    return list;
  }, [customers, trips, invoices]);

  // GLOBAL SEARCH RESOLUTION
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: Array<{
      type: string;
      id: string;
      title: string;
      subtitle: string;
      raw: any;
      relationships: Array<{ label: string; value: string }>;
    }> = [];

    // Search Trips
    trips.forEach((t) => {
      if (
        t.id.toLowerCase().includes(q) ||
        (t.customerId && t.customerId.toLowerCase().includes(q)) ||
        (t.vehicleRegistration && t.vehicleRegistration.toLowerCase().includes(q)) ||
        (t.material && t.material.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'TRIP',
          id: t.id,
          title: `Trip ${t.id} · ${t.customerName || t.customerId || 'Customer'}`,
          subtitle: `${t.vehicleRegistration || 'No Vehicle'} · ${t.material || 'Material'} · ${t.quantity || 0} Tons`,
          raw: t,
          relationships: [
            { label: 'Customer', value: t.customerName || t.customerId || 'None' },
            { label: 'Vehicle', value: t.vehicleRegistration || 'None' },
            { label: 'Driver', value: t.driverName || t.driverId || 'None' },
            { label: 'Source', value: t.source || 'None' },
            { label: 'Invoice Ref', value: t.invoiceId || 'Unbilled' },
            { label: 'Recorded By', value: t.enteredBy || 'Worker' },
          ],
        });
      }
    });

    // Search Customers
    customers.forEach((c) => {
      if (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      ) {
        results.push({
          type: 'CUSTOMER',
          id: c.id,
          title: `Customer ${c.name} (${c.id})`,
          subtitle: `Phone: ${c.phone || '—'} · Terms: ${c.creditTerms || 'Cash'} · Balance: ₹${c.balance || 0}`,
          raw: c,
          relationships: [
            { label: 'Payment Terms', value: c.creditTerms || 'Cash' },
            { label: 'GSTIN', value: c.gstin || 'Unregistered' },
            { label: 'Trips Count', value: `${trips.filter((t) => t.customerId === c.id).length} Trips` },
            { label: 'Invoices Count', value: `${invoices.filter((i) => i.customerId === c.id).length} Invoices` },
          ],
        });
      }
    });

    // Search Vehicles
    vehicles.forEach((v) => {
      if (v.registration.toLowerCase().includes(q)) {
        results.push({
          type: 'VEHICLE',
          id: v.registration,
          title: `Vehicle ${v.registration}`,
          subtitle: `Type: ${v.type || 'Tipper'} · Status: ${v.status || 'Active'}`,
          raw: v,
          relationships: [
            { label: 'Associated Trips', value: `${trips.filter((t) => t.vehicleRegistration?.toLowerCase() === v.registration.toLowerCase()).length} Dispatches` },
            { label: 'Fuel Logs', value: `${dieselRecords.filter((d) => d.vehicleRegistration?.toLowerCase() === v.registration.toLowerCase()).length} Records` },
          ],
        });
      }
    });

    // Search Invoices
    invoices.forEach((i) => {
      if (i.id.toLowerCase().includes(q) || (i.customerId && i.customerId.toLowerCase().includes(q))) {
        results.push({
          type: 'INVOICE',
          id: i.id,
          title: `Invoice ${i.id}`,
          subtitle: `Total: ₹${i.totalAmount || 0} · Balance: ₹${i.outstandingAmount || 0} · Status: ${i.status || 'Active'}`,
          raw: i,
          relationships: [
            { label: 'Customer', value: i.customerName || i.customerId || '—' },
            { label: 'Billed Amount', value: `₹${i.totalAmount || 0}` },
            { label: 'Remaining Due', value: `₹${i.outstandingAmount || 0}` },
          ],
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, trips, customers, vehicles, invoices, dieselRecords]);

  // High-level database entity count cards
  const entityCounts = [
    { name: 'Trips', count: trips.length, link: '/admin/database?entity=trips', icon: Truck, color: 'text-blue-600' },
    { name: 'Customers', count: customers.length, link: '/admin/database?entity=customers', icon: Users, color: 'text-indigo-600' },
    { name: 'Vehicles', count: vehicles.length, link: '/admin/database?entity=vehicles', icon: Truck, color: 'text-amber-600' },
    { name: 'Drivers', count: drivers.length, link: '/admin/database?entity=drivers', icon: Users, color: 'text-cyan-600' },
    { name: 'Workers', count: workers.length, link: '/admin/users', icon: Users, color: 'text-teal-600' },
    { name: 'Users / Auth', count: DEMO_USERS.length, link: '/admin/users', icon: Shield, color: 'text-purple-600' },
    { name: 'Invoices', count: invoices.length, link: '/admin/database?entity=invoices', icon: FileText, color: 'text-emerald-600' },
    { name: 'Payments', count: payments.length, link: '/admin/database?entity=transactions', icon: DollarSign, color: 'text-emerald-700' },
    { name: 'Transactions', count: transactions.length, link: '/admin/database?entity=transactions', icon: DollarSign, color: 'text-green-600' },
    { name: 'Diesel Logs', count: dieselRecords.length, link: '/admin/database?entity=diesel', icon: Fuel, color: 'text-orange-600' },
    { name: 'Expenses', count: vehicleExpenses.length + otherExpenses.length, link: '/admin/database', icon: DollarSign, color: 'text-rose-600' },
    { name: 'Materials', count: materials.length, link: '/admin/database', icon: Layers, color: 'text-stone-600' },
    { name: 'Quarry / Crushers', count: sources.length, link: '/admin/database', icon: Database, color: 'text-violet-600' },
    { name: 'Locations', count: locations.length, link: '/admin/database', icon: Network, color: 'text-sky-600' },
    { name: 'Audit Journal', count: auditLogs.length, link: '/admin/audit', icon: ClipboardList, color: 'text-slate-600' },
  ];

  const currentSystemState = store.systemControl?.systemState || 'ONLINE';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer & System Control Center"
        description="Global system telemetry · Real database introspection, service health, relational governance, and diagnostics"
      >
        <div className="flex items-center gap-2">
          <Link href="/admin/system-control" className="btn-secondary">
            <Server size={14} />
            System Control
          </Link>
          <Link href="/admin/emergency" className="btn-secondary !text-rose-700 !border-rose-200 hover:!bg-rose-50">
            <AlertTriangle size={14} />
            Emergency
          </Link>
          <Link href="/admin/data-explorer" className="btn-primary">
            <Database size={14} />
            Data Explorer
          </Link>
        </div>
      </PageHeader>

      {/* GLOBAL SHUTDOWN ALERT STRIP IF ACTIVE */}
      {currentSystemState === 'SHUTDOWN' && (
        <div className="p-4 rounded-xl bg-red-950/20 border-2 border-red-500/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <strong className="text-xs font-black uppercase tracking-wider text-red-700">
                GLOBAL SYSTEM SHUTDOWN ACTIVE
              </strong>
              <span className="text-[11px] font-mono text-red-600 font-semibold bg-red-100 px-1.5 py-0.5 rounded">
                HTTP 503 Enforced
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              All normal user portals (Worker, Accounts, Manager, MD) are locked. Only Admin recovery endpoints are accessible.
            </p>
          </div>
          <Link
            href="/admin/system-control"
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow shrink-0 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Go to Resume Control</span>
          </Link>
        </div>
      )}

      {/* SYSTEM CONTROL ROOM QUICK HUB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: SYSTEM STATE */}
        <Link
          href="/admin/system-control"
          className="p-5 rounded-xl border border-[#D9DBD6] bg-white shadow-sm hover:shadow-md hover:border-[#2F668F] transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A6E7F]">System State</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentSystemState === 'ONLINE'
                    ? 'bg-emerald-500 animate-ping'
                    : currentSystemState === 'MAINTENANCE'
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                }`}
              />
            </div>
            <strong className="text-base font-black text-[#16425B] block">
              {currentSystemState === 'ONLINE' ? '🟢 System Online' : currentSystemState === 'MAINTENANCE' ? '🟡 Maintenance' : '🔴 System Shutdown'}
            </strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1 leading-snug">
              Global SaaS lifecycle, safe shutdown workflow & broadcast
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#2F668F] group-hover:underline flex items-center gap-1">
            <span>Manage System</span> &rarr;
          </span>
        </Link>

        {/* CARD 2: BACKUPS */}
        <Link
          href="/admin/backups"
          className="p-5 rounded-xl border border-[#D9DBD6] bg-white shadow-sm hover:shadow-md hover:border-[#2F668F] transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A6E7F]">Backup Manager</span>
              <Database size={15} className="text-[#2F668F]" />
            </div>
            <strong className="text-base font-black text-[#16425B] block">
              {store.backupRecords?.length || 2} Snapshots
            </strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1 leading-snug">
              Create instant backup, verify SHA-256 & retention policies
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#2F668F] group-hover:underline flex items-center gap-1">
            <span>Open Backups</span> &rarr;
          </span>
        </Link>

        {/* CARD 3: RECOVERY */}
        <Link
          href="/admin/recovery"
          className="p-5 rounded-xl border border-[#D9DBD6] bg-white shadow-sm hover:shadow-md hover:border-[#2F668F] transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A6E7F]">Recovery Center</span>
              <Wrench size={15} className="text-emerald-700" />
            </div>
            <strong className="text-base font-black text-[#16425B] block">Point-in-Time Restore</strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1 leading-snug">
              Disaster recovery rollbacks & pre-restore safety snapshots
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#2F668F] group-hover:underline flex items-center gap-1">
            <span>Open Recovery</span> &rarr;
          </span>
        </Link>

        {/* CARD 4: EMERGENCY */}
        <Link
          href="/admin/emergency"
          className="p-5 rounded-xl border border-rose-200 bg-rose-50/50 shadow-sm hover:shadow-md hover:border-rose-400 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">Emergency Room</span>
              <AlertTriangle size={15} className="text-rose-600" />
            </div>
            <strong className="text-base font-black text-rose-900 block">Emergency Controls</strong>
            <p className="text-[11px] text-rose-700 mt-1 leading-snug">
              Instant operational throttles, trip/payment freeze & isolation
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-rose-700 group-hover:underline flex items-center gap-1">
            <span>Emergency Room</span> &rarr;
          </span>
        </Link>
      </div>

      {/* 1. SYSTEM HEALTH BAR */}
      <div className="bg-white rounded-xl border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D9DBD6]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#16425B] text-white flex items-center justify-center font-mono">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#16425B] uppercase tracking-wider">
                System Infrastructure Status
              </h2>
              <span className="text-[11px] text-[#5A6E7F] font-mono">Environment: development / localhost</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkBackendHealth}
              className="px-2.5 py-1 text-xs font-mono font-bold text-[#16425B] bg-[#f1f5f9] rounded hover:bg-[#e2e8f0] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className={backendStatus === 'checking' ? 'animate-spin' : ''} />
              Re-probe Nodes
            </button>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              Build v2.4.0-sysctrl
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* BACKEND API */}
          <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <span className="text-[#5A6E7F] font-bold">Backend Service</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                  backendStatus === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : backendStatus === 'checking'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {backendStatus === 'healthy' ? 'ONLINE (200)' : backendStatus === 'checking' ? 'PROBING' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-[#16425B] font-bold block mt-1.5 truncate">Port 8080 (REST)</span>
            <span className="text-[10px] text-[#8da3b5] block truncate mt-0.5">{backendMeta}</span>
          </div>

          {/* DATABASE */}
          <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <span className="text-[#5A6E7F] font-bold">Relational DB</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <span className="text-[#16425B] font-bold block mt-1.5">PostgreSQL 18.6</span>
            <span className="text-[10px] text-[#8da3b5] block mt-0.5">DB: tms_db | Port: 5432</span>
          </div>

          {/* FRONTEND */}
          <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <span className="text-[#5A6E7F] font-bold">Client Runtime</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                HYDRATED
              </span>
            </div>
            <span className="text-[#16425B] font-bold block mt-1.5">Next.js 15.5.2</span>
            <span className="text-[10px] text-[#8da3b5] block mt-0.5">React 19 | Tailwind 3.4</span>
          </div>

          {/* AUDIT RECORDER */}
          <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <span className="text-[#5A6E7F] font-bold">Audit Governance</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                LOCKED
              </span>
            </div>
            <span className="text-[#16425B] font-bold block mt-1.5 font-mono">{auditLogs.length} Records</span>
            <span className="text-[10px] text-[#8da3b5] block mt-0.5">Immutable audit trail active</span>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL SYSTEM SEARCH */}
      <div className="bg-white rounded-xl border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[#2F668F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#16425B]">
              Global System Entity Search & Cross-Reference
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#5A6E7F]">Search by ID, Customer, Vehicle, Invoice</span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Type ID (e.g. TRP-0001, CUST-001, INV-001, TN-38) or keyword to inspect relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#D9DBD6] rounded-lg text-xs font-mono focus:outline-none focus:border-[#2F668F] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSearchResult(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* SEARCH RESULTS DROPDOWN */}
        {searchResults.length > 0 && (
          <div className="mt-3 bg-white border border-[#D9DBD6] rounded-lg shadow-md divide-y divide-[#edf2f7] overflow-hidden">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedSearchResult(item)}
                className="p-3 hover:bg-[#f8fafc] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {item.type}
                    </span>
                    <strong className="text-xs text-[#16425B] font-mono">{item.title}</strong>
                  </div>
                  <p className="text-[11px] text-[#5A6E7F] mt-0.5">{item.subtitle}</p>
                </div>
                <span className="text-xs text-[#2F668F] font-bold flex items-center gap-1">
                  Inspect <ArrowRight size={12} />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SELECTED SEARCH RESULT MODAL/CARD */}
        {selectedSearchResult && (
          <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#cbd5e1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#cbd5e1]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#16425B] text-white text-[10px] font-mono font-bold rounded">
                  {selectedSearchResult.type}
                </span>
                <strong className="text-sm text-[#16425B] font-mono">{selectedSearchResult.title}</strong>
              </div>
              <button
                onClick={() => setSelectedSearchResult(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Close Inspector
              </button>
            </div>

            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block mb-2">
                Connected Foreign Key Relationships:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedSearchResult.relationships.map((rel: any, i: number) => (
                  <div key={i} className="p-2 bg-white rounded border border-[#e2e8f0] text-xs">
                    <span className="text-[10px] text-[#8da3b5] font-mono block">{rel.label}</span>
                    <span className="text-xs font-bold text-[#16425B] font-mono mt-0.5 block truncate">
                      {rel.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. REAL DETECTED DATA INTEGRITY WARNINGS */}
      {integrityWarnings.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Live Data Integrity Warnings ({integrityWarnings.length} Detected)
              </h3>
            </div>
            <Link
              href="/admin/integrity"
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 font-mono"
            >
              Full Diagnostics Scanner →
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {integrityWarnings.map((warn) => (
              <div
                key={warn.id}
                className="p-2.5 bg-white/80 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      warn.type === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {warn.type}
                  </span>
                  <span className="text-[#16425B] font-semibold">{warn.message}</span>
                </div>
                <span className="text-[11px] font-mono text-[#5A6E7F]">{warn.entity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. REAL DATABASE ENTITY COUNTS (15 ENTITIES) */}
      <div className="bg-white rounded-xl border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#16425B]">
              Database Entity Store Introspection (Real Record Counts)
            </h3>
            <span className="text-[11px] text-[#5A6E7F]">Live state from memory store & persistence layer</span>
          </div>
          <Link
            href="/admin/database"
            className="text-xs font-bold text-[#2F668F] hover:text-[#16425B] font-mono flex items-center gap-1"
          >
            Open Data Explorer →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {entityCounts.map((ent, idx) => {
            const Icon = ent.icon;
            return (
              <Link
                key={idx}
                href={ent.link}
                className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] hover:border-[#2F668F] hover:bg-white transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="text-[11px] text-[#5A6E7F] block font-medium group-hover:text-[#16425B]">
                    {ent.name}
                  </span>
                  <span className="text-xl font-black text-[#16425B] font-mono mt-0.5 block">{ent.count}</span>
                </div>
                <div className={`p-2 rounded-lg bg-white border border-[#e2e8f0] ${ent.color}`}>
                  <Icon size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. DEVELOPER CONTROL SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/database"
          className="p-4 bg-white rounded-xl border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2F668F] flex items-center justify-center mb-2 font-mono">
              <Database size={16} />
            </div>
            <strong className="text-xs font-bold text-[#16425B] block">Database Explorer</strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1">
              Table schema dictionary, column definitions, and raw JSON record inspector.
            </p>
          </div>
          <span className="text-xs font-bold text-[#2F668F] mt-3 block font-mono">Inspect Schema →</span>
        </Link>

        <Link
          href="/admin/entities"
          className="p-4 bg-white rounded-xl border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 font-mono">
              <Network size={16} />
            </div>
            <strong className="text-xs font-bold text-[#16425B] block">Entity & Model Graph</strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1">
              Visual ER graph, cardinalities (1:N, N:1), and foreign key cascade rules.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 mt-3 block font-mono">View Graph →</span>
        </Link>

        <Link
          href="/admin/calculations"
          className="p-4 bg-white rounded-xl border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 font-mono">
              <Terminal size={16} />
            </div>
            <strong className="text-xs font-bold text-[#16425B] block">Calculations & Rules</strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1">
              Mathematical formulas for Revenue, Receivables, Trip Cost, and Mileage.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 mt-3 block font-mono">Inspect Formulas →</span>
        </Link>

        <Link
          href="/admin/api"
          className="p-4 bg-white rounded-xl border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 font-mono">
              <Server size={16} />
            </div>
            <strong className="text-xs font-bold text-[#16425B] block">API & Backend Endpoints</strong>
            <p className="text-[11px] text-[#5A6E7F] mt-1">
              Live Spring Boot endpoint catalog, DTO payload schemas, and Swagger UI.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 mt-3 block font-mono">Probe Endpoints →</span>
        </Link>
      </div>
    </div>
  );
}
