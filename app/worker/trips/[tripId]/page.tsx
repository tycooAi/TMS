'use client';

import { useParams } from 'next/navigation';
import { WorkerTripDetail } from '../../../../components/worker/WorkerTripDetail';

export default function WorkerTripDetailPage() {
  const params = useParams();
  const tripId = Array.isArray(params?.tripId) ? params.tripId[0] : (params?.tripId as string) || '';

  return <WorkerTripDetail tripId={tripId} />;
}
