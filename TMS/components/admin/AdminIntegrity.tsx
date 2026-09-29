'use client';

import React, { useState, useMemo } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { normalizeCrusherName, normalizeMaterialName } from '../../lib/rates';
import {
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Truck,
  Users,
  Database,
  ArrowRight,
} from '../ui/Icons';

export interface IntegrityFinding {
  id: string;
  category: 'CUSTOMER' | 'TRIP' | 'FINANCIAL' | 'CONFIGURATION';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  entity: string;
  recordId: string;
  title: string;
  description: string;
  recommendation: string;
}

export function AdminIntegrity() {
  const store = useTmsStore();
  const { customers, trips, vehicles, drivers, invoices, payments, rates, sources, materials } = store;

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // RUN REAL LIVE DIAGNOSTICS OVER REAL DATA
  const findings: IntegrityFinding[] = useMemo(() => {
    const list: IntegrityFinding[] = [];

    // 1. CUSTOMER INTEGRITY
    // Duplicate Phone Numbers
    const phoneMap = new Map<string, string[]>();
    customers.forEach((c) => {
      const cleanPhone = (c.phone || '').trim();
      if (cleanPhone) {
        const existing = phoneMap.get(cleanPhone) || [];
        existing.push(c.id);
        phoneMap.set(cleanPhone, existing);
      }
    });
    phoneMap.forEach((ids, phone) => {
      if (ids.length > 1) {
        list.push({
          id: `CUST-DUP-PHONE-${phone}`,
          category: 'CUSTOMER',
          severity: 'WARNING',
          entity: 'Customer',
          recordId: ids.join(', '),
          title: `Duplicate Phone Number: ${phone}`,
          description: `Phone number ${phone} is shared across ${ids.length} customer records (${ids.join(', ')}). This causes billing notifications and ledger dispatch ambiguities.`,
          recommendation: 'Verify if records represent branches of the same legal entity or merge duplicate profiles.',
        });
      }
    });

    // Credit Customers Missing GSTIN
    customers.forEach((c) => {
      if ((c.creditTerms || '').toLowerCase().includes('credit') && (!c.gstin || c.gstin.trim() === '')) {
        list.push({
          id: `CUST-NO-GSTIN-${c.id}`,
          category: 'CUSTOMER',
          severity: 'INFO',
          entity: 'Customer',
          recordId: c.id,
          title: `Credit Customer Without GSTIN: ${c.name}`,
          description: `Customer ${c.name} (${c.id}) is configured with CREDIT billing terms (${c.creditTerms}) but has no GSTIN recorded.`,
          recommendation: 'Request B2B GSTIN registration certificate for tax compliance.',
        });
      }
    });

    // 2. TRIP INTEGRITY
    const customerIds = new Set(customers.map((c) => c.id));
    const vehicleNos = new Set(vehicles.map((v) => v.registration.toLowerCase()));
    const driverIds = new Set(drivers.map((d) => d.id));

    trips.forEach((t) => {
      // Missing or unlinked customer
      if (!t.customerId || !customerIds.has(t.customerId)) {
        list.push({
          id: `TRIP-ORPHAN-CUST-${t.id}`,
          category: 'TRIP',
          severity: 'CRITICAL',
          entity: 'Trip',
          recordId: t.id,
          title: `Unlinked Customer Reference: ${t.customerId || 'NONE'}`,
          description: `Trip ${t.id} references customer ID "${t.customerId}", which does not exist in the active Customer Master.`,
          recommendation: 'Reassign trip to a valid active customer record.',
        });
      }

      // Missing or unlinked vehicle
      if (!t.vehicleRegistration || !vehicleNos.has(t.vehicleRegistration.toLowerCase())) {
        list.push({
          id: `TRIP-ORPHAN-VEH-${t.id}`,
          category: 'TRIP',
          severity: 'WARNING',
          entity: 'Trip',
          recordId: t.id,
          title: `Unregistered Vehicle: ${t.vehicleRegistration || 'BLANK'}`,
          description: `Trip ${t.id} uses vehicle "${t.vehicleRegistration}", not found in registered Fleet Master.`,
          recommendation: 'Register vehicle in Fleet Master or correct the trip registration number.',
        });
      }

      // Zero or missing tonnage
      if (!t.quantity || t.quantity <= 0) {
        list.push({
          id: `TRIP-ZERO-TON-${t.id}`,
          category: 'TRIP',
          severity: 'CRITICAL',
          entity: 'Trip',
          recordId: t.id,
          title: `Zero or Missing Weight Tonnage`,
          description: `Trip ${t.id} has quantity = ${t.quantity}. Freight charges cannot be calculated.`,
          recommendation: 'Update trip record with verified weighbridge slip tonnage.',
        });
      }
    });

    // 3. FINANCIAL INTEGRITY
    // Invoices with missing customer
    invoices.forEach((inv) => {
      if (!inv.customerId || !customerIds.has(inv.customerId)) {
        list.push({
          id: `INV-ORPHAN-CUST-${inv.id}`,
          category: 'FINANCIAL',
          severity: 'CRITICAL',
          entity: 'Invoice',
          recordId: inv.id,
          title: `Orphan Invoice Without Customer`,
          description: `Invoice ${inv.id} for ₹${inv.totalAmount} references unknown customer "${inv.customerId}".`,
          recommendation: 'Re-link invoice to legitimate client account.',
        });
      }

      // Balance greater than total
      if ((inv.outstandingAmount || 0) > (inv.totalAmount || 0)) {
        list.push({
          id: `INV-OVER-BAL-${inv.id}`,
          category: 'FINANCIAL',
          severity: 'CRITICAL',
          entity: 'Invoice',
          recordId: inv.id,
          title: `Balance Due Exceeds Invoice Total`,
          description: `Invoice ${inv.id} has balance due ₹${inv.outstandingAmount} exceeding total amount ₹${inv.totalAmount}.`,
          recommendation: 'Recalculate invoice settlement ledger entries.',
        });
      }
    });

    // Payments unallocated or unlinked
    payments.forEach((p) => {
      if (!p.customerId || !customerIds.has(p.customerId)) {
        list.push({
          id: `PAY-ORPHAN-CUST-${p.id}`,
          category: 'FINANCIAL',
          severity: 'WARNING',
          entity: 'Payment',
          recordId: p.id,
          title: `Unallocated Payment Remittance`,
          description: `Payment ${p.id} of ₹${p.amount} is not tied to any known customer ledger.`,
          recommendation: 'Allocate payment voucher to customer account.',
        });
      }
    });

    // 4. CONFIGURATION INTEGRITY
    // Crusher + Material combinations without configured purchase rate
    sources.forEach((src) => {
      materials.forEach((mat) => {
        const normSrc = normalizeCrusherName(src.name);
        const normMat = normalizeMaterialName(mat.name);
        const hasRate = rates.some((r) => {
          if (r.rateType !== 'CRUSHER') return false;
          const matchSrc = r.sourceId === src.id || normalizeCrusherName(r.sourceId) === normSrc;
          const matchMat = normalizeMaterialName(r.material) === normMat;
          return matchSrc && matchMat && r.rate > 0;
        });

        if (!hasRate) {
          list.push({
            id: `RATE-MISSING-${src.id}-${mat.id}`,
            category: 'CONFIGURATION',
            severity: 'INFO',
            entity: 'ConfiguredRate',
            recordId: `${src.name} + ${mat.name}`,
            title: `Unconfigured Crusher Purchase Tariff`,
            description: `No purchase price configured for quarry "${src.name}" supplying material "${mat.name}".`,
            recommendation: 'Configure procurement tariff in Manager Rates to avoid manual worker overrides.',
          });
        }
      });
    });

    return list;
  }, [customers, trips, vehicles, drivers, invoices, payments, rates, sources, materials]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (filterCategory !== 'ALL' && f.category !== filterCategory) return false;
      if (filterSeverity !== 'ALL' && f.severity !== filterSeverity) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          f.recordId.toLowerCase().includes(query) ||
          f.title.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [findings, filterCategory, filterSeverity, searchTerm]);

  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  const warningCount = findings.filter((f) => f.severity === 'WARNING').length;
  const infoCount = findings.filter((f) => f.severity === 'INFO').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Integrity & Diagnostics Scanner"
        description="Automated heuristic scanner · Detect unlinked foreign keys, duplicate records, tariff gaps, and financial balance mismatches"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1f5] text-[#16425B] text-xs font-mono font-bold rounded-md border border-[#81C4D7]/40">
          <Activity size={14} className="text-[#2F668F]" />
          Diagnostics Engine v2.4
        </span>
      </PageHeader>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Total Scanned Checks</span>
          <span className="text-2xl font-black text-[#16425B] mt-1 block font-mono">
            {customers.length + trips.length + invoices.length + payments.length + rates.length}
          </span>
          <span className="text-[11px] text-[#5A6E7F] mt-0.5 block">Records Evaluated</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 block">Critical Violations</span>
          <span className="text-2xl font-black text-red-700 mt-1 block font-mono">{criticalCount}</span>
          <span className="text-[11px] text-red-600 mt-0.5 block">Requires immediate intervention</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">System Warnings</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block font-mono">{warningCount}</span>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Potential data quality risks</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Advisory & Config Gaps</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block font-mono">{infoCount}</span>
          <span className="text-[11px] text-blue-600 mt-0.5 block">Recommended optimizations</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6E7F]" />
          <input
            type="text"
            placeholder="Search diagnostics by record ID, title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#D9DBD6] rounded-lg text-xs focus:outline-none focus:border-[#2F668F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* CATEGORY SELECTOR */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-[#D9DBD6] rounded-lg text-xs font-bold text-[#16425B] bg-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="CUSTOMER">Customer Integrity</option>
            <option value="TRIP">Trip Integrity</option>
            <option value="FINANCIAL">Financial Integrity</option>
            <option value="CONFIGURATION">Configuration & Tariff</option>
          </select>

          {/* SEVERITY SELECTOR */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-[#D9DBD6] rounded-lg text-xs font-bold text-[#16425B] bg-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warnings Only</option>
            <option value="INFO">Advisory / Info Only</option>
          </select>
        </div>
      </div>

      {/* DIAGNOSTIC RESULTS LIST */}
      <div className="bg-white rounded-xl border border-[#D9DBD6] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#f8fafc] border-b border-[#D9DBD6] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16425B]">
            Integrity Findings ({filteredFindings.length})
          </span>
          <span className="text-xs font-mono text-[#5A6E7F]">Live verification from store memory</span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#16425B]">No Integrity Violations Found</h3>
            <p className="text-xs text-[#5A6E7F] mt-1 max-w-sm mx-auto">
              All scanned entities comply with relational constraints, rate configurations, and financial invariants.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf2f7]">
            {filteredFindings.map((finding) => (
              <div key={finding.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : finding.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {finding.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#16425B]">
                      {finding.entity} → {finding.recordId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8da3b5]">{finding.id}</span>
                </div>

                <h4 className="text-xs font-bold text-[#16425B] mt-2">{finding.title}</h4>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">{finding.description}</p>

                <div className="mt-2.5 p-2.5 bg-[#f8fafc] rounded-md border border-[#e2e8f0] flex items-center gap-2 text-[11px] text-[#2F668F]">
                  <strong className="shrink-0 font-bold">Resolution Action:</strong>
                  <span>{finding.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
