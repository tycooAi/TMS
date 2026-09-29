'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import {
  Database,
  Layers,
  Network,
  Truck,
  Users,
  FileText,
  DollarSign,
  Fuel,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle,
} from '../ui/Icons';

interface EntityNode {
  id: string;
  name: string;
  category: 'operational' | 'master' | 'financial' | 'governance';
  description: string;
  storeKey: string;
  primaryKey: string;
  outgoing: { target: string; fk: string; cardinality: string; description: string }[];
  incoming: { source: string; fk: string; cardinality: string; description: string }[];
}

const ENTITY_RELATIONSHIPS: EntityNode[] = [
  {
    id: 'Trip',
    name: 'Trip (Dispatch Execution)',
    category: 'operational',
    description: 'Central operational dispatch connecting materials, logistics assets, and financial billing.',
    storeKey: 'trips',
    primaryKey: 'id (e.g. TRP-0001)',
    outgoing: [
      { target: 'Customer', fk: 'customerId', cardinality: 'N : 1', description: 'Billable client receiving delivery' },
      { target: 'Vehicle', fk: 'vehicleNo', cardinality: 'N : 1', description: 'Fleet vehicle carrying tonnage' },
      { target: 'Driver', fk: 'driverId', cardinality: 'N : 1', description: 'Assigned pilot/driver' },
      { target: 'Material', fk: 'material', cardinality: 'N : 1', description: 'Aggregates/sand carried' },
      { target: 'Source', fk: 'sourceId / sourceName', cardinality: 'N : 1', description: 'Crusher/quarry loading origin' },
      { target: 'Invoice', fk: 'invoiceId', cardinality: 'N : 1 (Nullable)', description: 'Downstream tax invoice' },
    ],
    incoming: [
      { source: 'Worker', fk: 'recordedBy', cardinality: '1 : N', description: 'Created by worker on-site' },
      { source: 'AuditLog', fk: 'recordId', cardinality: '1 : N', description: 'Lifecycle mutation audits' },
    ],
  },
  {
    id: 'Customer',
    name: 'Customer (Commercial Partner)',
    category: 'master',
    description: 'Client account receiving transport consignments under cash or credit billing terms.',
    storeKey: 'customers',
    primaryKey: 'id (e.g. CUST-001)',
    outgoing: [],
    incoming: [
      { source: 'Trip', fk: 'customerId', cardinality: '1 : N', description: 'Consignment deliveries' },
      { source: 'Invoice', fk: 'customerId', cardinality: '1 : N', description: 'Billed receivables invoices' },
      { source: 'Payment', fk: 'customerId', cardinality: '1 : N', description: 'Remittances and bank settlements' },
    ],
  },
  {
    id: 'Vehicle',
    name: 'Vehicle (Fleet Asset)',
    category: 'master',
    description: 'Company-owned or leased tipper / truck carrying tonnage across quarry-to-site routes.',
    storeKey: 'vehicles',
    primaryKey: 'vehicleNo (e.g. TN-38-AB-1234)',
    outgoing: [],
    incoming: [
      { source: 'Trip', fk: 'vehicleNo', cardinality: '1 : N', description: 'Dispatches performed' },
      { source: 'DieselRecord', fk: 'vehicleNo', cardinality: '1 : N', description: 'Fuel bunker / pump fill logs' },
      { source: 'VehicleExpense', fk: 'vehicleNo', cardinality: '1 : N', description: 'Maintenance, tyre, insurance costs' },
    ],
  },
  {
    id: 'Driver',
    name: 'Driver (Logistics Pilot)',
    category: 'master',
    description: 'Licensed professional operator driving fleet vehicles.',
    storeKey: 'drivers',
    primaryKey: 'id (e.g. DRV-001)',
    outgoing: [],
    incoming: [
      { source: 'Trip', fk: 'driverId', cardinality: '1 : N', description: 'Trips completed' },
      { source: 'WorkerWage', fk: 'driverId', cardinality: '1 : N', description: 'Batta, trip incentive, or wage settlements' },
    ],
  },
  {
    id: 'Source',
    name: 'Source / Crusher (Quarry)',
    category: 'master',
    description: 'Crusher, gravel pit, or river quarry supplying minerals and raw materials.',
    storeKey: 'sources',
    primaryKey: 'id (e.g. SRC-001)',
    outgoing: [],
    incoming: [
      { source: 'Trip', fk: 'sourceId / sourceName', cardinality: '1 : N', description: 'Origin load point' },
      { source: 'ConfiguredRate', fk: 'sourceId', cardinality: '1 : N', description: 'Crusher + Material purchase tariffs' },
    ],
  },
  {
    id: 'Invoice',
    name: 'Invoice (Receivable Document)',
    category: 'financial',
    description: 'Tax and operational invoice generated from trip dispatches billed to customers.',
    storeKey: 'invoices',
    primaryKey: 'id (e.g. INV-001)',
    outgoing: [
      { target: 'Customer', fk: 'customerId', cardinality: 'N : 1', description: 'Customer receiving bill' },
    ],
    incoming: [
      { source: 'Trip', fk: 'invoiceId', cardinality: '1 : N', description: 'Trips consolidated into this invoice' },
      { source: 'PaymentAllocation', fk: 'invoiceId', cardinality: '1 : N', description: 'Payments applied to reduce balance' },
    ],
  },
  {
    id: 'Payment',
    name: 'Payment (Cash / Bank Voucher)',
    category: 'financial',
    description: 'Inward cash, NEFT, RTGS or cheque settlement received against customer receivables.',
    storeKey: 'payments',
    primaryKey: 'id (e.g. PAY-001)',
    outgoing: [
      { target: 'Customer', fk: 'customerId', cardinality: 'N : 1', description: 'Remitting customer' },
      { target: 'CashBankAccount', fk: 'accountId', cardinality: 'N : 1', description: 'Destination bank or cash drawer' },
    ],
    incoming: [
      { source: 'FinancialTransaction', fk: 'referenceId', cardinality: '1 : 1', description: 'Ledger debit/credit post' },
    ],
  },
  {
    id: 'DieselRecord',
    name: 'Diesel (Fuel Log)',
    category: 'operational',
    description: 'Fuel consumption entry tracking liters, rate, bunk/pump, and odometer mileage.',
    storeKey: 'dieselRecords',
    primaryKey: 'id (e.g. DSL-001)',
    outgoing: [
      { target: 'Vehicle', fk: 'vehicleNo', cardinality: 'N : 1', description: 'Refueled fleet truck' },
      { target: 'CashBankAccount', fk: 'paymentAccountId', cardinality: 'N : 1 (Nullable)', description: 'Funding source' },
    ],
    incoming: [
      { source: 'VehicleExpense', fk: 'dieselRecordId', cardinality: '1 : 1', description: 'Operational cost aggregation' },
    ],
  },
  {
    id: 'AuditLog',
    name: 'Audit Log (System Journal)',
    category: 'governance',
    description: 'Immutable forensic trail recording all mutations, actor roles, entity IDs and diff payloads.',
    storeKey: 'auditLogs',
    primaryKey: 'id (e.g. AUD-001)',
    outgoing: [],
    incoming: [
      { source: 'All Modules', fk: 'entityId + module', cardinality: '1 : N', description: 'Cross-system telemetry' },
    ],
  },
];

export function AdminEntities() {
  const store = useTmsStore();
  const [selectedEntityId, setSelectedEntityId] = useState<string>('Trip');

  const selectedNode = ENTITY_RELATIONSHIPS.find((e) => e.id === selectedEntityId) || ENTITY_RELATIONSHIPS[0];

  const getRecordCount = (storeKey: string): number => {
    const list = (store as Record<string, unknown>)[storeKey];
    return Array.isArray(list) ? list.length : 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity & Data Model Explorer"
        description="System relational architecture · Inspect foreign key connections, cardinalities, downstream cascades, and live store counts"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1f5] text-[#16425B] text-xs font-mono font-bold rounded-md border border-[#81C4D7]/40">
          <Network size={14} className="text-[#2F668F]" />
          Relational Graph Active
        </span>
      </PageHeader>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Defined Models</span>
          <span className="text-2xl font-black text-[#16425B] mt-1 block">{ENTITY_RELATIONSHIPS.length}</span>
          <span className="text-[11px] text-[#5A6E7F] mt-0.5 block">Entities in Schema</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Central Hub</span>
          <span className="text-lg font-black text-[#2F668F] mt-1 block truncate">Trip (Dispatch)</span>
          <span className="text-[11px] text-[#5A6E7F] mt-0.5 block">6 Outgoing FKs</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Financial Backbone</span>
          <span className="text-lg font-black text-emerald-700 mt-1 block truncate">Invoice & Payment</span>
          <span className="text-[11px] text-[#5A6E7F] mt-0.5 block">Ledger Reconciliation</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Forensic Coverage</span>
          <span className="text-lg font-black text-indigo-700 mt-1 block truncate">Immutable Audit</span>
          <span className="text-[11px] text-[#5A6E7F] mt-0.5 block">100% Mutation Intercept</span>
        </div>
      </div>

      {/* INTERACTIVE GRAPH EXPLORER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ENTITY LIST (LEFT COLUMN) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#D9DBD6] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-[#f8fafc] border-b border-[#D9DBD6] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16425B]">Application Entities</span>
            <span className="text-[11px] font-mono text-[#5A6E7F]">Select to inspect</span>
          </div>
          <div className="divide-y divide-[#edf2f7] overflow-y-auto max-h-[640px]">
            {ENTITY_RELATIONSHIPS.map((node) => {
              const isSelected = node.id === selectedEntityId;
              const count = getRecordCount(node.storeKey);
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedEntityId(node.id)}
                  className={`w-full p-3.5 text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#e8f1f5] border-l-4 border-l-[#2F668F] font-bold text-[#16425B]'
                      : 'hover:bg-slate-50 text-[#334155]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#16425B] truncate">{node.id}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          node.category === 'operational'
                            ? 'bg-blue-100 text-blue-800'
                            : node.category === 'master'
                            ? 'bg-amber-100 text-amber-800'
                            : node.category === 'financial'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {node.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6E7F] truncate mt-0.5">{node.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#2F668F] block">{count}</span>
                    <span className="text-[10px] text-[#8da3b5]">records</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ENTITY RELATIONSHIP VIEWER (RIGHT COLUMN) */}
        <div className="lg:col-span-8 space-y-6">
          {/* FOCUSED ENTITY DETAIL CARD */}
          <div className="bg-white rounded-xl border border-[#D9DBD6] shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D9DBD6]">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-[#16425B] font-mono">{selectedNode.name}</h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f1f5f9] text-[#475569] font-bold">
                    PK: {selectedNode.primaryKey}
                  </span>
                </div>
                <p className="text-xs text-[#5A6E7F] mt-1">{selectedNode.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#5A6E7F] block">Live Store Records</span>
                <span className="text-2xl font-black text-[#2F668F] font-mono">
                  {getRecordCount(selectedNode.storeKey)}
                </span>
              </div>
            </div>

            {/* VISUAL DIAGRAM CANVAS */}
            <div className="mt-6 p-6 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748b] block mb-4">
                Entity Relationship Diagram (ERD Context)
              </span>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* INCOMING RELATIONSHIPS */}
                <div className="w-full md:w-5/12 space-y-2">
                  <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wide block">
                    Incoming Parent References ({selectedNode.incoming.length})
                  </span>
                  {selectedNode.incoming.length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-dashed border-[#cbd5e1] text-xs text-[#94a3b8] italic text-center">
                      No incoming foreign keys (Root/Master entity)
                    </div>
                  ) : (
                    selectedNode.incoming.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-[#e2e8f0] shadow-2xs hover:border-[#2F668F] transition-all cursor-pointer"
                        onClick={() => setSelectedEntityId(rel.source)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#16425B] font-mono">{rel.source}</span>
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                            {rel.cardinality}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748b] mt-1 flex items-center gap-1 font-mono">
                          <span>FK: {rel.fk}</span>
                        </div>
                        <span className="text-[10px] text-[#94a3b8] block mt-0.5">{rel.description}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* CENTRAL ACTIVE NODE */}
                <div className="w-full md:w-2/12 flex flex-col items-center justify-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#16425B] text-white flex items-center justify-center shadow-lg border-2 border-[#81C4D7]">
                    <Database size={24} />
                  </div>
                  <span className="text-xs font-black text-[#16425B] mt-2 font-mono">{selectedNode.id}</span>
                  <span className="text-[10px] font-mono text-[#5A6E7F]">Target Model</span>
                </div>

                {/* OUTGOING RELATIONSHIPS */}
                <div className="w-full md:w-5/12 space-y-2">
                  <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wide block">
                    Outgoing Foreign References ({selectedNode.outgoing.length})
                  </span>
                  {selectedNode.outgoing.length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-dashed border-[#cbd5e1] text-xs text-[#94a3b8] italic text-center">
                      No outgoing foreign keys (Independent master node)
                    </div>
                  ) : (
                    selectedNode.outgoing.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-[#e2e8f0] shadow-2xs hover:border-[#2F668F] transition-all cursor-pointer"
                        onClick={() => setSelectedEntityId(rel.target)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#16425B] font-mono">{rel.target}</span>
                          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                            {rel.cardinality}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748b] mt-1 flex items-center gap-1 font-mono">
                          <span>FK: {rel.fk}</span>
                        </div>
                        <span className="text-[10px] text-[#94a3b8] block mt-0.5">{rel.description}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RELATIONAL INTEGRITY RULES */}
            <div className="mt-6 border-t border-[#D9DBD6] pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#16425B] mb-2">
                Foreign Key Constraints & Cascade Policy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <strong className="text-[#16425B] block font-mono">On Delete Cascade: RESTRICT</strong>
                  <p className="text-[11px] text-[#5A6E7F] mt-1">
                    Customers, Vehicles, or Drivers with referenced Trips or Invoices cannot be hard-deleted to preserve financial audits.
                  </p>
                </div>
                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <strong className="text-[#16425B] block font-mono">Rate Freezing at Dispatch</strong>
                  <p className="text-[11px] text-[#5A6E7F] mt-1">
                    Trip captures snapshot of operational tariffs (`freightRate`, `crusherRate`) at dispatch moment to ensure rate immutability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
