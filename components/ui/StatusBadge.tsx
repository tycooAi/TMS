import React from 'react';
import { TripStatus, InvoiceStatus, TransactionStatus } from '../../types';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = status.toUpperCase().replace(/\s+/g, '_');

  let variantClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotColor = '#64748b';

  // Trip statuses
  if (norm === 'DELIVERED' || norm === 'COMPLETED' || norm === 'ACTIVE' || norm === 'PAID' || norm === 'POSTED') {
    variantClass = 'bg-[#eef8f2] text-[#207a4c] border-[#a5dfbe]';
    dotColor = '#207a4c';
  } else if (norm === 'RUNNING' || norm === 'IN_TRANSIT' || norm === 'LOADED') {
    variantClass = 'bg-[#edf7fc] text-[#1c648d] border-[#81c4d7]';
    dotColor = '#1c648d';
  } else if (norm === 'SUBMITTED' || norm === 'ASSIGNED' || norm === 'GENERATED') {
    variantClass = 'bg-[#e8f1f5] text-[#16425b] border-[#a1c4d8]';
    dotColor = '#16425b';
  } else if (
    norm === 'DRAFT' ||
    norm === 'PENDING' ||
    norm === 'PAYMENT_PENDING' ||
    norm === 'PARTIALLY_PAID' ||
    norm === 'PENDING_MD' ||
    norm === 'CORRECTION_REQUESTED'
  ) {
    variantClass = 'bg-[#fef8eb] text-[#b45309] border-[#fde68a]';
    dotColor = '#b45309';
  } else if (norm === 'CANCELLED' || norm === 'INACTIVE' || norm === 'REJECTED') {
    variantClass = 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]';
    dotColor = '#b91c1c';
  } else if (norm === 'NO_LOAD') {
    variantClass = 'bg-[#f3f4f6] text-[#4b5563] border-[#d1d5db]';
    dotColor = '#6b7280';
  }

  const formatText = (s: string) => {
    return s.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${variantClass} ${className}`}
      style={{ letterSpacing: '0.01em' }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
        }}
      />
      {formatText(status)}
    </span>
  );
}
