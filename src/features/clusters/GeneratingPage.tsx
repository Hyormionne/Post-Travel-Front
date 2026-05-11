'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { ThumbPin, FrostedHeader, FAB, MapToggle, ZoomControls, Toast } from '../../components/ui';
import { INK, PAPER, TERRA, INK_FAINT, FONT_MONO } from '../../theme/tokens';

export function GeneratingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/complete'), 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Screen>
      <MapBg>
        <ThumbPin x={120} y={220} label="🌸" />
        <ThumbPin x={250} y={180} label="🌊" />
        <ThumbPin x={200} y={310} label="🍜" />
        <ThumbPin x={70} y={350} label="🎌" />
        <ThumbPin x={310} y={340} label="✨" pending />
      </MapBg>
      <FrostedHeader rightBadge />
      <ZoomControls />
      <MapToggle active="map" />
      <FAB />
      {/* Spinner dock */}
      <div style={{
        position: 'absolute', left: 14, top: 84,
        background: PAPER, border: `1px solid ${INK}`, borderRadius: 99,
        padding: '4px 10px 4px 6px', display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)', zIndex: 15,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `2px solid ${INK_FAINT}`, borderTopColor: TERRA,
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 9 }}>1개 작성 중</span>
      </div>
      <Toast>
        <span style={{ fontSize: 14 }}>✨</span>
        <span style={{ flex: 1 }}>블로그 작성을 시작했어요. 완료되면 알림으로 알려드릴게요!</span>
      </Toast>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Screen>
  );
}
