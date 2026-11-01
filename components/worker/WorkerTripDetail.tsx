'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { ArrowRight, Check } from '../ui/Icons';
import { TripStatus } from '../../types';

interface WorkerTripDetailProps {
  tripId: string;
}

const LIFECYCLE_STAGES: TripStatus[] = ['SUBMITTED', 'LOADED', 'RUNNING', 'DELIVERED'];

export function WorkerTripDetail({ tripId }: WorkerTripDetailProps) {
  const { trips } = useTmsStore();
  const trip = trips.find((t) => t.id === tripId) || trips[0];

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-[#5A6E7F]">Trip not found.</p>
        <Link href="/worker/trips" className="btn-primary mt-4">
          Return to My Trips
        </Link>
      </div>
    );
  }

  const currentIdx = LIFECYCLE_STAGES.indexOf(trip.status);

  return (
    <div>
      <PageHeader
        title={`Trip Manifest ${trip.id}`}
        description={`Operational Dispatch Record · Business Date: ${trip.date}`}
        badge={<StatusBadge status={trip.status} />}
      >
        {trip.status !== 'DELIVERED' && trip.status !== 'COMPLETED' && trip.status !== 'NO_LOAD' && (
          <Link href={`/worker/trips/${trip.id}/status`} className="btn-primary">
            Update Operational Status
            <ArrowRight size={15} />
          </Link>
        )}
      </PageHeader>

      {/* OPERATIONAL PROGRESSION TIMELINE */}
      {!trip.isNoLoad && (
        <div className="bg-white p-5 rounded-lg border border-[#D9DBD6] mb-6">
          <h2 className="text-xs font-bold text-[#5A6E7F] uppercase tracking-wider mb-4">
            Operational Progression Lifecycle
          </h2>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isReached = currentIdx >= idx;
              const isCurrent = trip.status === stage;

              return (
                <div key={stage} className="flex-1 flex items-center min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                        isReached
                          ? 'bg-[#2F668F] text-white border-[#2F668F]'
                          : 'bg-white text-[#8da3b5] border-[#D9DBD6]'
                      }`}
                    >
                      {isReached ? <Check size={14} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-1.5 ${
                        isCurrent ? 'text-[#16425B] font-bold' : isReached ? 'text-[#2F668F]' : 'text-[#8da3b5]'
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        currentIdx > idx ? 'bg-[#2F668F]' : 'bg-[#D9DBD6]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OPERATIONAL DETAILS GRID (STRICTLY NO FINANCIAL NUMBERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-lg border border-[#D9DBD6] space-y-2">
          <h3 className="text-xs font-bold text-[#16425B] pb-2 border-b border-[#D9DBD6]">
            Customer Details
          </h3>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Customer:</span>
            <strong className="text-[#16425B]">{trip.customerName}</strong>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Customer ID:</span>
            <span className="font-semibold text-[#2F668F]">{trip.customerId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Contact Phone:</span>
            <span>{trip.customerPhone}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#D9DBD6] space-y-2">
          <h3 className="text-xs font-bold text-[#16425B] pb-2 border-b border-[#D9DBD6]">
            Vehicle & Driver
          </h3>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Vehicle Reg:</span>
            <strong className="text-[#16425B]">{trip.vehicleRegistration}</strong>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Ownership:</span>
            <span className="font-semibold text-[#16425B]">{trip.vehicleOwnership}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Assigned Driver:</span>
            <span>{trip.driverName} ({trip.driverPhone})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#D9DBD6] space-y-2">
          <h3 className="text-xs font-bold text-[#16425B] pb-2 border-b border-[#D9DBD6]">
            Freight & Cargo
          </h3>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Cargo Material:</span>
            <strong className="text-[#16425B]">{trip.isNoLoad ? 'No Load' : trip.material}</strong>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5A6E7F]">Loaded Quantity:</span>
            <span>{trip.isNoLoad ? '0' : `${trip.quantity} ${trip.unit}`}</span>
          </div>
          {trip.unloadQuantity !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-[#5A6E7F]">Unloaded Verified:</span>
              <span className="font-bold text-emerald-700">
                {trip.unloadQuantity} {trip.unloadUnit || trip.unit}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#D9DBD6] space-y-2 sm:col-span-2 lg:col-span-3">
          <h3 className="text-xs font-bold text-[#16425B] pb-2 border-b border-[#D9DBD6]">
            Route & Logistics Timeline
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#5A6E7F] block">Loading Point:</span>
              <strong>{trip.loadingLocation}</strong>
              <small className="text-[#5A6E7F] block">Source: {trip.source}</small>
            </div>
            <div>
              <span className="text-[#5A6E7F] block">Delivery Point:</span>
              <strong>{trip.deliveryLocation}</strong>
              <small className="text-[#5A6E7F] block">Notes: {trip.notes || 'Standard Delivery'}</small>
            </div>
            <div>
              <span className="text-[#5A6E7F] block">Loading Time:</span>
              <span>{trip.loadingDateTime || 'Recorded at source'}</span>
            </div>
            <div>
              <span className="text-[#5A6E7F] block">Delivered Time:</span>
              <span>{trip.deliveryDateTime || 'Pending Unloading'}</span>
            </div>
          </div>

          {trip.isNoLoad && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              <strong>No Load Status:</strong> {trip.noLoadReason}
            </div>
          )}

          {trip.deliveryProof && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800">
              <strong>Proof of Delivery (POD):</strong> {trip.deliveryProof}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
