'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Truck, Plus, CheckCircle2, ArrowRight } from '../ui/Icons';
import { Vehicle } from '../../types';

export function WorkerAddVehicle() {
  const router = useRouter();
  const { vehicles, createVehicle } = useTmsStore();

  const [registration, setRegistration] = useState('');
  const [type, setType] = useState('Tipper');
  const [ownership, setOwnership] = useState<'OWN' | 'RENTED'>('OWN');
  const [capacity, setCapacity] = useState('18 Ton');
  const [fuelCapacity, setFuelCapacity] = useState('180 L');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normReg = registration.trim().toUpperCase();
    if (!normReg) {
      setError('Vehicle registration number is required.');
      return;
    }

    // Duplicate check
    const exists = vehicles.some((v) => v.registration.trim().toUpperCase() === normReg);
    if (exists) {
      setError(`Vehicle with registration number "${normReg}" already exists in the fleet master.`);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setError('');

    const normReg = registration.trim().toUpperCase();

    const newVehicle: Vehicle = {
      registration: normReg,
      type,
      ownership,
      capacity,
      fuelCapacity,
      currentKm: 0,
      status: 'AVAILABLE',
    };

    try {
      // Save to shared store
      createVehicle(newVehicle, 'Worker (Arun Kumar)');

      // Sync with backend API if available
      try {
        const { apiClient } = await import('../../lib/api');
        await apiClient.vehicles.create({
          registration: normReg,
          type,
          ownership,
          capacity,
          fuelCapacity,
          status: 'AVAILABLE',
        });
      } catch (apiErr) {
        console.warn('Backend sync warning (handled by offline store):', apiErr);
      }

      setIsConfirmOpen(false);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to register vehicle.');
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRegistration('');
    setType('Tipper');
    setOwnership('OWN');
    setCapacity('18 Ton');
    setFuelCapacity('180 L');
    setIsSuccess(false);
    setError('');
  };

  return (
    <div>
      <PageHeader
        title="Add Vehicles"
        description="Register and onboard operational vehicles to the active transport fleet"
      />

      <div className="max-w-2xl bg-white rounded-lg border border-[#D9DBD6] p-4 sm:p-6 shadow-sm">
        {isSuccess ? (
          <div className="text-center py-6 sm:py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#16425B]">Vehicle Registered Successfully</h2>
              <p className="text-xs text-[#5A6E7F] mt-1">
                Vehicle <strong className="font-mono text-[#16425B]">{registration.trim().toUpperCase()}</strong> has been added to the master fleet and is available for trip dispatch.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary justify-center text-center"
              >
                <Plus size={14} />
                Add Another Vehicle
              </button>
              <Link href="/worker/trips/new" className="btn-primary justify-center text-center">
                Proceed to New Trip
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Vehicle Registration Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck size={16} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                <input
                  type="text"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  placeholder="e.g. TN 58 AB 2345"
                  className="tms-input pl-9 font-bold uppercase tracking-wider text-[#16425B]"
                  required
                />
              </div>
              <span className="text-[11px] text-[#5A6E7F] mt-1 block">
                Standard state vehicle plate number with strict duplicate protection.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="tms-input"
                  required
                >
                  <option value="Tipper">Tipper</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Multi-Axle">Multi-Axle</option>
                  <option value="Mini Truck">Mini Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Ownership Model <span className="text-red-500">*</span>
                </label>
                <select
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value as 'OWN' | 'RENTED')}
                  className="tms-input"
                  required
                >
                  <option value="OWN">OWN (Company Asset)</option>
                  <option value="RENTED">RENTED (Subcontractor / Market Fleet)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Standard Payload Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 18 Ton or 24 Ton"
                  className="tms-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Fuel Tank Capacity
                </label>
                <input
                  type="text"
                  value={fuelCapacity}
                  onChange={(e) => setFuelCapacity(e.target.value)}
                  placeholder="e.g. 180 L or 220 L"
                  className="tms-input"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9DBD6] flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Link href="/worker/dashboard" className="btn-secondary justify-center text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary justify-center text-center"
              >
                <Plus size={15} />
                Save & Register Vehicle
              </button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Vehicle Registration"
        message={`Are you sure you want to register vehicle "${registration.trim().toUpperCase()}" into the fleet master?`}
        confirmLabel={isSubmitting ? 'Registering...' : 'Confirm Registration'}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
