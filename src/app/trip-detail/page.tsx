'use client';
import { Suspense } from 'react';
import { TripDetailPage } from '../../features/trips/TripDetailPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TripDetailPage />
    </Suspense>
  );
}
