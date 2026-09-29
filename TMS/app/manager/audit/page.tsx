'use client';

import { AuditTrailsView } from '../../../components/shared/AuditTrailsView';

export default function ManagerAuditPage() {
  return (
    <AuditTrailsView
      portalTitle="Operational Audit Trails"
      portalDescription="Chronological log of operational dispatches, customer change requests, rate revisions, and master data activities"
      scope="MANAGER"
    />
  );
}
