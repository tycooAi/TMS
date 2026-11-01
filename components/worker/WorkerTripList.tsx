'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, Search, ArrowRight } from '../ui/Icons';
import { TripStatus } from '../../types';

export function WorkerTripList() {
  const { trips } = useTmsStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTrips = trips.filter((t) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.vehicleRegistration.toLowerCase().includes(q) ||
      t.driverName.toLowerCase().includes(q) ||
      t.material.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="My Operational Trips"
        description="Comprehensive dispatch ledger · Search, review, and advance operational statuses"
      >
        <Link href="/worker/trips/new" className="btn-primary">
          <Plus size={16} />
          New Trip
        </Link>
      </PageHeader>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Trip ID, customer, vehicle or driver..."
            className="tms-input pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-[#16425B] whitespace-nowrap">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tms-input w-full sm:w-48"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="LOADED">Loaded</option>
            <option value="RUNNING">Running</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_LOAD">No Load</option>
          </select>
        </div>
      </div>

      {/* TRIPS TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Date</th>
              <th>Vehicle No</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Source / Loading</th>
              <th>Delivery Site</th>
              <th>Material</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((trip) => (
              <tr key={trip.id}>
                <td className="font-bold text-[#2F668F]">
                  <Link href={`/worker/trips/${trip.id}`} className="hover:underline">
                    {trip.id}
                  </Link>
                </td>
                <td>{trip.date}</td>
                <td className="font-semibold">{trip.vehicleRegistration}</td>
                <td>{trip.customerName}</td>
                <td>{trip.driverName}</td>
                <td className="text-xs text-[#5A6E7F]">{trip.loadingLocation}</td>
                <td className="text-xs text-[#5A6E7F]">{trip.deliveryLocation}</td>
                <td>
                  {trip.isNoLoad ? (
                    <span className="text-xs text-amber-700 font-medium">No Load</span>
                  ) : (
                    `${trip.quantity} ${trip.unit} (${trip.material})`
                  )}
                </td>
                <td>
                  <StatusBadge status={trip.status} />
                </td>
                <td>
                  {trip.status === 'DELIVERED' || trip.status === 'COMPLETED' || trip.status === 'NO_LOAD' ? (
                    <Link
                      href={`/worker/trips/${trip.id}`}
                      className="text-xs font-semibold text-[#2F668F] hover:underline"
                    >
                      View Details
                    </Link>
                  ) : trip.status === 'DRAFT' ? (
                    <Link
                      href={`/worker/trips/new?draftId=${trip.id}`}
                      className="text-xs font-semibold text-[#2F668F] hover:underline"
                    >
                      Continue
                    </Link>
                  ) : (
                    <Link
                      href={`/worker/trips/${trip.id}/status`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#2F668F] px-2.5 py-1 rounded hover:bg-[#255273]"
                    >
                      Update
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filteredTrips.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-10 text-[#5A6E7F]">
                  No trips matched the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
