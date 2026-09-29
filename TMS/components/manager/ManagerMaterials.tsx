'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, Search, Edit3, Trash2, Factory, DollarSign, CheckCircle2, AlertCircle } from '../ui/Icons';
import { generateNextId } from '../../lib/ids';
import { formatCurrency } from '../../lib/calculations';
import { Material, ConfiguredRate, Source } from '../../types';
import {
  findCrusherPurchaseRate,
  getCrusherRatesForMaterial,
  normalizeMaterialName,
  normalizeCrusherName,
} from '../../lib/rates';

export function ManagerMaterials() {
  const store = useTmsStore();
  const { materials, sources, rates, saveMasterItem, deleteMasterItem } = store;

  const [query, setQuery] = useState('');
  const [selectedCrusherFilter, setSelectedCrusherFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal: Edit/Create Material
  const [materialModal, setMaterialModal] = useState<Material | null>(null);
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);

  // Modal: Configure Crusher + Material Rate
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateSourceId, setRateSourceId] = useState<string>(sources[0]?.id || '');
  const [rateMaterial, setRateMaterial] = useState<string>(materials[0]?.name || '');
  const [ratePrice, setRatePrice] = useState<number>(2500);
  const [rateEffectiveFrom, setRateEffectiveFrom] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [rateStatus, setRateStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [rateModalError, setRateModalError] = useState<string>('');
  const [rateSuccessMessage, setRateSuccessMessage] = useState<string>('');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchQ && matchStatus;
  });

  const handleOpenAddMaterial = () => {
    const newId = generateNextId(
      'MAT',
      materials.map((m) => m.id)
    );
    setMaterialModal({
      id: newId,
      name: '',
      category: 'Aggregates',
      standardUnit: 'Ton',
      status: 'ACTIVE',
    });
    setIsEditingMaterial(false);
  };

  const handleOpenEditMaterial = (m: Material) => {
    setMaterialModal({ ...m });
    setIsEditingMaterial(true);
  };

  const handleSaveMaterial = () => {
    if (!materialModal || !materialModal.name.trim()) return;
    saveMasterItem('materials', materialModal, 'id', 'Rajesh V', 'MANAGER');
    setMaterialModal(null);
  };

  const handleOpenConfigureRate = (materialName?: string, sourceId?: string) => {
    setRateModalError('');
    setRateSuccessMessage('');
    const targetMat = materialName || materials[0]?.name || 'Black M-Sand';
    const targetSrcId = sourceId || (selectedCrusherFilter !== 'ALL' ? selectedCrusherFilter : sources[0]?.id || '');

    setRateMaterial(targetMat);
    setRateSourceId(targetSrcId);

    // If an existing rate exists, prefill
    const existing = findCrusherPurchaseRate(sources, rates, targetSrcId, targetMat);
    if (existing && existing.rate) {
      setRatePrice(existing.rate);
      setRateEffectiveFrom(existing.effectiveFrom || new Date().toISOString().split('T')[0]);
    } else {
      setRatePrice(2500);
      setRateEffectiveFrom(new Date().toISOString().split('T')[0]);
    }

    setIsRateModalOpen(true);
  };

  const handleSaveCrusherRate = () => {
    setRateModalError('');
    if (!rateSourceId) {
      setRateModalError('Please select a Crusher / Quarry Source.');
      return;
    }
    if (!rateMaterial) {
      setRateModalError('Please select a Material.');
      return;
    }
    if (!ratePrice || ratePrice <= 0) {
      setRateModalError('Purchase Price per Ton must be greater than ₹0.');
      return;
    }
    if (!rateEffectiveFrom) {
      setRateModalError('Effective Date is required.');
      return;
    }

    const selectedSource = sources.find((s) => s.id === rateSourceId || s.name === rateSourceId) || sources[0];

    // Check if matching rate already exists in rates table
    const existingRate = rates.find((r) => {
      if (r.rateType !== 'CRUSHER') return false;
      const matMatches = normalizeMaterialName(r.material) === normalizeMaterialName(rateMaterial);
      const srcMatches =
        r.sourceId?.toLowerCase() === rateSourceId.toLowerCase() ||
        r.sourceId?.toLowerCase() === selectedSource?.name.toLowerCase() ||
        r.loadingLocation?.toLowerCase().includes(selectedSource?.name.toLowerCase());
      return matMatches && srcMatches;
    });

    const rateId = existingRate ? existingRate.id : generateNextId('RAT', rates.map((r) => r.id));

    const rateRecord: ConfiguredRate = {
      id: rateId,
      rateType: 'CRUSHER',
      sourceId: selectedSource.id,
      material: rateMaterial,
      loadingLocation: selectedSource.name,
      deliveryLocation: 'All Sites',
      rate: Number(ratePrice),
      unit: 'Ton',
      effectiveFrom: rateEffectiveFrom,
      status: rateStatus,
    };

    saveMasterItem('rates', rateRecord, 'id', 'Rajesh V', 'MANAGER');

    // Also update source pricePerTon if this is the primary material
    if (normalizeMaterialName(selectedSource.material) === normalizeMaterialName(rateMaterial)) {
      saveMasterItem(
        'sources',
        {
          ...selectedSource,
          pricePerTon: Number(ratePrice),
          effectiveFrom: rateEffectiveFrom,
        },
        'id',
        'Rajesh V',
        'MANAGER'
      );
    }

    setIsRateModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    deleteMasterItem('materials', deleteTargetId, 'id', 'Rajesh V', 'MANAGER');
    setDeleteTargetId(null);
  };

  return (
    <div>
      <PageHeader
        title="Freight Materials & Crusher Pricing"
        description="Material catalog and Crusher-dependent purchase rates per ton · Historical dispatches remain preserved"
      >
        <button
          onClick={() => handleOpenConfigureRate()}
          className="btn-secondary flex items-center gap-1.5"
        >
          <DollarSign size={15} />
          Configure Crusher Price
        </button>
        <button onClick={handleOpenAddMaterial} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} />
          + Add New Material
        </button>
      </PageHeader>

      {/* FILTER & SEARCH TOOLS */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search material name, category..."
            className="tms-input pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* CRUSHER FILTER SELECTOR */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#5A6E7F] whitespace-nowrap">Crusher / Source:</span>
            <select
              value={selectedCrusherFilter}
              onChange={(e) => setSelectedCrusherFilter(e.target.value)}
              className="tms-input w-48 font-semibold text-[#16425B]"
            >
              <option value="ALL">All Crushers (Summary)</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="tms-input w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* PRICING POLICY BANNER */}
      <div className="mb-6 p-4 rounded-lg bg-[#f0f7fb] border border-[#2F668F]/30 flex items-start gap-3">
        <Factory size={20} className="text-[#2F668F] shrink-0 mt-0.5" />
        <div className="text-xs text-[#16425B]">
          <strong className="block font-bold mb-0.5">
            Crusher + Material Purchase Price Relationship Model
          </strong>
          <p className="text-[#5A6E7F] leading-relaxed">
            Purchase prices are strictly determined by the combination of <strong>Crusher/Source + Material</strong>.
            The Worker Portal dynamically reads this shared rate when creating trips. Rate changes take effect for new trips
            while existing trip dispatches maintain immutable historical rate integrity.
          </p>
        </div>
      </div>

      {/* MATERIALS & CRUSHER PRICING TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Material ID</th>
              <th>Material Name</th>
              <th>Category</th>
              <th>Measurement Unit</th>
              {selectedCrusherFilter === 'ALL' ? (
                <th>Configured Crusher Purchase Rates (₹/Ton)</th>
              ) : (
                <th>
                  {sources.find((s) => s.id === selectedCrusherFilter)?.name || 'Selected Crusher'} Rate
                </th>
              )}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((m) => {
              // If ALL crushers view:
              const crusherRates = getCrusherRatesForMaterial(m.name, sources, rates);

              // If specific crusher selected:
              const specificRate =
                selectedCrusherFilter !== 'ALL'
                  ? findCrusherPurchaseRate(sources, rates, selectedCrusherFilter, m.name)
                  : null;

              return (
                <tr key={m.id}>
                  <td className="font-bold text-[#2F668F] font-mono">{m.id}</td>
                  <td className="font-bold text-[#16425B]">{m.name}</td>
                  <td className="text-xs text-[#5A6E7F]">{m.category}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-[#16425B] text-xs font-semibold">
                      {m.standardUnit}
                    </span>
                  </td>

                  {/* PRICING COLUMN */}
                  <td>
                    {selectedCrusherFilter === 'ALL' ? (
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {crusherRates.length > 0 ? (
                          crusherRates.map((cr, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#e8f1f5] border border-[#2F668F]/30 text-xs text-[#16425B]"
                            >
                              <strong className="text-[#2F668F]">{cr.crusherName}:</strong>
                              <span className="font-bold text-[#16425B]">₹{cr.rate.toLocaleString('en-IN')} / Ton</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-amber-700 italic flex items-center gap-1">
                            <AlertCircle size={13} />
                            Not configured
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        {specificRate && specificRate.rate ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#16425B]">
                              ₹{specificRate.rate.toLocaleString('en-IN')} / Ton
                            </span>
                            {specificRate.effectiveFrom && (
                              <span className="text-[11px] text-[#5A6E7F]">
                                (From: {specificRate.effectiveFrom})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Not configured
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    <StatusBadge status={m.status || 'ACTIVE'} />
                  </td>

                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleOpenConfigureRate(
                            m.name,
                            selectedCrusherFilter !== 'ALL' ? selectedCrusherFilter : undefined
                          )
                        }
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-[#2F668F] text-white hover:bg-[#16425B] transition-colors"
                        title="Configure / Update Crusher Price for this Material"
                      >
                        Set Price
                      </button>
                      <button
                        onClick={() => handleOpenEditMaterial(m)}
                        className="p-1.5 text-[#2F668F] hover:bg-[#e8f1f5] rounded"
                        title="Edit Material Catalog"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(m.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[#5A6E7F]">
                  No matching materials found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIGURE CRUSHER + MATERIAL RATE MODAL */}
      {isRateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRateModalOpen(false)}
          title="Configure Crusher + Material Purchase Rate"
          subtitle="Set purchase price per ton for specific Crusher and Material combination"
          maxWidth="max-w-lg"
        >
          {rateModalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{rateModalError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Crusher / Quarry Source <span className="text-red-500">*</span>
              </label>
              <select
                value={rateSourceId}
                onChange={(e) => setRateSourceId(e.target.value)}
                className="tms-input font-bold text-[#16425B]"
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Material <span className="text-red-500">*</span>
              </label>
              <select
                value={rateMaterial}
                onChange={(e) => setRateMaterial(e.target.value)}
                className="tms-input font-bold text-[#16425B]"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Purchase Price per Ton (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ratePrice || ''}
                  onChange={(e) => setRatePrice(Number(e.target.value))}
                  placeholder="e.g. 2500"
                  required
                  className="tms-input pl-7 font-bold text-base text-[#16425B]"
                />
              </div>
              <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                This exact price per ton will automatically populate for Worker New Trip dispatches.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rateEffectiveFrom}
                  onChange={(e) => setRateEffectiveFrom(e.target.value)}
                  required
                  className="tms-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Status</label>
                <select
                  value={rateStatus}
                  onChange={(e) => setRateStatus(e.target.value as any)}
                  className="tms-input"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg text-[11px] text-[#5A6E7F]">
              <strong>Historical Rate Preservation:</strong> Saving this rate updates the shared company commercial rates.
              Existing dispatches and historical invoices remain preserved and will not be recalculated.
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrusherRate}
                className="btn-primary"
              >
                Save Crusher Rate
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT MATERIAL MODAL */}
      {materialModal && (
        <Modal
          isOpen={true}
          onClose={() => setMaterialModal(null)}
          title={`${isEditingMaterial ? 'Edit' : 'Add New'} Material`}
          subtitle="Add or update items in the company freight materials catalog"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Material ID</label>
              <input
                type="text"
                value={materialModal.id}
                readOnly
                className="tms-input bg-gray-50 text-[#5A6E7F] font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Material Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={materialModal.name}
                onChange={(e) => setMaterialModal({ ...materialModal, name: e.target.value })}
                placeholder="e.g. 20 MM Blue Metal"
                required
                className="tms-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Category</label>
              <input
                type="text"
                value={materialModal.category}
                onChange={(e) => setMaterialModal({ ...materialModal, category: e.target.value })}
                placeholder="e.g. Aggregates / Manufactured Sand / Road Base"
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Measurement Unit</label>
              <select
                value={materialModal.standardUnit}
                onChange={(e) =>
                  setMaterialModal({ ...materialModal, standardUnit: e.target.value as any })
                }
                className="tms-input"
              >
                <option value="Ton">Ton</option>
                <option value="CFT">CFT</option>
                <option value="Load">Load</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Status</label>
              <select
                value={materialModal.status}
                onChange={(e) =>
                  setMaterialModal({ ...materialModal, status: e.target.value as any })
                }
                className="tms-input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setMaterialModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMaterial}
                className="btn-primary"
              >
                Save Material
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Material?"
        message="Are you sure you want to delete this material? Existing trips will retain their historical material names."
        confirmLabel="Delete"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
