'use client';

import React, { useState } from 'react';
import { Vehicle } from '../../../types';
import { useTmsStore } from '../../../lib/store';
import { Modal } from '../../ui/Modal';
import { Truck, Plus, AlertCircle } from '../../ui/Icons';

interface VehicleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleCreated: (vehicle: Vehicle) => void;
}

export function VehicleCreateModal({
  isOpen,
  onClose,
  onVehicleCreated,
}: VehicleCreateModalProps) {
  const { vehicles, createVehicle } = useTmsStore();

  const [registration, setRegistration] = useState('');
  const [type, setType] = useState('Tipper');
  const [ownership, setOwnership] = useState<'OWN' | 'RENTED'>('OWN');
  const [capacity, setCapacity] = useState('18 Ton');
  const [fuelCapacity, setFuelCapacity] = useState('180 L');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normReg = registration.trim().toUpperCase();
    if (!normReg) {
      setError('Registration number is required.');
      return;
    }

    if (vehicles.some((v) => v.registration.trim().toUpperCase() === normReg)) {
      setError(`Vehicle with registration number "${normReg}" already exists.`);
      return;
    }

    setIsSubmitting(true);

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
      createVehicle(newVehicle, 'Worker (Operations)');

      try {
        const { apiClient } = await import('../../../lib/api');
        await apiClient.vehicles.create({
          registration: normReg,
          type,
          ownership,
          capacity,
          fuelCapacity,
          status: 'AVAILABLE',
        });
      } catch (beErr) {
        console.warn('Backend vehicle sync note:', beErr);
      }

      onVehicleCreated(newVehicle);
      onClose();
      // Reset
      setRegistration('');
      setType('Tipper');
      setOwnership('OWN');
      setCapacity('18 Ton');
    } catch (err: any) {
      setError(err.message || 'Error creating vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Vehicle"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="tms-input"
            >
              <option value="Tipper">Tipper</option>
              <option value="Trailer">Trailer</option>
              <option value="Heavy Truck">Heavy Truck</option>
              <option value="Multi-Axle">Multi-Axle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Ownership <span className="text-red-500">*</span>
            </label>
            <select
              value={ownership}
              onChange={(e) => setOwnership(e.target.value as 'OWN' | 'RENTED')}
              className="tms-input"
            >
              <option value="OWN">OWN</option>
              <option value="RENTED">RENTED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 18 Ton"
              className="tms-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Fuel Capacity
            </label>
            <input
              type="text"
              value={fuelCapacity}
              onChange={(e) => setFuelCapacity(e.target.value)}
              placeholder="e.g. 180 L"
              className="tms-input"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#D9DBD6] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto btn-secondary text-center justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto btn-primary text-center justify-center"
          >
            <Plus size={14} />
            {isSubmitting ? 'Saving...' : 'Save & Select Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
