'use client';

import { AuditTrailsView } from '../../../components/shared/AuditTrailsView';

export default function MdAuditPage() {
  return (
    <AuditTrailsView
      portalTitle="System Audit & Governance Journal"
      portalDescription="Comprehensive executive audit trail of all operational, financial, master data, and approval actions across Sri Amman Arul Transports"
      scope="MD"
    />
  );
}
