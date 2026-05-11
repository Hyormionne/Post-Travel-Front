'use client';

import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { MOCK_TRIPS } from '../../mocks/data';
import { INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, TERRA, FONT_HAND, FONT_MONO } from '../../theme/tokens';

export function TimelinePage() {
  const router = useRouter();

  return (
    <Screen scrollable>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        paddingTop: 32, padding: '32px 14px 8px',
        background: 'rgba(246,241,230,0.92)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${INK_FAINT}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={() => router.push('/')} style={{ fontSize: 16, cursor: 'pointer' }}>←</span>
        <div style={{
          display: 'flex', background: PAPER_2, borderRadius: 99,
          border: `1px solid ${INK_FAINT}`, padding: 2, gap: 2,
        }}>
          {['지도', '타임라인'].map((s, i) => (
            <div key={s} onClick={() => { if (i === 0) router.push('/'); }} style={{
              padding: '4px 12px', borderRadius: 99,
              background: i === 1 ? INK : 'transparent',
              color: i === 1 ? PAPER : INK,
              fontSize: 10, fontWeight: 500, cursor: 'pointer',
            }}>{s}</div>
          ))}
        </div>
        <span style={{ fontSize: 14 }}>⋯</span>
      </div>
      <div style={{ padding: '14px 16px 32px' }}>
        <div style={{ fontFamily: FONT_HAND, fontSize: 22, lineHeight: 1, marginBottom: 4 }}>나의 여행들</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 14 }}>
          총 {MOCK_TRIPS.length + 1} · 시간 역순 ▾
        </div>
        {/* Year header */}
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
          letterSpacing: '0.08em', marginBottom: 8,
        }}>2025</div>

        {MOCK_TRIPS.map((trip, i) => (
          <div key={trip.id} onClick={() => router.push('/trip-detail')} style={{
            display: 'flex', gap: 10, padding: 10, marginBottom: 8,
            borderRadius: 12, border: `1.2px solid ${INK}`,
            background: PAPER, position: 'relative', cursor: 'pointer',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50% 50% 50% 8%',
              transform: 'rotate(-45deg)', background: '#d8c9a5',
              border: `1.2px solid ${INK}`, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: 18 }}>{trip.emoji}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{trip.title}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                {trip.dates} · {trip.info}
              </div>
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
            </div>
          </div>
        ))}

        {/* In progress */}
        <div style={{
          padding: 10, marginBottom: 8,
          borderRadius: 12, border: `1.2px dashed ${TERRA}`,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: `2px solid ${INK_FAINT}`, borderTopColor: TERRA,
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ flex: 1, fontSize: 11 }}>
            <b>'대구 출장'</b> 블로그 작성 중...
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>2분 전</span>
        </div>

        {/* 2024 */}
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
          letterSpacing: '0.08em', margin: '14px 0 8px',
        }}>2024</div>
        <div style={{
          padding: 10, borderRadius: 12, border: `1px solid ${INK_FAINT}`,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50% 50% 50% 8%',
            transform: 'rotate(-45deg)', background: '#cfd8c2',
            border: `1px solid ${INK}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: 16 }}>🍂</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 11 }}>교토 가을</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>11/2 — 11/5</div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Screen>
  );
}
