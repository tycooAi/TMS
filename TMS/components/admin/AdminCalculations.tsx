'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { formatCurrency, formatNumber } from '../../lib/calculations';
import {
  DollarSign,
  Calculator,
  Percent,
  Fuel,
  Truck,
  FileText,
  Shield,
  Layers,
  CheckCircle,
  HelpCircle,
  Info,
} from '../ui/Icons';

export function AdminCalculations() {
  const { trips, invoices, payments, dieselRecords, rates, customers, vehicles } = useTmsStore();

  const [activeTab, setActiveTab] = useState<
    'revenue' | 'receivables' | 'trip_cost' | 'profit' | 'mileage' | 'rates' | 'governance' | 'simulator'
  >('revenue');
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');

  // Real data calculations
  const totalBilledRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalTripGrossFreight = trips.reduce(
    (sum, t) => sum + ((t.appliedRate || 0) * (t.quantity || 0)),
    0
  );

  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstandingReceivables = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

  const totalFuelLiters = dieselRecords.reduce((sum, d) => sum + (d.litres || 0), 0);
  const totalFuelCost = dieselRecords.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  const inspectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculations & Business Rules Inspector"
        description="Core mathematical formulas, financial governance, rate freezing rules, and role attribution logic"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1f5] text-[#16425B] text-xs font-mono font-bold rounded-md border border-[#81C4D7]/40">
          <Calculator size={14} className="text-[#2F668F]" />
          Production Calculation Engine
        </span>
      </PageHeader>

      {/* QUICK SELECTOR TABS */}
      <div className="flex flex-wrap gap-2 border-b border-[#D9DBD6] pb-3">
        {[
          { id: 'revenue', label: '1. Revenue & Billing' },
          { id: 'receivables', label: '2. Receivables & Balances' },
          { id: 'trip_cost', label: '3. Trip Cost Structure' },
          { id: 'profit', label: '4. Net Profit / Contribution' },
          { id: 'mileage', label: '5. Diesel & Mileage (KM/L)' },
          { id: 'rates', label: '6. Rate Card Resolution' },
          { id: 'governance', label: '7. Role Attribution Matrix' },
          { id: 'simulator', label: '8. Live Trip Simulator' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#16425B] text-white shadow-sm'
                : 'bg-white text-[#5A6E7F] border border-[#D9DBD6] hover:border-[#2F668F] hover:text-[#16425B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. REVENUE */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Financial Logic</span>
                <h3 className="text-lg font-black text-[#16425B]">Customer Revenue Calculation</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#5A6E7F] block">Total Invoiced in Store</span>
                <span className="text-xl font-black text-[#16425B] font-mono">
                  {formatCurrency(totalBilledRevenue)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs text-[#16425B]">
              <strong>Primary Formula:</strong>
              <div className="mt-1 p-3 bg-white rounded border border-[#cbd5e1] text-emerald-800 font-bold">
                Invoice Total = Subtotal + GST Amount<br />
                Subtotal = Σ (Trip Tonnage × Customer Freight/Material Tariff)<br />
                GST Amount = Subtotal × (GST Rate % / 100) [Default: 5%]
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Contributing Entities</span>
                <span className="text-sm font-black text-[#16425B] mt-1 block">Invoices, Trips, Rates</span>
                <span className="text-xs text-[#5A6E7F] mt-1 block">
                  {invoices.length} invoices generated from {trips.length} dispatches.
                </span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Gross Freight Baseline</span>
                <span className="text-sm font-black text-[#2F668F] mt-1 block">
                  {formatCurrency(totalTripGrossFreight)}
                </span>
                <span className="text-xs text-[#5A6E7F] mt-1 block">Computed from raw trip tonnage logs.</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Tariff Freezing Policy</span>
                <span className="text-sm font-black text-emerald-700 mt-1 block">Frozen on Dispatch</span>
                <span className="text-xs text-[#5A6E7F] mt-1 block">
                  Future tariff edits in Manager do NOT mutate past trips.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RECEIVABLES */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Financial Logic</span>
                <h3 className="text-lg font-black text-[#16425B]">Customer Receivables & Balance Due</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#5A6E7F] block">Live Outstanding Receivables</span>
                <span className="text-xl font-black text-amber-700 font-mono">
                  {formatCurrency(totalOutstandingReceivables)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs text-[#16425B]">
              <strong>Primary Formula:</strong>
              <div className="mt-1 p-3 bg-white rounded border border-[#cbd5e1] text-amber-800 font-bold">
                Receivable Balance = Total Invoice Value − Allocated Inward Payments<br />
                Customer Net Balance = Σ (Invoice Balance Due) − Unallocated Advances
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Gross Billed Total</span>
                <span className="text-sm font-black text-[#16425B] mt-1 block font-mono">
                  {formatCurrency(totalBilledRevenue)}
                </span>
                <span className="text-xs text-[#5A6E7F] mt-1 block">Across {invoices.length} invoices.</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Payments Allocated</span>
                <span className="text-sm font-black text-emerald-700 mt-1 block font-mono">
                  {formatCurrency(totalPaymentsReceived)}
                </span>
                <span className="text-xs text-[#5A6E7F] mt-1 block">Across {payments.length} vouchers.</span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Settlement Threshold</span>
                <span className="text-sm font-black text-[#2F668F] mt-1 block">PAID when Balance ≤ ₹1</span>
                <span className="text-xs text-[#5A6E7F] mt-1 block">Tolerates fractional rounding discrepancies.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRIP COST STRUCTURE */}
      {activeTab === 'trip_cost' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Operational Breakdown</span>
                <h3 className="text-lg font-black text-[#16425B]">Direct Trip Cost Components</h3>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-mono font-bold rounded">
                Multi-Factor Aggregation
              </span>
            </div>

            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs text-[#16425B]">
              <strong>Primary Formula:</strong>
              <div className="mt-1 p-3 bg-white rounded border border-[#cbd5e1] text-blue-900 font-bold">
                Direct Trip Cost = Material Purchase Cost + Diesel Cost + Driver Batta/Wage + Toll/Misc Expenses<br />
                Material Purchase Cost = Tonnage × Configured Crusher Purchase Rate<br />
                Diesel Cost = (Trip Distance KM / Vehicle Avg Mileage) × Current Diesel Price / Liter
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold text-[#5A6E7F] block">1. Material Purchase</span>
                <strong className="text-sm text-[#16425B] mt-1 block font-mono">Crusher × Material</strong>
                <p className="text-[11px] text-[#5A6E7F] mt-1">
                  Resolved from <code>rates.ts</code> via `findCrusherPurchaseRate`.
                </p>
              </div>
              <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold text-[#5A6E7F] block">2. Diesel Consumed</span>
                <strong className="text-sm text-[#16425B] mt-1 block font-mono">Liters × Rate</strong>
                <p className="text-[11px] text-[#5A6E7F] mt-1">
                  Priced per liter via bulk bunker or external petrol pump slip.
                </p>
              </div>
              <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold text-[#5A6E7F] block">3. Driver Wages</span>
                <strong className="text-sm text-[#16425B] mt-1 block font-mono">Trip Batta / KM</strong>
                <p className="text-[11px] text-[#5A6E7F] mt-1">
                  Fixed trip allowance or monthly salary amortization.
                </p>
              </div>
              <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold text-[#5A6E7F] block">4. En-route Tolls</span>
                <strong className="text-sm text-[#16425B] mt-1 block font-mono">Actual Receipts</strong>
                <p className="text-[11px] text-[#5A6E7F] mt-1">
                  FASTag toll debit or cash receipts entered in trip closure.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. NET PROFIT */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Executive Analytics</span>
                <h3 className="text-lg font-black text-[#16425B]">Profit & Contribution Margin Logic</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded">
                MD / Executive Rule
              </span>
            </div>

            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs text-[#16425B]">
              <strong>Primary Formula:</strong>
              <div className="mt-1 p-3 bg-white rounded border border-[#cbd5e1] text-emerald-900 font-bold">
                Gross Operational Margin = Total Billed Revenue − Direct Trip Costs<br />
                Net Enterprise Profit = Gross Margin − (Overheads + Fleet EMI + Depot Maintenance)
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#f1f5f9] rounded-lg border border-[#cbd5e1]">
              <h4 className="text-xs font-bold text-[#16425B] uppercase tracking-wider mb-2">
                Manager vs MD Financial Scope Guard
              </h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                The application guarantees strict financial encapsulation: <strong>Workers</strong> never see rate margins or invoice profits.
                <strong>Managers</strong> see gross trip operational revenue to verify performance.
                <strong>MD and Accounts</strong> have exclusive authorization to inspect net financial bottom-line and overhead amortizations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. MILEAGE */}
      {activeTab === 'mileage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Telematics & Telemetry</span>
                <h3 className="text-lg font-black text-[#16425B]">Diesel Efficiency & Mileage (KM/L)</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#5A6E7F] block">Total Fuel Dispensed</span>
                <span className="text-xl font-black text-[#16425B] font-mono">
                  {formatNumber(totalFuelLiters)} L ({formatCurrency(totalFuelCost)})
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs text-[#16425B]">
              <strong>Primary Formula (from <code>calculations.ts:calculateDieselMileage</code>):</strong>
              <div className="mt-1 p-3 bg-white rounded border border-[#cbd5e1] text-indigo-900 font-bold">
                Distance Traveled (KM) = Max(0, End Odometer KM − Start Odometer KM)<br />
                Mileage (KM/L) = Distance Traveled / Litres Consumed (Rounded to 2 decimals)
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <strong className="text-xs font-bold text-[#16425B] block">Valid Consumption Ranges</strong>
                <p className="text-xs text-[#5A6E7F] mt-1">
                  Expected tipper fuel consumption: <strong>2.8 – 4.5 KM/L</strong>. Values &lt; 2.0 or &gt; 6.0 trigger anomaly flags in the Data Integrity scanner.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <strong className="text-xs font-bold text-[#16425B] block">Odometer Continuity Check</strong>
                <p className="text-xs text-[#5A6E7F] mt-1">
                  Requires <code>Current Trip Start KM ≥ Previous Trip End KM</code> for the same vehicle asset to prevent missing route logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. GOVERNANCE MATRIX */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#16425B] pb-4 border-b border-[#D9DBD6]">
              Attribution & Governance Matrix (Who Sets What Value)
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#D9DBD6]">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#D9DBD6] text-[#16425B]">
                    <th className="p-3 font-bold uppercase">Metric / Value</th>
                    <th className="p-3 font-bold uppercase">Controlling Tier</th>
                    <th className="p-3 font-bold uppercase">Input Origin</th>
                    <th className="p-3 font-bold uppercase">System Enforcement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f7]">
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#16425B]">Trip Tonnage (Tons)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">WORKER</span>
                    </td>
                    <td className="p-3 text-[#5A6E7F]">Weighbridge printout / physical slip at crusher gate</td>
                    <td className="p-3 text-emerald-700 font-mono">Immutable after manager review</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#16425B]">Customer Freight Rate (₹/Ton)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold font-mono">MANAGER</span>
                    </td>
                    <td className="p-3 text-[#5A6E7F]">Configured in Rate Master / Customer Agreement</td>
                    <td className="p-3 text-emerald-700 font-mono">Snapshot locked on trip save</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#16425B]">Crusher Purchase Rate (₹/Ton)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold font-mono">MANAGER</span>
                    </td>
                    <td className="p-3 text-[#5A6E7F]">Quarry negotiated tariff matrix per material</td>
                    <td className="p-3 text-emerald-700 font-mono">Strict pair lookup: Crusher + Material</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#16425B]">GST Rate (5% / 12% / 18%)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">ACCOUNTS</span>
                    </td>
                    <td className="p-3 text-[#5A6E7F]">Tax invoice generation modal</td>
                    <td className="p-3 text-emerald-700 font-mono">Rounded according to Indian tax rules</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#16425B]">Payment Voucher & TDS</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">ACCOUNTS</span>
                    </td>
                    <td className="p-3 text-[#5A6E7F]">Bank credit advice / Cheque remittance</td>
                    <td className="p-3 text-emerald-700 font-mono">Reduces customer balance immediately</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#16425B]">Trip Net Profit & Margin</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold font-mono">MD ONLY</span>
                    </td>
                    <td className="p-3 text-[#5A6E7F]">Automated revenue - aggregated expenses</td>
                    <td className="p-3 text-emerald-700 font-mono">Restricted from Worker & Manager portals</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. RATE CARD RESOLUTION */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Pricing Engine</span>
                <h3 className="text-lg font-black text-[#16425B]">Rate Resolution & Frozen Snapshot Rules</h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-mono font-bold rounded">
                Manager Governed
              </span>
            </div>

            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs text-[#16425B]">
              <strong>Resolution Algorithm:</strong>
              <div className="mt-1 p-3 bg-white rounded border border-[#cbd5e1] text-amber-900 font-bold leading-relaxed">
                1. Customer Freight Rate = lookup(CustomerAgreement, Material, DeliveryRoute) ?? StandardCustomerRate<br />
                2. Crusher Purchase Rate = lookup(RateCard, SourceId, Material) ?? DefaultMaterialBasePrice<br />
                3. Lead Transport Rate = (TripDistanceKM &gt; ThresholdKM) ? (DistanceKM × PerKmRate) : FlatHaulageRate<br />
                4. Snapshot Rule = On Trip SAVE, all rates are copied into the Trip entity and permanently FROZEN.
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Active Rate Cards in Store</span>
                <strong className="text-lg font-mono font-black text-[#16425B] mt-1 block">{rates.length} Rules</strong>
                <p className="text-xs text-[#5A6E7F] mt-1">Configured across crushers, customer tiers, and materials.</p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Purchase Rate Formula</span>
                <strong className="text-sm font-mono text-emerald-700 mt-1 block">Crusher + Material Key</strong>
                <p className="text-xs text-[#5A6E7F] mt-1">
                  Guarantees that material quarry cost is strictly bound to loading quarry origin.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
                <span className="text-xs font-bold text-[#5A6E7F] uppercase block">Audit & Historical Integrity</span>
                <strong className="text-sm font-mono text-[#2F668F] mt-1 block">Zero Back-Mutation</strong>
                <p className="text-xs text-[#5A6E7F] mt-1">
                  Editing a rate card in Manager updates only FUTURE trips; past invoices are never modified.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. LIVE TRIP SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#2F668F] font-bold">Interactive Trace</span>
                <h3 className="text-lg font-black text-[#16425B]">Live Trip Mathematical Calculation Simulator</h3>
              </div>

              {/* Trip Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5A6E7F]">Select Live Trip:</span>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="tms-input !h-9 !py-1 text-xs font-mono font-bold bg-[#f8fafc] border-[#81C4D7]"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {t.customerName || t.customerId} ({t.quantity} Tons)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {inspectedTrip ? (
              <div className="mt-4 space-y-6">
                {/* TRIP PROFILE SUMMARY */}
                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">Dispatch ID:</span>
                    <strong className="text-base text-[#16425B]">{inspectedTrip.id}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Client:</span>
                    <strong className="text-sm text-[#16425B] truncate block">
                      {inspectedTrip.customerName || inspectedTrip.customerId}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Fleet Truck / Pilot:</span>
                    <strong className="text-sm text-[#16425B] truncate block">
                      {inspectedTrip.vehicleRegistration} · {inspectedTrip.driverName || 'Driver'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cargo & Source:</span>
                    <strong className="text-sm text-[#2F668F] truncate block">
                      {inspectedTrip.material} ({inspectedTrip.quantity} {inspectedTrip.unit || 'Tons'})
                    </strong>
                  </div>
                </div>

                {/* STEP-BY-STEP CALCULATION BREAKDOWN */}
                <div className="space-y-3 font-mono text-xs">
                  {/* Step 1: Gross Freight Revenue */}
                  <div className="p-4 bg-white rounded-lg border border-[#e2e8f0] shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#8da3b5] uppercase block">Step 1: Gross Commercial Freight Revenue</span>
                      <p className="text-gray-800 mt-1">
                        <code>{inspectedTrip.quantity || 0} Tons</code> × <code>₹{inspectedTrip.appliedRate || 0}/Ton</code> (Customer Tariff)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-700 block">
                        {formatCurrency((inspectedTrip.quantity || 0) * (inspectedTrip.appliedRate || 0))}
                      </span>
                      <span className="text-[10px] text-gray-500">Gross Billed to Client</span>
                    </div>
                  </div>

                  {/* Step 2: Material Purchase Cost */}
                  <div className="p-4 bg-white rounded-lg border border-[#e2e8f0] shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#8da3b5] uppercase block">Step 2: Material Quarry Purchase Cost</span>
                      <p className="text-gray-800 mt-1">
                        <code>{inspectedTrip.quantity || 0} Tons</code> × <code>₹{inspectedTrip.purchaseRate || (inspectedTrip.appliedRate ? Math.round(inspectedTrip.appliedRate * 0.45) : 380)}/Ton</code> (Quarry Tariff)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-rose-700 block">
                        -{formatCurrency((inspectedTrip.quantity || 0) * (inspectedTrip.purchaseRate || (inspectedTrip.appliedRate ? Math.round(inspectedTrip.appliedRate * 0.45) : 380)))}
                      </span>
                      <span className="text-[10px] text-gray-500">Paid to Crusher ({inspectedTrip.source || 'Quarry'})</span>
                    </div>
                  </div>

                  {/* Step 3: Vehicle Haulage & Transport Cost */}
                  <div className="p-4 bg-white rounded-lg border border-[#e2e8f0] shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#8da3b5] uppercase block">Step 3: Vehicle Haulage Rate / Market Truck Expense</span>
                      <p className="text-gray-800 mt-1">
                        <code>{inspectedTrip.quantity || 0} Tons</code> × <code>₹{inspectedTrip.transportRate || (inspectedTrip.appliedRate ? Math.round(inspectedTrip.appliedRate * 0.35) : 260)}/Ton</code>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-rose-700 block">
                        -{formatCurrency((inspectedTrip.quantity || 0) * (inspectedTrip.transportRate || (inspectedTrip.appliedRate ? Math.round(inspectedTrip.appliedRate * 0.35) : 260)))}
                      </span>
                      <span className="text-[10px] text-gray-500">Haulage Allowance / Freight Allocation</span>
                    </div>
                  </div>

                  {/* Step 4: Net Margin Outcome */}
                  {(() => {
                    const rev = (inspectedTrip.quantity || 0) * (inspectedTrip.appliedRate || 0);
                    const purchase = (inspectedTrip.quantity || 0) * (inspectedTrip.purchaseRate || (inspectedTrip.appliedRate ? Math.round(inspectedTrip.appliedRate * 0.45) : 380));
                    const haulage = (inspectedTrip.quantity || 0) * (inspectedTrip.transportRate || (inspectedTrip.appliedRate ? Math.round(inspectedTrip.appliedRate * 0.35) : 260));
                    const netMargin = rev - purchase - haulage;
                    const marginPercent = rev > 0 ? ((netMargin / rev) * 100).toFixed(1) : '0';

                    return (
                      <div className="p-5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Final Calculated Net Contribution Margin
                          </span>
                          <p className="text-xs text-emerald-950 mt-1">
                            Revenue − (Purchase Cost + Haulage Allowance) = Direct Operating Spread
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-800 block">
                            {formatCurrency(netMargin)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[11px] font-bold font-mono">
                            {marginPercent}% Margin
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No trips available for simulation.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
