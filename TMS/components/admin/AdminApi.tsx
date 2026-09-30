'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { PageHeader } from '../layout/PageHeader';
import {
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Code,
  Terminal,
  Shield,
  Layers,
} from '../ui/Icons';

interface EndpointDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  controller: string;
  entity: string;
  summary: string;
  requestBody?: string;
  responseBody: string;
  authRequired: boolean;
  roleScope: string;
}

const BACKEND_ENDPOINTS: EndpointDefinition[] = [
  {
    method: 'GET',
    path: '/',
    controller: 'RootController',
    entity: 'System Health',
    summary: 'Spring Boot application metadata, uptime status, and OpenAPI links',
    responseBody: '{ status: "UP", system: string, version: string, apiDocs: string }',
    authRequired: false,
    roleScope: 'PUBLIC',
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    controller: 'AuthController',
    entity: 'Authentication',
    summary: 'Authenticate credentials, emit signed JWT bearer token and user role profile',
    requestBody: '{ username: string, password: string }',
    responseBody: '{ token: string, user: { id: string, name: string, role: string } }',
    authRequired: false,
    roleScope: 'PUBLIC',
  },
  {
    method: 'GET',
    path: '/api/trips',
    controller: 'TripController',
    entity: 'Trip',
    summary: 'Fetch paginated and filtered dispatch records',
    responseBody: 'Page<TripResponse> [{ id, tripDate, customerId, vehicleNo, driverId, tonnage, status }]',
    authRequired: true,
    roleScope: 'WORKER, MANAGER, MD, ACCOUNTS, ADMIN',
  },
  {
    method: 'POST',
    path: '/api/trips',
    controller: 'TripController',
    entity: 'Trip',
    summary: 'Create new dispatch record with rate freezing and tonnage validation',
    requestBody: '{ date, customerId, vehicleNo, driverId, sourceId, material, tonnage, startKm, endKm }',
    responseBody: 'TripResponse { id: "TRP-...", status: "SUBMITTED", ... }',
    authRequired: true,
    roleScope: 'WORKER, MANAGER',
  },
  {
    method: 'GET',
    path: '/api/customers',
    controller: 'CustomerController',
    entity: 'Customer',
    summary: 'Retrieve customer catalog with credit terms and outstanding balances',
    responseBody: 'List<CustomerResponse> [{ id, name, phone, paymentType, balance, gstin }]',
    authRequired: true,
    roleScope: 'MANAGER, ACCOUNTS, MD, ADMIN',
  },
  {
    method: 'POST',
    path: '/api/customers',
    controller: 'CustomerController',
    entity: 'Customer',
    summary: 'Create or update customer business entity',
    requestBody: '{ name, phone, address, paymentType: "CASH" | "CREDIT", creditDays, gstin }',
    responseBody: 'CustomerResponse { id: "CUST-...", ... }',
    authRequired: true,
    roleScope: 'MANAGER, ADMIN',
  },
  {
    method: 'GET',
    path: '/api/invoices',
    controller: 'InvoiceController',
    entity: 'Invoice',
    summary: 'Retrieve billed invoices with GST breakdowns and remaining balance due',
    responseBody: 'List<InvoiceResponse> [{ id, invoiceNo, customerId, subtotal, gstAmount, totalAmount, balanceDue }]',
    authRequired: true,
    roleScope: 'ACCOUNTS, MD, ADMIN',
  },
  {
    method: 'POST',
    path: '/api/invoices',
    controller: 'InvoiceController',
    entity: 'Invoice',
    summary: 'Generate official tax invoice from consolidated trips',
    requestBody: '{ customerId, tripIds: string[], gstRatePercent: number, invoiceDate: string }',
    responseBody: 'InvoiceResponse { id: "INV-...", status: "PENDING_PAYMENT", ... }',
    authRequired: true,
    roleScope: 'ACCOUNTS',
  },
  {
    method: 'GET',
    path: '/api/payments',
    controller: 'PaymentController',
    entity: 'Payment',
    summary: 'List payment vouchers with customer allocations and bank references',
    responseBody: 'List<PaymentResponse> [{ id, paymentNo, customerId, amount, paymentMode, referenceNo }]',
    authRequired: true,
    roleScope: 'ACCOUNTS, MD, ADMIN',
  },
  {
    method: 'POST',
    path: '/api/payments',
    controller: 'PaymentController',
    entity: 'Payment',
    summary: 'Post inward settlement voucher and reduce invoice balance due',
    requestBody: '{ customerId, invoiceId, amount, paymentMode: "BANK_TRANSFER" | "CASH" | "CHEQUE", bankAccountId }',
    responseBody: 'PaymentResponse { id: "PAY-...", postedAt: string }',
    authRequired: true,
    roleScope: 'ACCOUNTS',
  },
  {
    method: 'GET',
    path: '/api/diesel',
    controller: 'DieselExpenseController',
    entity: 'Diesel',
    summary: 'Retrieve vehicle fueling logs, literage, odometer KM and fuel bunk accounts',
    responseBody: 'List<DieselResponse> [{ id, vehicleNo, litres, ratePerLitre, totalCost, mileageKmPerLitre }]',
    authRequired: true,
    roleScope: 'WORKER, MANAGER, ACCOUNTS, MD',
  },
  {
    method: 'GET',
    path: '/api/vehicles',
    controller: 'VehicleController',
    entity: 'Vehicle',
    summary: 'List active fleet trucks, registration numbers and ownership status',
    responseBody: 'List<VehicleResponse> [{ id, vehicleNo, type, status, insuranceExpiry }]',
    authRequired: true,
    roleScope: 'ALL_AUTHENTICATED',
  },
  {
    method: 'GET',
    path: '/api/drivers',
    controller: 'DriverController',
    entity: 'Driver',
    summary: 'List verified commercial drivers and license status',
    responseBody: 'List<DriverResponse> [{ id, name, phone, licenseNo, status }]',
    authRequired: true,
    roleScope: 'MANAGER, WORKER, MD',
  },
  {
    method: 'GET',
    path: '/api/dashboard/summary',
    controller: 'DashboardController',
    entity: 'Dashboard',
    summary: 'Aggregated executive metrics, daily trip counts, and financial KPIs',
    responseBody: '{ totalRevenue, totalTripsToday, activeVehicles, pendingInvoices }',
    authRequired: true,
    roleScope: 'MANAGER, MD, ACCOUNTS',
  },
  {
    method: 'GET',
    path: '/api/audit-logs',
    controller: 'AuditLogController',
    entity: 'AuditLog',
    summary: 'Forensic audit trails with before/after mutations and actor user identities',
    responseBody: 'Page<AuditLogResponse> [{ id, actorUsername, role, action, entity, beforeValue, afterValue, timestamp }]',
    authRequired: true,
    roleScope: 'MD, ADMIN',
  },
];

export function AdminApi() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'healthy' | 'down'>('idle');
  const [pingResponse, setPingResponse] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointDefinition>(BACKEND_ENDPOINTS[0]);

  const rootBackendUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  // LIVE HEALTH PROBE
  const runLivePing = async () => {
    setPingStatus('checking');
    try {
      const res = await fetch(`${rootBackendUrl}/`);
      if (res.ok) {
        const data = await res.json();
        setPingStatus('healthy');
        setPingResponse(JSON.stringify(data, null, 2));
      } else {
        setPingStatus('down');
        setPingResponse(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      setPingStatus('down');
      setPingResponse(err instanceof Error ? err.message : `Connection failed to ${rootBackendUrl}`);
    }
  };

  useEffect(() => {
    runLivePing();
  }, []);

  const filteredEndpoints = BACKEND_ENDPOINTS.filter((ep) => {
    if (selectedMethod !== 'ALL' && ep.method !== selectedMethod) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.controller.toLowerCase().includes(q) ||
        ep.entity.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="API & Backend Service Inspection"
        description="Spring Boot 3.3.4 REST API endpoints · Inspect controller mapping, request/response DTOs, and live endpoint status"
      >
        <a
          href={`${rootBackendUrl}/swagger-ui/index.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#16425B] text-white text-xs font-mono font-bold rounded-md hover:bg-[#2F668F] transition-all shadow-sm"
        >
          <ExternalLink size={14} />
          Swagger UI Interactive
        </a>
      </PageHeader>

      {/* LIVE PROBE BANNER */}
      <div className="bg-white rounded-xl border border-[#D9DBD6] p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-sm ${
              pingStatus === 'healthy'
                ? 'bg-emerald-600'
                : pingStatus === 'checking'
                ? 'bg-blue-600 animate-pulse'
                : 'bg-red-600'
            }`}
          >
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#16425B]">Backend REST Service (Spring Boot 3.3.4)</h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                  pingStatus === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : pingStatus === 'checking'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {pingStatus === 'healthy' ? 'ONLINE (HTTP 200)' : pingStatus === 'checking' ? 'PROBING...' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-[#5A6E7F] mt-0.5 font-mono">Target Host: {rootBackendUrl} | Java 17 | PostgreSQL Dialect</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runLivePing}
            disabled={pingStatus === 'checking'}
            className="px-3 py-1.5 bg-[#f1f5f9] text-[#16425B] rounded-lg text-xs font-bold hover:bg-[#e2e8f0] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={pingStatus === 'checking' ? 'animate-spin' : ''} />
            Test Connection
          </button>
          <a
            href={`${rootBackendUrl}/v3/api-docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#e8f1f5] text-[#2F668F] rounded-lg text-xs font-bold font-mono hover:bg-[#d8e6ef] transition-colors flex items-center gap-1.5"
          >
            <Code size={14} />
            OpenAPI Raw JSON
          </a>
        </div>
      </div>

      {pingResponse && (
        <div className="bg-[#0f172a] rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto border border-[#334155]">
          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Live Backend Response Body:</span>
          <pre>{pingResponse}</pre>
        </div>
      )}

      {/* FILTER & ENDPOINT CATALOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ENDPOINT LIST (LEFT COLUMN) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#D9DBD6] shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 bg-[#f8fafc] border-b border-[#D9DBD6] flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A6E7F]" />
              <input
                type="text"
                placeholder="Filter endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-[#D9DBD6] rounded-md text-xs focus:outline-none focus:border-[#2F668F]"
              />
            </div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-2 py-1.5 border border-[#D9DBD6] rounded-md text-xs font-bold bg-white text-[#16425B]"
            >
              <option value="ALL">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="divide-y divide-[#edf2f7] overflow-y-auto max-h-[640px]">
            {filteredEndpoints.map((ep, idx) => {
              const isSelected = activeEndpoint.path === ep.path && activeEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveEndpoint(ep)}
                  className={`w-full p-3 text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#e8f1f5] border-l-4 border-l-[#2F668F]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded shrink-0 ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-800'
                        : ep.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ep.method === 'PUT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-[#16425B] block truncate">{ep.path}</span>
                    <span className="text-[11px] text-[#5A6E7F] block truncate mt-0.5">{ep.summary}</span>
                    <span className="text-[10px] text-[#8da3b5] font-mono block mt-0.5">
                      {ep.controller} · {ep.entity}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ENDPOINT INSPECTOR (RIGHT COLUMN) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#D9DBD6] shadow-sm p-6 space-y-4">
          <div className="pb-4 border-b border-[#D9DBD6]">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                  activeEndpoint.method === 'GET'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeEndpoint.method}
              </span>
              <span className="text-sm font-mono font-black text-[#16425B]">{activeEndpoint.path}</span>
            </div>
            <p className="text-xs text-[#5A6E7F]">{activeEndpoint.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
              <span className="text-[11px] font-bold text-[#5A6E7F] block">Spring Controller</span>
              <span className="text-xs font-mono font-bold text-[#16425B] mt-0.5 block">{activeEndpoint.controller}</span>
            </div>
            <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
              <span className="text-[11px] font-bold text-[#5A6E7F] block">Domain Entity</span>
              <span className="text-xs font-mono font-bold text-[#2F668F] mt-0.5 block">{activeEndpoint.entity}</span>
            </div>
            <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
              <span className="text-[11px] font-bold text-[#5A6E7F] block">Authentication</span>
              <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                {activeEndpoint.authRequired ? 'Bearer JWT Required' : 'Public Endpoint'}
              </span>
            </div>
            <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
              <span className="text-[11px] font-bold text-[#5A6E7F] block">Role Scope</span>
              <span className="text-xs font-mono font-bold text-[#16425B] mt-0.5 block">{activeEndpoint.roleScope}</span>
            </div>
          </div>

          {activeEndpoint.requestBody && (
            <div>
              <span className="text-[11px] font-mono font-bold uppercase text-[#5A6E7F] block mb-1">
                Request Payload Schema (JSON / DTO)
              </span>
              <pre className="p-3 bg-[#0f172a] text-amber-300 font-mono text-xs rounded-lg overflow-x-auto border border-[#334155]">
                {activeEndpoint.requestBody}
              </pre>
            </div>
          )}

          <div>
            <span className="text-[11px] font-mono font-bold uppercase text-[#5A6E7F] block mb-1">
              Response Payload Schema (JSON / DTO)
            </span>
            <pre className="p-3 bg-[#0f172a] text-emerald-300 font-mono text-xs rounded-lg overflow-x-auto border border-[#334155]">
              {activeEndpoint.responseBody}
            </pre>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Shield size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Security & Credential Sanitization:</strong>
              <span>
                System passwords, secret keys, and JWT salts are excluded from all API models in compliance with enterprise audit policy.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
