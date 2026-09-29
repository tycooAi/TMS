'use client';

import React, { useState } from 'react';
import { Driver } from '../../../types';
import { useTmsStore } from '../../../lib/store';
import { generateNextId } from '../../../lib/ids';
import { Modal } from '../../ui/Modal';
import { UserRound, Plus, AlertCircle, Phone } from '../../ui/Icons';

interface DriverCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverCreated: (driver: Driver) => void;
}

export function DriverCreateModal({
  isOpen,
  onClose,
  onDriverCreated,
}: DriverCreateModalProps) {
  const { drivers, createDriver } = useTmsStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const normLicense = licenseNumber.trim().toUpperCase();

    if (!normName) {
      setError('Driver name is required.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('10-digit mobile phone number is required.');
      return;
    }
    if (!normLicense) {
      setError('Driving license number is required.');
      return;
    }

    if (drivers.some((d) => d.phone.replace(/\D/g, '') === cleanPhone)) {
      setError(`A driver with phone ${cleanPhone} is already registered.`);
      return;
    }

    setIsSubmitting(true);

    const nextId = generateNextId('DRV', drivers.map((d) => d.id));

    const newDriver: Driver = {
      id: nextId,
      name: normName,
      phone: phone.trim(),
      licenseNumber: normLicense,
      status: 'AVAILABLE',
      advanceBalance: 0,
      totalEarnings: 0,
      totalSettled: 0,
    };

    try {
      createDriver(newDriver, 'Worker (Operations)');

      try {
        const { apiClient } = await import('../../../lib/api');
        await apiClient.drivers.create({
          id: nextId,
          name: normName,
          phone: phone.trim(),
          licenseNumber: normLicense,
          status: 'AVAILABLE',
        });
      } catch (beErr) {
        console.warn('Backend driver sync note:', beErr);
      }

      onDriverCreated(newDriver);
      onClose();
      // Reset
      setName('');
      setPhone('');
      setLicenseNumber('');
    } catch (err: any) {
      setError(err.message || 'Error creating driver.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Driver"
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
            Driver Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <UserRound size={16} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S. Murugan"
              className="tms-input pl-9 font-bold text-[#16425B]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#16425B] mb-1">
            Mobile Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="tms-input pl-9 font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#16425B] mb-1">
            Driving License Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
            placeholder="e.g. TN-58-2019-0001234"
            className="tms-input uppercase font-mono"
            required
          />
        </div>

        <div className="pt-3 border-t border-[#D9DBD6] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            <Plus size={14} />
            {isSubmitting ? 'Saving...' : 'Save & Select Driver'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
