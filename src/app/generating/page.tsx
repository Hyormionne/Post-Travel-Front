'use client';
import { Suspense } from 'react';
import { GeneratingPage } from '../../features/clusters/GeneratingPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GeneratingPage />
    </Suspense>
  );
}
