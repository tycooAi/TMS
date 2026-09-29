'use client';

import React, { Suspense } from 'react';
import { WorkerNewTrip } from '../../../../components/worker/WorkerNewTrip';

export default function WorkerNewTripPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#5A6E7F]">Loading dispatch wizard...</div>}>
      <WorkerNewTrip />
    </Suspense>
  );
}
