'use client';
import { Suspense } from 'react';
import { ClusterResultPage } from '../../features/clusters/ClusterResultPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClusterResultPage />
    </Suspense>
  );
}
