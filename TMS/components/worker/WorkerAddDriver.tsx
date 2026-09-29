'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { UserRound, Plus, CheckCircle2, ArrowRight } from '../ui/Icons';
import { Driver } from '../../types';
import { generateNextId } from '../../lib/ids';

export function WorkerAddDriver() {
  const router = useRouter();
  const { drivers, createDriver } = useTmsStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normName = name.trim();
    const normPhone = phone.trim().replace(/\D/g, '');
    const normLicense = licenseNumber.trim().toUpperCase();

    if (!normName) {
      setError('Driver full name is required.');
      return;
    }
    if (normPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!normLicense) {
      setError('Driving license number is required.');
      return;
    }

    // Duplicate check on phone or license
    const phoneExists = drivers.some((d) => d.phone.replace(/\D/g, '') === normPhone);
    if (phoneExists) {
      setError(`A driver with phone number "${normPhone}" is already registered.`);
      return;
    }

    const licenseExists = drivers.some(
      (d) => d.licenseNumber && d.licenseNumber.trim().toUpperCase() === normLicense
    );
    if (licenseExists) {
      setError(`A driver with license number "${normLicense}" is already registered.`);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setError('');

    const nextId = generateNextId('DRV', drivers.map((d) => d.id));
    const normName = name.trim();
    const normPhone = phone.trim();
    const normLicense = licenseNumber.trim().toUpperCase();

    const newDriver: Driver = {
      id: nextId,
      name: normName,
      phone: normPhone,
      licenseNumber: normLicense,
      status: 'AVAILABLE',
      advanceBalance: 0,
      totalEarnings: 0,
      totalSettled: 0,
    };

    try {
      // Save to shared store
      createDriver(newDriver, 'Worker (Arun Kumar)');

      // Sync with backend API
      try {
        const { apiClient } = await import('../../lib/api');
        await apiClient.drivers.create({
          id: nextId,
          name: normName,
          phone: normPhone,
          licenseNumber: normLicense,
          status: 'AVAILABLE',
        });
      } catch (apiErr) {
        console.warn('Backend sync warning (handled by store):', apiErr);
      }

      setIsConfirmOpen(false);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to register driver.');
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setLicenseNumber('');
    setIsSuccess(false);
    setError('');
  };

  return (
    <div>
      <PageHeader
        title="Add Drivers"
        description="Register and onboard commercial drivers with license verification"
      />

      <div className="max-w-2xl bg-white rounded-lg border border-[#D9DBD6] p-6 shadow-sm">
        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#16425B]">Driver Registered Successfully</h2>
              <p className="text-xs text-[#5A6E7F] mt-1">
                Driver <strong className="text-[#16425B]">{name}</strong> (License: {licenseNumber.trim().toUpperCase()}) has been registered and is available for trip dispatch.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
              >
                <Plus size={14} />
                Add Another Driver
              </button>
              <Link href="/worker/trips/new" className="btn-primary">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Mobile Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="tms-input font-medium"
                  required
                />
                <span className="text-[11px] text-[#5A6E7F] mt-1 block">
                  Contact number for dispatch and verification.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Driving License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TN-58-2018-0004561"
                  className="tms-input uppercase font-mono"
                  required
                />
                <span className="text-[11px] text-[#5A6E7F] mt-1 block">
                  Heavy commercial motor vehicle (HMV/Transport) endorsement.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9DBD6] flex justify-end gap-3">
              <Link href="/worker/dashboard" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                <Plus size={15} />
                Save & Register Driver
              </button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Driver Registration"
        message={`Are you sure you want to register driver "${name.trim()}" with license "${licenseNumber.trim().toUpperCase()}"?`}
        confirmLabel={isSubmitting ? 'Registering...' : 'Confirm Driver'}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
