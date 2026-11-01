'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, ArrowRight } from '../ui/Icons';
import { Trip } from '../../types';

export function WorkerDashboard() {
  const router = useRouter();
  const { trips } = useTmsStore();

  const assignedCount = trips.filter((t) => t.status === 'ASSIGNED' || t.status === 'SUBMITTED').length;
  const pendingDeliveries = trips.filter((t) => t.status === 'RUNNING' || t.status === 'LOADED').length;
  const completedToday = trips.filter((t) => t.status === 'DELIVERED' || t.status === 'COMPLETED').length;

  const todayTrips = trips.slice(0, 8);

  const getActionButton = (trip: Trip) => {
    if (trip.status === 'DRAFT') {
      return (
        <Link
          href={`/worker/trips/new?draftId=${trip.id}`}
          className="text-xs font-semibold text-[#2F668F] hover:underline"
        >
          Continue Draft
        </Link>
      );
    }
    if (trip.status === 'DELIVERED' || trip.status === 'COMPLETED' || trip.status === 'NO_LOAD') {
      return (
        <Link
          href={`/worker/trips/${trip.id}`}
          className="text-xs font-semibold text-[#2F668F] hover:underline"
        >
          View Trip
        </Link>
      );
    }
    return (
      <Link
        href={`/worker/trips/${trip.id}/status`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#2F668F] px-2.5 py-1 rounded hover:bg-[#255273]"
      >
        Update Status
        <ArrowRight size={13} />
      </Link>
    );
  };

  return (
    <div>
      <PageHeader
        title="Operational Dashboard"
        description="Welcome Back, Arun Kumar (WRK-0024) · Operational Trip Workspace"
      >
        <Link href="/worker/trips/new" className="btn-primary">
          <Plus size={16} />
          New Trip Entry
        </Link>
      </PageHeader>

      {/* OPERATIONAL KPIS ONLY - STRICTLY NO FINANCIAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Today's Assigned Trips"
          value={assignedCount}
          note="Ready for loading"
        />
        <KpiCard
          label="In-Transit / Pending Deliveries"
          value={pendingDeliveries}
          note="Running on route"
        />
        <KpiCard
          label="Completed Today"
          value={completedToday}
          note="Unloaded and verified"
        />
      </div>

      {/* TODAY'S TRIPS MANIFEST */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Today's Operational Trips</h2>
            <p className="text-xs text-[#5A6E7F]">Latest dispatch and delivery manifests</p>
          </div>
          <Link
            href="/worker/trips"
            className="text-xs font-semibold text-[#2F668F] hover:underline flex items-center gap-1"
          >
            View All Trips ({trips.length})
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Business Date</th>
                <th>Vehicle No</th>
                <th>Customer</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Material & Quantity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {todayTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="font-bold text-[#2F668F]">{trip.id}</td>
                  <td>{trip.date}</td>
                  <td className="font-semibold">{trip.vehicleRegistration}</td>
                  <td>{trip.customerName}</td>
                  <td>{trip.driverName}</td>
                  <td className="text-xs text-[#5A6E7F]">
                    {trip.loadingLocation} → {trip.deliveryLocation}
                  </td>
                  <td>
                    {trip.isNoLoad ? (
                      <span className="text-xs font-medium text-amber-700">No Load Reason</span>
                    ) : (
                      `${trip.quantity} ${trip.unit} (${trip.material})`
                    )}
                  </td>
                  <td>
                    <StatusBadge status={trip.status} />
                  </td>
                  <td>{getActionButton(trip)}</td>
                </tr>
              ))}
              {todayTrips.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[#5A6E7F]">
                    No trips recorded today. Click New Trip to start an entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
