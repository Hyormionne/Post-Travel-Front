'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { FrostedHeader, FAB, MapToggle, ZoomControls } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, FONT_HAND, FONT_MONO } from '../../theme/tokens';

const OpenMapBg = dynamic(
  () => import('../../components/OpenMapBg').then((m) => m.OpenMapBg),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: '#ede6d4' }} /> },
);

const PINS = [
  { lat: 37.5665, lng: 126.9780, label: '🌸', title: '서울, 봄 산책', date: '2025.04.22', info: '하루 · 일행 1' },
  { lat: 35.1796, lng: 129.0756, label: '🌊', title: '부산 주말', date: '2025.03.08 — 03.09', info: '2일 · 일행 2' },
  { lat: 43.0642, lng: 141.3469, label: '🍜', title: '삿포로의 맛', date: '2025.05.12 — 05.16', info: '5일 · 일행 3' },
  { lat: 35.0116, lng: 135.7681, label: '🎌', title: '교토 가을', date: '2024.11.02 — 11.05', info: '4일 · 일행 2' },
  { lat: 43.2203, lng: 142.8635, label: '✨', title: '홋카이도, 5월', date: '2025.05.12 — 05.16', info: '5일 · 일행 3', pending: true },
];

export function MainMapPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <Screen>
      <OpenMapBg
        pins={PINS.map(({ lat, lng, label, pending }) => ({ lat, lng, label, pending }))}
        center={[134, 38.5]}
        zoom={5}
        onPinClick={(i) => setSelected(selected === i ? null : i)}
      />
      <FrostedHeader rightBadge />
      <ZoomControls />
      <MapToggle active="map" onToggle={(v) => { if (v === 'timeline') router.push('/timeline'); }} />
      <FAB onClick={() => router.push('/upload')} />

      {selected !== null && (
        <div onClick={() => router.push('/trip-detail')} style={{
          position: 'absolute', left: 12, right: 12, bottom: 14,
          background: '#f6f1e6', borderRadius: 14,
          border: `1.2px solid ${INK}`,
          padding: 10,
          boxShadow: '0 -6px 16px rgba(0,0,0,0.08)',
          cursor: 'pointer', zIndex: 10,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50% 50% 50% 8%',
              transform: 'rotate(-45deg)', background: '#d8c9a5',
              border: `1.2px solid ${INK}`, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: 16 }}>{PINS[selected].label}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{PINS[selected].title}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                {PINS[selected].date} · {PINS[selected].info}
              </div>
              <div style={{ fontFamily: FONT_HAND, fontSize: 13, marginTop: 4, color: INK_SOFT }}>
                "눈 덮인 비에이의 아침이 가장 기억에 남는..."
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px dashed ${INK_FAINT}`, paddingTop: 8 }} />
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <PhotoTile key={i} w={42} h={42} label={String.fromCharCode(65 + selected * 5 + i)} />
            ))}
            <div style={{
              width: 42, height: 42, borderRadius: 4,
              border: `1px dashed ${INK_FAINT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
            }}>+</div>
          </div>
        </div>
      )}
    </Screen>
  );
}
