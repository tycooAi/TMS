'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ArrowRight, Check } from '../ui/Icons';
import { TripStatus } from '../../types';

interface WorkerTripStatusProps {
  tripId: string;
}

export function WorkerTripStatus({ tripId }: WorkerTripStatusProps) {
  const router = useRouter();
  const { trips, updateTripStatus } = useTmsStore();
  const trip = trips.find((t) => t.id === tripId) || trips[0];

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Transition form fields
  const [loadingDateTime, setLoadingDateTime] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  const [departureDateTime, setDepartureDateTime] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  const [deliveryDateTime, setDeliveryDateTime] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  const [unloadQuantity, setUnloadQuantity] = useState<number>(trip?.quantity || 18);
  const [unloadUnit, setUnloadUnit] = useState<'Ton' | 'CFT' | 'Load'>(trip?.unit || 'Ton');
  const [deliveryProof, setDeliveryProof] = useState(`POD-${Date.now().toString().slice(-6)}`);
  const [statusNote, setStatusNote] = useState('');
  const [closingKm, setClosingKm] = useState<number>((trip?.openingKm || 48200) + 35);

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

  // Determine allowed transition
  const getNextStatus = (current: TripStatus): TripStatus | null => {
    switch (current) {
      case 'DRAFT':
      case 'SUBMITTED':
      case 'ASSIGNED':
        return 'LOADED';
      case 'LOADED':
        return 'RUNNING';
      case 'RUNNING':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  const next = getNextStatus(trip.status);

  if (!next) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-white rounded-xl border border-[#D9DBD6] p-8 shadow-sm">
        <h2 className="text-lg font-bold text-[#16425B]">Operational Status Locked</h2>
        <p className="text-xs text-[#5A6E7F] mt-1">
          This trip is currently in <strong>{trip.status}</strong> state. Operational transitions are complete.
        </p>
        <Link href={`/worker/trips/${trip.id}`} className="btn-primary mt-6">
          View Trip Manifest
        </Link>
      </div>
    );
  }

  const handleConfirmTransition = () => {
    let extra: any = { notes: statusNote ? `${trip.notes ? trip.notes + ' | ' : ''}${statusNote}` : trip.notes };

    if (next === 'LOADED') {
      extra.loadingDateTime = loadingDateTime;
    } else if (next === 'RUNNING') {
      extra.departureDateTime = departureDateTime;
    } else if (next === 'DELIVERED') {
      extra.deliveryDateTime = deliveryDateTime;
      extra.unloadQuantity = unloadQuantity;
      extra.unloadUnit = unloadUnit;
      extra.deliveryProof = deliveryProof;
      extra.closingKm = closingKm;
      extra.tripKm = trip.openingKm ? Math.max(0, closingKm - trip.openingKm) : 0;
    }

    updateTripStatus(trip.id, next, extra, 'Arun Kumar');
    setIsConfirmOpen(false);
    router.push(`/worker/trips/${trip.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`Update Trip Status: ${trip.id}`}
        description="Progress the operational dispatch lifecycle"
      />

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-6 shadow-sm space-y-6">
        {/* STATUS STEP VISUALIZER */}
        <div className="flex items-center justify-between p-4 bg-[#f8faf5] rounded-lg border border-[#D9DBD6]">
          <div>
            <span className="text-[10px] font-bold text-[#5A6E7F] uppercase tracking-wider block mb-1">
              Current Status
            </span>
            <StatusBadge status={trip.status} />
          </div>

          <div className="text-xl font-bold text-[#2F668F]">→</div>

          <div>
            <span className="text-[10px] font-bold text-[#5A6E7F] uppercase tracking-wider block mb-1">
              Next Status
            </span>
            <StatusBadge status={next} />
          </div>
        </div>

        {/* TRANSITION DETAILS FORM */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#16425B] pb-2 border-b border-[#D9DBD6]">
            {next === 'LOADED' && 'Confirm Cargo Loaded at Source'}
            {next === 'RUNNING' && 'Start Trip Transit Departure'}
            {next === 'DELIVERED' && 'Record Delivery & Unloading Verification'}
          </h2>

          {next === 'LOADED' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Loading Timestamp</label>
                <input
                  type="text"
                  value={loadingDateTime}
                  onChange={(e) => setLoadingDateTime(e.target.value)}
                  className="tms-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Source Loading Note (optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Weighed at weighbridge #1"
                  className="tms-input"
                />
              </div>
            </div>
          )}

          {next === 'RUNNING' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Departure Timestamp</label>
                <input
                  type="text"
                  value={departureDateTime}
                  onChange={(e) => setDepartureDateTime(e.target.value)}
                  className="tms-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Transit Note (optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Route clear via bypass"
                  className="tms-input"
                />
              </div>
            </div>
          )}

          {next === 'DELIVERED' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Delivery Timestamp</label>
                  <input
                    type="text"
                    value={deliveryDateTime}
                    onChange={(e) => setDeliveryDateTime(e.target.value)}
                    className="tms-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Proof of Delivery (POD) Ref</label>
                  <input
                    type="text"
                    value={deliveryProof}
                    onChange={(e) => setDeliveryProof(e.target.value)}
                    className="tms-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Actual Unloaded Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={unloadQuantity}
                      onChange={(e) => setUnloadQuantity(Number(e.target.value))}
                      className="tms-input flex-1"
                    />
                    <select
                      value={unloadUnit}
                      onChange={(e) => setUnloadUnit(e.target.value as any)}
                      className="tms-input w-24"
                    >
                      <option value="Ton">Ton</option>
                      <option value="CFT">CFT</option>
                      <option value="Load">Load</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">End / Closing Odometer KM</label>
                  <input
                    type="number"
                    value={closingKm}
                    onChange={(e) => setClosingKm(Number(e.target.value))}
                    className="tms-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Delivery Site Remarks (optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Unloaded at foundation block A, signed by site engineer"
                  className="tms-input"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <strong>Important:</strong> Marking as <strong>DELIVERED</strong> locks the operational data (Customer, Vehicle, Driver, Cargo).
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#D9DBD6] flex justify-end gap-3">
          <Link href={`/worker/trips/${trip.id}`} className="btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="btn-primary"
          >
            Advance to {next}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Advance Trip to ${next}?`}
        message={`This will transition Trip ${trip.id} from ${trip.status} to ${next}. Proceed?`}
        confirmLabel={`Confirm ${next}`}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmTransition}
      />
    </div>
  );
}
