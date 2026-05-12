'use client';

import { useRouter } from 'next/navigation';
import { MapToggle, FAB } from './ui';

interface MainShellProps {
  activeTab?: 'map' | 'timeline';
  onFabClick?: () => void;
}

// 메인 맵/여행 상세/타임라인 공통 하단 쉘 (좌측 토글 + 우측 FAB).
export function MainShell({ activeTab = 'map', onFabClick }: MainShellProps) {
  const router = useRouter();
  return (
    <>
      <MapToggle
        active={activeTab}
        onToggle={(v) => {
          if (v === 'map' && activeTab !== 'map') router.push('/');
          if (v === 'timeline' && activeTab !== 'timeline') router.push('/timeline');
        }}
      />
      <FAB onClick={onFabClick ?? (() => router.push('/upload'))} />
    </>
  );
}
