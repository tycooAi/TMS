'use client';

import React from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { ArrowRight, Factory, Truck, Users, Plus, ClipboardList } from '../ui/Icons';
import { formatCurrency } from '../../lib/calculations';

export function ManagerDashboard() {
  const { trips, vehicles, drivers, workers, sources, rates } = useTmsStore();

  const activeTrips = trips.filter((t) => t.status === 'RUNNING' || t.status === 'LOADED').length;
  const deliveredTrips = trips.filter((t) => t.status === 'DELIVERED' || t.status === 'COMPLETED').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const activeWorkers = workers.filter((w) => w.status === 'ACTIVE').length;
  const activeSources = sources.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div>
      <PageHeader
        title="Operations Command Center"
        description="Live operational oversight, fleet readiness, crusher sources, and commercial rate control"
      >
        <Link href="/manager/rates" className="btn-secondary">
          <ClipboardList size={15} />
          Configure Commercial Rates
        </Link>
        <Link href="/worker/trips/new" className="btn-primary">
          <Plus size={15} />
          Dispatch New Trip
        </Link>
      </PageHeader>

      {/* OPERATIONS KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Active Running Trips"
          value={activeTrips}
          note="In-transit on route"
        />
        <KpiCard
          label="Delivered Deliveries"
          value={deliveredTrips}
          note="Completed dispatches"
        />
        <KpiCard
          label="Available Fleet"
          value={`${availableVehicles} / ${vehicles.length}`}
          note="Ready for dispatch"
        />
        <KpiCard
          label="Active Workforce"
          value={activeWorkers}
          note="Operators & drivers"
        />
        <KpiCard
          label="Active Quarries"
          value={activeSources}
          note="Operational sources"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ACTIVE CONFIGURED RATES PANEL */}
        <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#16425B] flex items-center gap-2">
                <Factory size={16} className="text-[#2F668F]" />
                Active Configured Commercial Rates
              </h2>
              <p className="text-xs text-[#5A6E7F]">Preserved historical rates for live trips</p>
            </div>
            <Link href="/manager/rates" className="text-xs font-semibold text-[#2F668F] hover:underline">
              Manage All ({rates.length})
            </Link>
          </div>

          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Material</th>
                  <th>Applicable Route</th>
                  <th>Configured Rate</th>
                  <th>Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B]">
                        {r.rateType}
                      </span>
                    </td>
                    <td className="font-bold">{r.material}</td>
                    <td className="text-xs text-[#5A6E7F]">
                      {r.loadingLocation} → {r.deliveryLocation}
                    </td>
                    <td className="font-bold text-[#2F668F]">
                      ₹{r.rate} / {r.unit}
                    </td>
                    <td>{r.effectiveFrom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FLEET STATUS READY PANEL */}
        <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#16425B] flex items-center gap-2">
                <Truck size={16} className="text-[#2F668F]" />
                Fleet Availability & Driver Assignment
              </h2>
              <p className="text-xs text-[#5A6E7F]">Current asset deployment</p>
            </div>
            <Link href="/manager/vehicles" className="text-xs font-semibold text-[#2F668F] hover:underline">
              Fleet Master ({vehicles.length})
            </Link>
          </div>

          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Vehicle No</th>
                  <th>Type</th>
                  <th>Ownership</th>
                  <th>Assigned Driver</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.registration}>
                    <td className="font-bold text-[#16425B]">{v.registration}</td>
                    <td>{v.type}</td>
                    <td>{v.ownership}</td>
                    <td>{v.assignedDriverName || 'Unassigned'}</td>
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

      {/* RECENT OPERATIONAL TRIPS */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Operational Dispatch Stream</h2>
            <p className="text-xs text-[#5A6E7F]">Real-time field trips and deliveries</p>
          </div>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Customer</th>
                <th>Material</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 6).map((t) => (
                <tr key={t.id}>
                  <td className="font-bold text-[#2F668F]">{t.id}</td>
                  <td>{t.date}</td>
                  <td className="font-semibold">{t.vehicleRegistration}</td>
                  <td>{t.driverName}</td>
                  <td>{t.customerName}</td>
                  <td>{t.isNoLoad ? 'No Load' : `${t.quantity} ${t.unit} (${t.material})`}</td>
                  <td>{t.source}</td>
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
