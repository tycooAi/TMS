'use client';

import { useParams } from 'next/navigation';
import { WorkerTripStatus } from '../../../../../components/worker/WorkerTripStatus';

export default function WorkerTripStatusPage() {
  const params = useParams();
  const tripId = Array.isArray(params?.tripId) ? params.tripId[0] : (params?.tripId as string) || '';

  return <WorkerTripStatus tripId={tripId} />;
}
