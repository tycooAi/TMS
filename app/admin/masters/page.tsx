'use client';

import React, { useState } from 'react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ManagerMasterPage, MasterEntityKey } from '../../../components/manager/ManagerMasterPage';
import { Users, Truck, Building2, MapPin, DollarSign, FileText } from '../../../components/ui/Icons';

export default function AdminMastersPage() {
  const [activeMaster, setActiveMaster] = useState<MasterEntityKey>('customers');

  const masterTabs = [
    { key: 'customers' as MasterEntityKey, label: 'Customers', icon: Building2, desc: 'Central customer directory with GSTIN & credit limits' },
    { key: 'vehicles' as MasterEntityKey, label: 'Fleet / Vehicles', icon: Truck, desc: 'Vehicle registrations, capacity, and status' },
    { key: 'drivers' as MasterEntityKey, label: 'Drivers', icon: Users, desc: 'Driver licenses, phones, and vehicle assignments' },
    { key: 'workers' as MasterEntityKey, label: 'Workers', icon: Users, desc: 'Operational workers, shifts, and wage structures' },
    { key: 'materials' as MasterEntityKey, label: 'Materials', icon: FileText, desc: 'Aggregates, sand, and billing types' },
    { key: 'sources' as MasterEntityKey, label: 'Crushers / Sources', icon: MapPin, desc: 'Loading sites, contact persons, and geolocations' },
    { key: 'locations' as MasterEntityKey, label: 'Delivery Locations', icon: MapPin, desc: 'Destination zones and standard route distances' },
    { key: 'rates' as MasterEntityKey, label: 'Rate Cards', icon: DollarSign, desc: 'Standard freight rates per ton or fixed trip tariffs' },
  ];

  const getMasterConfig = (key: MasterEntityKey) => {
    switch (key) {
      case 'customers':
        return {
          title: 'Master Customer Directory',
          description: 'Single centralized master used by Accounts, Operations, and Workers.',
          prefix: 'CUS',
          fields: [
            { key: 'name', label: 'Company / Customer Name' },
            { key: 'phone', label: 'Primary Contact Phone' },
            { key: 'gstin', label: 'GSTIN / Tax ID' },
            { key: 'billingType', label: 'Billing Model', type: 'select' as const, options: ['PER_TON', 'FIXED_PER_TRIP'] },
            { key: 'creditLimit', label: 'Credit Limit (₹)', type: 'number' as const },
            { key: 'status', label: 'Account Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      case 'vehicles':
        return {
          title: 'Master Vehicle Fleet',
          description: 'Company-owned and attached trucks.',
          prefix: 'VEH',
          fields: [
            { key: 'registrationNumber', label: 'Registration Number' },
            { key: 'makeModel', label: 'Make & Model' },
            { key: 'capacityTons', label: 'Capacity (Tons)', type: 'number' as const },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] },
          ],
        };
      case 'drivers':
        return {
          title: 'Master Driver Registry',
          description: 'Commercial drivers assigned to fleet vehicles.',
          prefix: 'DRV',
          fields: [
            { key: 'name', label: 'Driver Full Name' },
            { key: 'phone', label: 'Contact Phone' },
            { key: 'licenseNumber', label: 'License Number' },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      case 'workers':
        return {
          title: 'Master Worker Registry',
          description: 'On-site supervisors and field dispatchers.',
          prefix: 'WRK',
          fields: [
            { key: 'name', label: 'Worker Full Name' },
            { key: 'phone', label: 'Contact Phone' },
            { key: 'roleTitle', label: 'Designation' },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      case 'materials':
        return {
          title: 'Master Materials & Commodities',
          description: 'Sand, metal gravel, aggregates, and billing units.',
          prefix: 'MAT',
          fields: [
            { key: 'name', label: 'Material Name' },
            { key: 'unit', label: 'Unit of Measure', type: 'select' as const, options: ['TON', 'TRIP', 'CFT'] },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      case 'sources':
        return {
          title: 'Master Crusher & Quarry Sources',
          description: 'Loading sites and supply points.',
          prefix: 'SRC',
          fields: [
            { key: 'name', label: 'Crusher / Source Name' },
            { key: 'location', label: 'Location' },
            { key: 'contactPerson', label: 'Site Incharge' },
            { key: 'phone', label: 'Contact Phone' },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      case 'locations':
        return {
          title: 'Master Delivery Destinations',
          description: 'Drop points, customer sites, and unloading yards.',
          prefix: 'LOC',
          fields: [
            { key: 'name', label: 'Destination Name' },
            { key: 'address', label: 'Full Site Address' },
            { key: 'distanceKm', label: 'Standard Distance (KM)', type: 'number' as const },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      case 'rates':
        return {
          title: 'Master Freight Tariffs & Rates',
          description: 'Standard contracted prices for routes and materials.',
          prefix: 'RAT',
          fields: [
            { key: 'rateBasis', label: 'Rate Basis', type: 'select' as const, options: ['PER_TON', 'FIXED_PER_TRIP'] },
            { key: 'defaultRate', label: 'Standard Rate (₹)', type: 'number' as const },
            { key: 'status', label: 'Status', type: 'select' as const, options: ['ACTIVE', 'INACTIVE'] },
          ],
        };
      default:
        return {
          title: 'Master Data',
          description: 'Manage master entities',
          prefix: 'MST',
          fields: [{ key: 'name', label: 'Name' }],
        };
    }
  };

  const currentCfg = getMasterConfig(activeMaster);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Master Records"
        description="Full administrative control over all shared master records across Logistics, Billing, and Dispatch"
      />

      {/* Master Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#D9DBD6]">
        {masterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveMaster(tab.key)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeMaster === tab.key
                ? 'bg-[#2F668F] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#D9DBD6]'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render selected Master View */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] p-6">
        <ManagerMasterPage
          entityKey={activeMaster}
          title={currentCfg.title}
          description={currentCfg.description}
          prefix={currentCfg.prefix}
          fields={currentCfg.fields}
        />
      </div>
    </div>
  );
}
