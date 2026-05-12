'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { MainShell } from '../../components/MainShell';
import { INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, TERRA, FONT_HAND, FONT_MONO } from '../../theme/tokens';
import { listTrips } from './api';
import type { TripSummary } from '../../mocks/data';
import { MOCK_WRITING_IN_PROGRESS } from '../../mocks/data';

export function TimelinePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);

  useEffect(() => {
    listTrips().then(setTrips).catch(() => {});
  }, []);

  // 연도별 그룹
  const groups = useMemo(() => {
    const m = new Map<string, TripSummary[]>();
    for (const t of trips) {
      const arr = m.get(t.year) ?? [];
      arr.push(t);
      m.set(t.year, arr);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [trips]);

  const openTrip = (id: string) => router.push(`/trip-detail?roomId=${encodeURIComponent(id)}`);

  return (
    <Screen scrollable>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '32px 14px 8px',
        background: 'rgba(246,241,230,0.92)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${INK_FAINT}`,
        display: 'flex', alignItems: 'center',
      }}>
        <span onClick={() => router.push('/')} style={{ fontSize: 16, cursor: 'pointer' }}>←</span>
      </div>
      <div style={{ padding: '14px 16px 80px' }}>
        <div style={{ fontFamily: FONT_HAND, fontSize: 22, lineHeight: 1, marginBottom: 4 }}>나의 여행들</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 14 }}>
          총 {trips.length + 1} · 시간 역순 ▾
        </div>

        {groups.map(([year, list], gi) => (
          <div key={year}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
              letterSpacing: '0.08em', margin: gi === 0 ? '0 0 8px' : '14px 0 8px',
            }}>{year}</div>
            {list.map((trip, i) => (
              <div key={trip.id} onClick={() => openTrip(trip.id)} style={{
                display: 'flex', gap: 10, padding: 10, marginBottom: 8,
                borderRadius: 12,
                border: year === '2025' ? `1.2px solid ${INK}` : `1px solid ${INK_FAINT}`,
                background: PAPER, position: 'relative', cursor: 'pointer',
              }}>
                <div style={{
                  width: year === '2025' ? 44 : 38, height: year === '2025' ? 44 : 38,
                  borderRadius: '50% 50% 50% 8%',
                  transform: 'rotate(-45deg)', background: '#d8c9a5',
                  border: `1.2px solid ${INK}`, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ transform: 'rotate(45deg)', fontSize: year === '2025' ? 18 : 16 }}>{trip.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: year === '2025' ? 12 : 11 }}>{trip.title}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                    {trip.dates}{year === '2025' ? ` · ${trip.info}` : ''}
                  </div>
                  {year === '2025' && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                      {[0, 1, 2, 3].map((j) => (
                        <PhotoTile key={j} w={36} h={36} label={String.fromCharCode(65 + i * 4 + j)} />
                      ))}
                      <div style={{
                        width: 36, height: 36, borderRadius: 4,
                        background: PAPER_2, border: `1px dashed ${INK_FAINT}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT,
                      }}>+</div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* In-progress 카드는 2025 그룹 끝에만 */}
            {year === '2025' && (
              <div
                onClick={() => router.push('/generating')}
                style={{
                  padding: 10, marginBottom: 8,
                  borderRadius: 12, border: `1.2px dashed ${TERRA}`,
                  display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${INK_FAINT}`, borderTopColor: TERRA,
                  animation: 'spin 1s linear infinite',
                }} />
                <div style={{ flex: 1, fontSize: 11 }}>
                  <b>'{MOCK_WRITING_IN_PROGRESS.title}'</b> 블로그 작성 중...
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>
                  {MOCK_WRITING_IN_PROGRESS.elapsed}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <MainShell activeTab="timeline" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Screen>
  );
}
