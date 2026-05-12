'use client';

import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { PhotoTile } from '../../components/PhotoTile';
import { ThumbPin, FrostedHeader, ZoomControls, Btn, Progress } from '../../components/ui';
import {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import { useNotifications, markAllRead, type Notification } from '../../store/notifications';

const PINS = [
  { x: 120, y: 220, label: '🌸' },
  { x: 250, y: 180, label: '🌊' },
  { x: 200, y: 310, label: '🍜' },
  { x: 70, y: 350, label: '🎌' },
  { x: 310, y: 340, label: '✨' },
];

export function CompletePage() {
  const router = useRouter();
  const { list, unread } = useNotifications();

  const onBgClick = () => router.push('/');
  const onOpenEditor = (n: Notification) => {
    if (n.blogId) router.push(`/editor?blogId=${encodeURIComponent(n.blogId)}`);
    else if (n.roomId) router.push(`/editor?roomId=${encodeURIComponent(n.roomId)}`);
    else router.push('/editor');
  };
  const onOpenProgress = () => router.push('/generating');
  const onOpenTrip = (n: Notification) => {
    if (n.roomId) router.push(`/trip-detail?roomId=${encodeURIComponent(n.roomId)}`);
  };

  return (
    <Screen>
      {/* 흐려진 지도 배경 — 빈 곳 탭 = / 로 닫힘 */}
      <div onClick={onBgClick} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
        <MapBg style={{ filter: 'blur(2px)' }}>
          {PINS.map((p, i) => (
            <ThumbPin key={i} x={p.x} y={p.y} label={p.label} />
          ))}
        </MapBg>
      </div>
      <FrostedHeader rightBadge={unread > 0} />
      <ZoomControls />
      {/* Drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 28, right: 8, width: 290, maxHeight: '78%',
          background: PAPER, border: `1.4px solid ${INK}`, borderRadius: 14,
          padding: 12, zIndex: 30,
          boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 600 }}>
            알림 {unread > 0 ? `· ${unread}` : ''}
          </span>
          <span
            onClick={() => markAllRead()}
            style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, cursor: 'pointer' }}
          >
            모두 읽음
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.length === 0 && (
            <div style={{ padding: 14, fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, textAlign: 'center' }}>
              알림이 없어요.
            </div>
          )}
          {list.map((n) => {
            if (n.kind === 'blog:published') {
              return (
                <div
                  key={n.id}
                  onClick={() => onOpenEditor(n)}
                  style={{
                    padding: 10, borderRadius: 10, background: PAPER_2,
                    border: `1.2px solid ${TERRA}`, cursor: 'pointer',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}
                >
                  <PhotoTile w={36} h={36} label="A" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 11 }}>✦ {n.title}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>{n.meta}</div>
                    <Btn magic style={{ marginTop: 6, padding: '5px 10px', fontSize: 11 }}>
                      에디터 열기 →
                    </Btn>
                  </div>
                </div>
              );
            }
            if (n.kind === 'photo:processing_progress') {
              return (
                <div
                  key={n.id}
                  onClick={onOpenProgress}
                  style={{
                    padding: 10, borderRadius: 10,
                    border: `1px solid ${INK_FAINT}`, cursor: 'pointer',
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${INK_FAINT}`, borderTopColor: SAGE,
                    animation: 'spin 1s linear infinite', flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10 }}>{n.title}</div>
                    <Progress value={n.progress ?? 0.5} style={{ marginTop: 4 }} />
                  </div>
                </div>
              );
            }
            // member:added_photos
            return (
              <div
                key={n.id}
                onClick={() => onOpenTrip(n)}
                style={{
                  padding: 10, borderRadius: 10,
                  border: `1px solid ${INK_FAINT}`, cursor: n.roomId ? 'pointer' : 'default',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: SAGE, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HAND, fontSize: 13, flexShrink: 0,
                  border: `1.2px solid ${INK}`,
                }}>
                  {(n.actor ?? '?').charAt(0)}
                </div>
                <div style={{ flex: 1, fontSize: 10 }}>
                  <b>{n.actor}</b>이 {n.title.replace(`${n.actor}이 `, '')}
                  <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>{n.meta}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Screen>
  );
}
