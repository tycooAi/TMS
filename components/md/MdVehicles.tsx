'use client';

import React from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';

export function MdVehicles() {
  const { vehicles, vehicleExpenses, dieselRecords } = useTmsStore();

  return (
    <div>
      <PageHeader
        title="Fleet Assets & Maintenance Economics"
        description="Executive fleet overview · Ownership breakdown, cumulative maintenance, and compliance"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Owned Tippers
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {vehicles.filter((v) => v.ownership === 'OWN').length} Trucks
          </strong>
          <span className="text-xs text-[#5A6E7F]">Company capital assets</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Rented / Attached Fleet
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {vehicles.filter((v) => v.ownership === 'RENTED').length} Trucks
          </strong>
          <span className="text-xs text-[#5A6E7F]">Contractor logistics</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Fleet Maintenance Load
          </span>
          <strong className="text-2xl font-bold text-rose-700 block my-1">
            {formatCurrency(vehicleExpenses.reduce((sum, e) => sum + e.amount, 0))}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Garage, spares and tyre costs</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Type</th>
                <th>Ownership</th>
                <th>Payload Capacity</th>
                <th>Odometer KM</th>
                <th>Assigned Driver</th>
                <th>Fitness (FC) Expiry</th>
                <th>Insurance Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.registration}>
                  <td className="font-bold text-[#2F668F]">{v.registration}</td>
                  <td>{v.type}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-xs font-semibold">
                      {v.ownership}
                    </span>
                  </td>
                  <td>{v.capacity}</td>
                  <td>{v.currentKm.toLocaleString('en-IN')} KM</td>
                  <td>{v.assignedDriverName || 'Unassigned'}</td>
                  <td>{v.fcExpiry || '2027-01-20'}</td>
                  <td>{v.insuranceExpiry || '2027-03-15'}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
