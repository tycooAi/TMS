'use client';

import React from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { Truck } from '../ui/Icons';

export function MdOperations() {
  const { trips, vehicles, drivers } = useTmsStore();

  return (
    <div>
      <PageHeader
        title="Fleet Operations & Telemetry"
        description="Executive visibility into field dispatch, vehicle status, and live route progression"
      />

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 mb-6">
        <h2 className="text-sm font-bold text-[#16425B] mb-3">Live Dispatches & Manifests</h2>
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date</th>
                <th>Vehicle Reg</th>
                <th>Assigned Driver</th>
                <th>Customer</th>
                <th>Cargo Details</th>
                <th>Loading Point</th>
                <th>Delivery Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id}>
                  <td className="font-bold text-[#2F668F]">{t.id}</td>
                  <td>{t.date}</td>
                  <td className="font-semibold text-[#16425B]">{t.vehicleRegistration}</td>
                  <td>{t.driverName}</td>
                  <td>{t.customerName}</td>
                  <td>{t.isNoLoad ? 'No Load' : `${t.quantity} ${t.unit} (${t.material})`}</td>
                  <td className="text-xs text-[#5A6E7F]">{t.loadingLocation}</td>
                  <td className="text-xs text-[#5A6E7F]">{t.deliveryLocation}</td>
                  <td>
                    <StatusBadge status={t.status} />
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
