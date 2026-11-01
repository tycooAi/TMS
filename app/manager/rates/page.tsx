'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerRatesPage() {
  return (
    <ManagerMasterPage
      entityKey="rates"
      title="Commercial Rates Configuration"
      description="Configure customer freight rates and crusher supply prices · Rate updates preserve historical trip billing"
      idField="id"
      prefix="RAT"
      fields={[
        {
          key: 'rateType',
          label: 'Rate Classification',
          type: 'select',
          options: ['CUSTOMER', 'CRUSHER', 'TRANSPORT'],
        },
        { key: 'material', label: 'Material' },
        { key: 'loadingLocation', label: 'Loading Location' },
        { key: 'deliveryLocation', label: 'Delivery Location' },
        { key: 'rate', label: 'Rate (₹)', type: 'number' },
        {
          key: 'unit',
          label: 'Unit',
          type: 'select',
          options: ['Ton', 'CFT', 'Load'],
        },
        { key: 'effectiveFrom', label: 'Effective From (YYYY-MM-DD)' },
      ]}
    />
  );
}
