'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Stepper } from '../ui/Stepper';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { CheckCircle2, Search } from '../ui/Icons';
import { Customer, Driver, Trip, Vehicle } from '../../types';
import { generateNextId } from '../../lib/ids';

const STEPS = [
  'Trip Details',
  'Customer Lookup',
  'Vehicle Assignment',
  'Driver Assignment',
  'Load & Source',
  'Delivery Details',
  'Review & Submit',
];

export function WorkerNewTrip() {
  const router = useRouter();
  const { customers, vehicles, drivers, materials, sources, locations, rates, trips, createTrip } = useTmsStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-generate Trip ID
  const newTripId = generateNextId('TRP', trips.map((t) => t.id));

  // Form State
  const [trip, setTrip] = useState<Partial<Trip>>({
    id: newTripId,
    date: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    enteredBy: 'Arun Kumar',
    status: 'DRAFT',
    progress: 1,
    unit: 'Ton',
    quantity: 18,
    material: 'Black M-Sand',
    source: sources[0]?.name || 'ABC Crusher',
    loadingLocation: locations[0]?.name || 'ABC Crusher Yard',
    deliveryLocation: locations[2]?.name || 'K Engineering Site',
    appliedRate: 850,
    rateUnit: 'Ton',
    isNoLoad: false,
    noLoadReason: '',
  });

  // Search states for lookups
  const [customerSearch, setCustomerSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Filtered customer lookup (Phone first, Name second, Customer ID)
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.phone.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const q = vehicleSearch.trim().toLowerCase();
    if (!q) return true;
    return v.registration.toLowerCase().includes(q) || v.type.toLowerCase().includes(q);
  });

  // Filtered drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = driverSearch.trim().toLowerCase();
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || d.phone.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
  });

  const handleSelectCustomer = (c: Customer) => {
    setTrip((prev) => ({
      ...prev,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
    }));
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setTrip((prev) => ({
      ...prev,
      vehicleRegistration: v.registration,
      vehicleOwnership: v.ownership,
      openingKm: v.currentKm,
    }));
  };

  const handleSelectDriver = (d: Driver) => {
    setTrip((prev) => ({
      ...prev,
      driverId: d.id,
      driverName: d.name,
      driverPhone: d.phone,
    }));
  };

  // Validation before advancing
  const validateStep = (step: number): boolean => {
    const errs: string[] = [];
    if (step === 1) {
      if (!trip.customerId) errs.push('Please select a customer from the master list.');
    } else if (step === 2) {
      if (!trip.vehicleRegistration) errs.push('Please select an active vehicle.');
    } else if (step === 3) {
      if (!trip.driverId) errs.push('Please select an assigned driver.');
    } else if (step === 4) {
      if (trip.isNoLoad) {
        if (!trip.noLoadReason?.trim()) errs.push('Please specify the operational reason for No Load.');
      } else {
        if (!trip.material) errs.push('Material is required.');
        if (!trip.quantity || trip.quantity <= 0) errs.push('Quantity must be greater than zero.');
        if (!trip.source) errs.push('Source / Crusher is required.');
      }
    } else if (step === 5) {
      if (!trip.deliveryLocation) errs.push('Delivery destination is required.');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setErrors([]);
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const finalTrip: Trip = {
      id: trip.id || newTripId,
      date: trip.date || '13 Sep 2026',
      customerId: trip.customerId!,
      customerName: trip.customerName!,
      customerPhone: trip.customerPhone!,
      vehicleRegistration: trip.vehicleRegistration!,
      vehicleOwnership: trip.vehicleOwnership || 'OWN',
      driverId: trip.driverId!,
      driverName: trip.driverName!,
      driverPhone: trip.driverPhone!,
      material: trip.isNoLoad ? 'No Load' : trip.material || 'Black M-Sand',
      quantity: trip.isNoLoad ? 0 : trip.quantity || 18,
      unit: trip.unit || 'Ton',
      source: trip.source || 'ABC Crusher',
      sourceBillNo: trip.sourceBillNo,
      loadingLocation: trip.loadingLocation || 'ABC Crusher Yard',
      deliveryLocation: trip.deliveryLocation || 'Site',
      appliedRate: trip.appliedRate || 850,
      rateUnit: trip.rateUnit || 'Ton',
      totalAmount: (trip.quantity || 18) * (trip.appliedRate || 850),
      status: trip.isNoLoad ? 'NO_LOAD' : 'SUBMITTED',
      progress: 7,
      isNoLoad: trip.isNoLoad,
      noLoadReason: trip.noLoadReason,
      enteredBy: 'Arun Kumar',
      notes: trip.notes,
    };

    createTrip(finalTrip);
    setIsConfirmOpen(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-white rounded-xl border border-[#D9DBD6] p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-xl font-bold text-[#16425B]">Trip Submitted Successfully</h2>
        <p className="text-xs text-[#5A6E7F] mt-1">
          Trip <strong>{trip.id}</strong> has been logged to the operational ledger.
        </p>

        <div className="my-6 p-4 rounded-lg bg-[#f8faf5] border border-[#D9DBD6] text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#5A6E7F]">Trip ID:</span>
            <strong className="text-[#16425B]">{trip.id}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A6E7F]">Customer:</span>
            <span className="font-semibold text-[#16425B]">{trip.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A6E7F]">Vehicle:</span>
            <span className="font-semibold text-[#16425B]">{trip.vehicleRegistration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A6E7F]">Driver:</span>
            <span className="font-semibold text-[#16425B]">{trip.driverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A6E7F]">Status:</span>
            <StatusBadge status={trip.isNoLoad ? 'NO_LOAD' : 'SUBMITTED'} />
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Link href={`/worker/trips/${trip.id}`} className="btn-primary">
            View Trip Details
          </Link>
          <Link href="/worker/trips" className="btn-secondary">
            Go to My Trips
          </Link>
          <button
            onClick={() => {
              setIsSuccess(false);
              setCurrentStep(0);
              setTrip((prev) => ({
                ...prev,
                id: generateNextId('TRP', trips.map((t) => t.id)),
                customerId: undefined,
                customerName: undefined,
                vehicleRegistration: undefined,
                driverId: undefined,
              }));
            }}
            className="btn-secondary"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="New Operational Trip"
        description="7-Step Guided Operational Dispatch Entry · Arun Kumar (WRK-0024)"
      />

      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={(idx) => idx < currentStep && setCurrentStep(idx)} />

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-6 shadow-sm">
        {/* STEP 1: TRIP DETAILS */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#16425B] pb-2 border-b border-[#D9DBD6]">
              Step 1: System Identifiers & Date
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Trip ID</label>
                <input type="text" value={trip.id} readOnly className="tms-input font-bold text-[#2F668F]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Business Date</label>
                <input type="text" value={trip.date} readOnly className="tms-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Entry Operator</label>
                <input type="text" value={trip.enteredBy} readOnly className="tms-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Initial Status</label>
                <div className="h-9 flex items-center">
                  <StatusBadge status="DRAFT" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONTROLLED CUSTOMER LOOKUP */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D9DBD6]">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 2: Customer Selection</h2>
                <p className="text-xs text-[#5A6E7F]">
                  Controlled Master Lookup: Search by Phone (primary), Name, or Customer ID
                </p>
              </div>
              {trip.customerId && (
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  Selected: {trip.customerName}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by phone number, customer name or CUS-XXXXX..."
                className="tms-input pl-9"
              />
            </div>

            <div className="border border-[#D9DBD6] rounded-lg max-h-64 overflow-y-auto divide-y divide-[#D9DBD6]">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    trip.customerId === c.id ? 'bg-[#e8f1f5] border-l-4 border-l-[#2F668F]' : 'hover:bg-[#f8faf5]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#16425B]">{c.name}</p>
                    <p className="text-[11px] text-[#5A6E7F]">
                      ID: <strong>{c.id}</strong> · Phone: <strong>{c.phone}</strong> · {c.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-semibold rounded ${
                      trip.customerId === c.id ? 'bg-[#2F668F] text-white' : 'border border-[#D9DBD6] text-[#16425B] bg-white'
                    }`}
                  >
                    {trip.customerId === c.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="p-6 text-center text-xs text-[#5A6E7F]">
                  <p className="font-semibold text-amber-800">
                    Customer not found — Contact Manager/Admin to register a new customer master.
                  </p>
                  <p className="text-[11px] mt-1 text-[#8da3b5]">
                    Worker portal operates in strict data-entry mode to protect against duplicate records.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: VEHICLE SELECTION */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#D9DBD6]">
              <h2 className="text-sm font-bold text-[#16425B]">Step 3: Vehicle Assignment</h2>
              <p className="text-xs text-[#5A6E7F]">Select active vehicle from controlled fleet</p>
            </div>

            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              placeholder="Search registration number or type..."
              className="tms-input"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredVehicles.map((v) => (
                <div
                  key={v.registration}
                  onClick={() => handleSelectVehicle(v)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    trip.vehicleRegistration === v.registration
                      ? 'border-[#2F668F] bg-[#e8f1f5] shadow-sm'
                      : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-sm font-bold text-[#16425B]">{v.registration}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B]">
                      {v.ownership}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A6E7F] mt-1">
                    {v.type} · Capacity: {v.capacity} · KM: {v.currentKm.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: DRIVER SELECTION */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#D9DBD6]">
              <h2 className="text-sm font-bold text-[#16425B]">Step 4: Driver Assignment</h2>
              <p className="text-xs text-[#5A6E7F]">Select authorized driver</p>
            </div>

            <input
              type="text"
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              placeholder="Search driver name or phone..."
              className="tms-input"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDrivers.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDriver(d)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    trip.driverId === d.id
                      ? 'border-[#2F668F] bg-[#e8f1f5] shadow-sm'
                      : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-sm font-bold text-[#16425B]">{d.name}</strong>
                    <span className="text-[10px] font-bold text-[#3B7CA6]">{d.id}</span>
                  </div>
                  <p className="text-xs text-[#5A6E7F] mt-1">
                    Phone: {d.phone} · License: {d.licenseNumber || 'Verified'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: LOAD & SOURCE */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="pb-2 border-b border-[#D9DBD6] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 5: Cargo, Material & Source</h2>
                <p className="text-xs text-[#5A6E7F]">Configured rates are read-only</p>
              </div>

              {/* CRITICAL PROPOSAL REQUIREMENT: NO LOAD TOGGLE */}
              <label className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trip.isNoLoad}
                  onChange={(e) => setTrip({ ...trip, isNoLoad: e.target.checked })}
                  className="rounded text-[#2F668F]"
                />
                Mark as "No Load" Run
              </label>
            </div>

            {trip.isNoLoad ? (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-amber-900">
                  Vehicle is operating without commercial cargo. No financial receivables will be created.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Reason for No Load Run
                  </label>
                  <select
                    value={trip.noLoadReason}
                    onChange={(e) => setTrip({ ...trip, noLoadReason: e.target.value })}
                    className="tms-input"
                  >
                    <option value="">Select reason</option>
                    <option value="Vehicle repositioning / empty transit">Vehicle repositioning / empty transit</option>
                    <option value="Scheduled maintenance / workshop visit">Scheduled maintenance / workshop visit</option>
                    <option value="Quarry breakdown / no load available">Quarry breakdown / no load available</option>
                    <option value="Driver transit / duty change">Driver transit / duty change</option>
                    <option value="Other operational reason">Other operational reason</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Material</label>
                  <select
                    value={trip.material}
                    onChange={(e) => setTrip({ ...trip, material: e.target.value })}
                    className="tms-input"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={trip.quantity}
                      onChange={(e) => setTrip({ ...trip, quantity: Number(e.target.value) })}
                      className="tms-input flex-1"
                    />
                    <select
                      value={trip.unit}
                      onChange={(e) => setTrip({ ...trip, unit: e.target.value as any })}
                      className="tms-input w-24"
                    >
                      <option value="Ton">Ton</option>
                      <option value="CFT">CFT</option>
                      <option value="Load">Load</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Source / Crusher</label>
                  <select
                    value={trip.source}
                    onChange={(e) => setTrip({ ...trip, source: e.target.value })}
                    className="tms-input"
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Source Bill Number (optional)</label>
                  <input
                    type="text"
                    value={trip.sourceBillNo || ''}
                    onChange={(e) => setTrip({ ...trip, sourceBillNo: e.target.value })}
                    placeholder="e.g. VDP-9912"
                    className="tms-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Loading Location</label>
                  <select
                    value={trip.loadingLocation}
                    onChange={(e) => setTrip({ ...trip, loadingLocation: e.target.value })}
                    className="tms-input"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">Delivery Location</label>
                  <input
                    type="text"
                    value={trip.deliveryLocation || ''}
                    onChange={(e) => setTrip({ ...trip, deliveryLocation: e.target.value })}
                    placeholder="Enter delivery location"
                    className="tms-input"
                    list="load-delivery-locations-list"
                  />
                  <datalist id="load-delivery-locations-list">
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name} />
                    ))}
                  </datalist>
                </div>

                {/* READ-ONLY CONFIGURED RATE */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Applicable Commercial Rate (Read-Only)
                  </label>
                  <input
                    type="text"
                    value={`₹${trip.appliedRate} / ${trip.unit}`}
                    readOnly
                    className="tms-input bg-[#f8faf5] text-[#5A6E7F] font-semibold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                    Locked system rate configured by Management. Worker cannot override.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: DELIVERY DETAILS */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#D9DBD6]">
              <h2 className="text-sm font-bold text-[#16425B]">Step 6: Delivery Destination & Notes</h2>
              <p className="text-xs text-[#5A6E7F]">Specify delivery destination site</p>
            </div>

            <div className="p-3 bg-[#e8f1f5] rounded-lg text-xs font-semibold text-[#16425B] flex items-center justify-between">
              <span>Loading Point: {trip.loadingLocation}</span>
              <span className="text-[#3B7CA6] font-bold">→</span>
              <span>Delivery Point: {trip.deliveryLocation}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Delivery Location</label>
                <input
                  type="text"
                  value={trip.deliveryLocation || ''}
                  onChange={(e) => setTrip({ ...trip, deliveryLocation: e.target.value })}
                  placeholder="Enter delivery location"
                  className="tms-input"
                  list="delivery-locations-list"
                />
                <datalist id="delivery-locations-list">
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Trip Notes (optional)</label>
                <input
                  type="text"
                  value={trip.notes || ''}
                  onChange={(e) => setTrip({ ...trip, notes: e.target.value })}
                  placeholder="e.g. Site gate #2 entry"
                  className="tms-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & SUBMIT */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="pb-2 border-b border-[#D9DBD6]">
              <h2 className="text-sm font-bold text-[#16425B]">Step 7: Final Review & Submission</h2>
              <p className="text-xs text-[#5A6E7F]">
                Review all operational fields before submitting. Upon submission, core data will be locked.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-2">
                <h3 className="font-bold text-[#16425B] border-b pb-1">Trip Identity</h3>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Trip ID:</span>
                  <strong>{trip.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Business Date:</span>
                  <span>{trip.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Entry Operator:</span>
                  <span>{trip.enteredBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Operational Mode:</span>
                  <span className="font-semibold text-[#16425B]">
                    {trip.isNoLoad ? 'No Load' : 'Commercial Freight'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-2">
                <h3 className="font-bold text-[#16425B] border-b pb-1">Customer & Vehicle</h3>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Customer:</span>
                  <strong>{trip.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Vehicle Reg:</span>
                  <strong>{trip.vehicleRegistration}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Driver:</span>
                  <span>{trip.driverName}</span>
                </div>
              </div>

              <div className="p-4 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-2 sm:col-span-2">
                <h3 className="font-bold text-[#16425B] border-b pb-1">Cargo & Route</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[#5A6E7F] block">Material:</span>
                    <strong>{trip.isNoLoad ? 'No Load' : trip.material}</strong>
                  </div>
                  <div>
                    <span className="text-[#5A6E7F] block">Quantity:</span>
                    <strong>{trip.isNoLoad ? '0' : `${trip.quantity} ${trip.unit}`}</strong>
                  </div>
                  <div>
                    <span className="text-[#5A6E7F] block">Loading Location:</span>
                    <span>{trip.loadingLocation}</span>
                  </div>
                  <div>
                    <span className="text-[#5A6E7F] block">Delivery Location:</span>
                    <span>{trip.deliveryLocation}</span>
                  </div>
                </div>
                {trip.isNoLoad && (
                  <p className="mt-2 text-amber-800 text-[11px] font-semibold">
                    No Load Reason: {trip.noLoadReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WIZARD ACTIONS */}
        <div className="mt-8 pt-4 border-t border-[#D9DBD6] flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary disabled:opacity-50"
          >
            Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep} className="btn-primary">
              Continue: {STEPS[currentStep + 1]}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
            >
              Confirm & Submit Trip
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Submit Trip Dispatch?"
        message="Once this trip is submitted, core operational records will be locked for the Worker Portal. Are you ready to submit?"
        confirmLabel="Submit Trip"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
