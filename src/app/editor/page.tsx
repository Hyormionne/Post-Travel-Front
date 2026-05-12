'use client';
import { Suspense } from 'react';
import { EditorPage } from '../../features/blog/EditorPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditorPage />
    </Suspense>
  );
}
