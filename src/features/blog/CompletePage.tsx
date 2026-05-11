'use client';

import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { ThumbPin, FrostedHeader, FAB, MapToggle, ZoomControls, Toast } from '../../components/ui';
import { TERRA, SAGE } from '../../theme/tokens';

export function CompletePage() {
  const router = useRouter();

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
      {/* Badge */}
      <div style={{
        position: 'absolute', top: 36, right: 22,
        width: 14, height: 14, borderRadius: '50%',
        background: TERRA, color: 'white',
        fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px',
        border: '1.5px solid white', zIndex: 20,
      }}>1</div>
      <MapToggle active="map" />
      <FAB onClick={() => router.push('/upload')} />
      <Toast>
        <span style={{ fontSize: 14 }}>🔔</span>
        <span style={{ flex: 1 }}>
          <b>'홋카이도, 5월'</b> 블로그 초안이 완성되었어요!
        </span>
        <span onClick={() => router.push('/editor')} style={{ color: SAGE, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          열기 →
        </span>
      </Toast>
    </Screen>
  );
}
