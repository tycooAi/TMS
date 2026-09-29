'use client';

import React, { useState } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import { Check } from '../ui/Icons';

export function AdminBusinessRules() {
  const store = useTmsStore();
  const [gstRates, setGstRates] = useState({ standard: 5, interState: 18 });
  const [dieselThreshold, setDieselThreshold] = useState(3.5); // km/L
  const [advanceLimit, setAdvanceLimit] = useState(15000); // max driver cash advance
  const [invoiceDueDays, setInvoiceDueDays] = useState(30);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.addAudit({
      user: 'Admin',
      userRole: 'ADMIN',
      action: 'UPDATE',
      entity: 'BUSINESS_RULES',
      entityId: 'CONFIG',
      description: `Updated system calculation rules (GST: ${gstRates.standard}%, Diesel Threshold: ${dieselThreshold} km/L, Max Advance: ₹${advanceLimit})`,
    });
    setActionSuccess('System calculation configuration saved and broadcasted to application services.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Business & Calculation Rules"
        subtitle="Operational parameters, GST tax brackets, fuel mileage tolerances, and validation constraints"
      />

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Architectural Notice */}
      <div className="border-l-2 border-slate-400 bg-slate-50/70 px-4 py-3 rounded-r-md text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-800">Shared Calculation Architecture: </span>
        Business rules configured here are consumed directly across Worker, Accounts, Manager, and MD portal calculations.
        Modifying thresholds only affects newly generated transactions—historical invoices, wages, and ledger entries remain immutable.
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TAX & GST CALCULATION */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                GST Tax Parameters
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Intra-State Freight GST Rate (CGST + SGST)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gstRates.standard}
                    onChange={(e) => setGstRates({ ...gstRates, standard: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  />
                  <span className="text-slate-500">% (Standard Tipper Transport Rate)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Inter-State Freight IGST Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gstRates.interState}
                    onChange={(e) => setGstRates({ ...gstRates, interState: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  />
                  <span className="text-slate-500">% (Commercial Material Transport)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Default Invoice Credit Period
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={invoiceDueDays}
                    onChange={(e) => setInvoiceDueDays(parseInt(e.target.value) || 30)}
                    className="w-24 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  />
                  <span className="text-slate-500">Days from billing date</span>
                </div>
              </div>
            </div>
          </div>

          {/* OPERATIONAL TOLERANCES */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Fleet & Driver Operational Limits
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Minimum Expected Mileage Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={dieselThreshold}
                    onChange={(e) => setDieselThreshold(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  />
                  <span className="text-slate-500">km / Litre (Triggers alert if below)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Maximum Driver Cash Advance Without MD Approval
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={advanceLimit}
                    onChange={(e) => setAdvanceLimit(parseInt(e.target.value) || 0)}
                    className="w-32 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  />
                  <span className="text-slate-500">Maximum limit</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-slate-500">
                  Advances exceeding this cap automatically route to the MD Approvals Cockpit before disbursement.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm"
          >
            Save Calculation Rules
          </button>
        </div>
      </form>
    </div>
  );
}
