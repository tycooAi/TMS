'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, calculateDieselMileage, calculateTripKM } from '../../lib/calculations';
import { Plus, Fuel } from '../ui/Icons';
import { DieselRecord } from '../../types';
import { generateNextId } from '../../lib/ids';

export function AccountsDiesel() {
  const { dieselRecords, vehicles, drivers, accounts, recordDiesel } = useTmsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form State
  const [vehicleReg, setVehicleReg] = useState(vehicles[0]?.registration || '');
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  const [fuelStation, setFuelStation] = useState('Indian Oil Highway Outlet, Madurai');
  const [litres, setLitres] = useState<number>(60);
  const [ratePerLitre, setRatePerLitre] = useState<number>(94.5);
  const [startKm, setStartKm] = useState<number>(vehicles[0]?.currentKm ? vehicles[0].currentKm - 200 : 48000);
  const [endKm, setEndKm] = useState<number>(vehicles[0]?.currentKm || 48200);
  const [billNumber, setBillNumber] = useState('');
  const [targetAccount, setTargetAccount] = useState(accounts[0]?.name || 'State Bank of India (Main A/C)');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const distanceKm = calculateTripKM(startKm, endKm);
  const totalAmount = Math.round(litres * ratePerLitre);
  const mileage = calculateDieselMileage(distanceKm, litres);

  const handleOpenLog = () => {
    const v = vehicles.find((veh) => veh.registration === vehicleReg) || vehicles[0];
    setEndKm(v.currentKm);
    setStartKm(Math.max(0, v.currentKm - 200));
    setBillNumber(`IOCL-${Date.now().toString().slice(-5)}`);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveDiesel = () => {
    if (!billNumber.trim()) {
      setError('Fuel bill number is required.');
      return;
    }
    if (litres <= 0 || ratePerLitre <= 0) {
      setError('Litres and rate per litre must be greater than zero.');
      return;
    }
    if (endKm <= startKm) {
      setError('End KM must be greater than Start KM.');
      return;
    }

    try {
      const driver = drivers.find((d) => d.id === driverId) || drivers[0];
      const nextId = generateNextId('DSL', dieselRecords.map((d) => d.id));
      const now = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newRecord: DieselRecord = {
        id: nextId,
        vehicleRegistration: vehicleReg,
        driverId: driver.id,
        driverName: driver.name,
        fuelStation,
        date: now,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        litres,
        ratePerLitre,
        totalAmount,
        startKm,
        endKm,
        distanceKm,
        mileage,
        paymentAccount: targetAccount,
        billNumber: billNumber.trim(),
        notes,
        status: 'POSTED',
        createdBy: 'Anitha S',
      };

      recordDiesel(newRecord, 'Anitha S');
      setIsConfirmOpen(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error recording diesel.');
      setIsConfirmOpen(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Diesel & Fuel Management"
        description="Attributable vehicle fuel logging · Duplicate bill protection and mileage tracking"
      >
        <button onClick={handleOpenLog} className="btn-primary">
          <Plus size={16} />
          Log Diesel Filling
        </button>
      </PageHeader>

      {/* DIESEL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Diesel Consumed
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {dieselRecords.reduce((sum, d) => sum + d.litres, 0)} Litres
          </strong>
          <span className="text-xs text-[#5A6E7F]">Attributable to active fleet</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Fuel Expenditure
          </span>
          <strong className="text-2xl font-bold text-rose-700 block my-1">
            {formatCurrency(dieselRecords.reduce((sum, d) => sum + d.totalAmount, 0))}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Debited from treasury accounts</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Average Fleet Mileage
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {dieselRecords.length > 0
              ? (
                  dieselRecords.reduce((sum, d) => sum + d.mileage, 0) / dieselRecords.length
                ).toFixed(2)
              : '0'}{' '}
            KM / L
          </strong>
          <span className="text-xs text-[#5A6E7F]">Distance / Litres calculation</span>
        </div>
      </div>

      {/* DIESEL LOG TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Date & Time</th>
              <th>Vehicle No</th>
              <th>Driver</th>
              <th>Fuel Station</th>
              <th>Litres</th>
              <th>Rate / L</th>
              <th>Total Amount</th>
              <th>Distance</th>
              <th>Mileage</th>
              <th>Bill Number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dieselRecords.map((d) => (
              <tr key={d.id}>
                <td className="font-bold text-[#2F668F]">{d.id}</td>
                <td>{d.date} {d.time}</td>
                <td className="font-bold text-[#16425B]">{d.vehicleRegistration}</td>
                <td>{d.driverName}</td>
                <td className="text-xs text-[#5A6E7F]">{d.fuelStation}</td>
                <td className="font-semibold">{d.litres} L</td>
                <td>₹{d.ratePerLitre}</td>
                <td className="font-bold text-rose-700">{formatCurrency(d.totalAmount)}</td>
                <td>{d.distanceKm} KM</td>
                <td>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-xs">
                    {d.mileage} KM/L
                  </span>
                </td>
                <td className="font-mono text-xs">{d.billNumber}</td>
                <td>
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LOG DIESEL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Diesel Fuel Filling"
        subtitle="Calculate fuel consumption, mileage, and prevent duplicate bills"
        maxWidth="max-w-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Vehicle Registration *</label>
              <select
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value)}
                className="tms-input font-bold"
              >
                {vehicles.map((v) => (
                  <option key={v.registration} value={v.registration}>
                    {v.registration} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Driver In-Charge *</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="tms-input"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Fuel Station Outlet</label>
              <input
                type="text"
                value={fuelStation}
                onChange={(e) => setFuelStation(e.target.value)}
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Fuel Litres (L) *</label>
              <input
                type="number"
                value={litres || ''}
                onChange={(e) => setLitres(Number(e.target.value))}
                className="tms-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Rate per Litre (₹/L) *</label>
              <input
                type="number"
                step="0.01"
                value={ratePerLitre || ''}
                onChange={(e) => setRatePerLitre(Number(e.target.value))}
                className="tms-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Start Odometer KM *</label>
              <input
                type="number"
                value={startKm || ''}
                onChange={(e) => setStartKm(Number(e.target.value))}
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">End Odometer KM *</label>
              <input
                type="number"
                value={endKm || ''}
                onChange={(e) => setEndKm(Number(e.target.value))}
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Fuel Bill Number (Duplicate Protected) *
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. IOCL-8821"
                className="tms-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Payment Account</label>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                className="tms-input"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CALCULATED STRIP */}
          <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg grid grid-cols-3 gap-2">
            <div>
              <span className="text-[#5A6E7F] block">Total Amount:</span>
              <strong className="text-rose-700 font-bold">{formatCurrency(totalAmount)}</strong>
            </div>
            <div>
              <span className="text-[#5A6E7F] block">Distance Traveled:</span>
              <strong className="text-[#16425B]">{distanceKm} KM</strong>
            </div>
            <div>
              <span className="text-[#5A6E7F] block">Calculated Mileage:</span>
              <strong className="text-emerald-700">{mileage} KM / Litre</strong>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              Post Diesel Entry
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Diesel Posting?"
        message={`This will post ${litres}L (Total: ${formatCurrency(totalAmount)}) for ${vehicleReg} with calculated mileage of ${mileage} KM/L. Proceed?`}
        confirmLabel="Confirm Fuel Log"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSaveDiesel}
      />
    </div>
  );
}
