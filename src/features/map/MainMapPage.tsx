'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { FrostedHeader, ZoomControls, Toast, Btn, Progress } from '../../components/ui';
import { MainShell } from '../../components/MainShell';
import { INK, INK_SOFT, INK_FAINT, SAGE, TERRA, PAPER, PAPER_2, FONT_HAND, FONT_MONO, FONT_UI } from '../../theme/tokens';
import { listTrips } from '../trips/api';
import type { TripSummary } from '../../mocks/data';
import { useNotifications, markAllRead, type Notification } from '../../store/notifications';

const OpenMapBg = dynamic(
  () => import('../../components/OpenMapBg').then((m) => m.OpenMapBg),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: '#ede6d4' }} /> },
);

const TOAST_AUTO_DISMISS_MS = 5000;

export function MainMapPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [dismissedToastIds, setDismissedToastIds] = useState<string[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { list, unread, markRead } = useNotifications();

  useEffect(() => {
    listTrips().then(setTrips).catch(() => {});
  }, []);

  // 최신 미열람 완료 알림 — Phase 5 A 토스트.
  // 같은 toast가 다시 뜨지 않도록 dismissed 로컬 set로 한 번 본 토스트를 가린다.
  const latestPublished = list.find(
    (n) => n.kind === 'blog:published' && !n.read && n.highlight && !dismissedToastIds.includes(n.id),
  );

  // 5초 후 자동 사라짐 + 해당 알림 read 처리. 의존성은 id(primitive)로만 잡아 매 렌더 재실행 방지.
  const latestPublishedId = latestPublished?.id;
  useEffect(() => {
    if (!latestPublishedId) return;
    const id = latestPublishedId;
    const timer = setTimeout(() => {
      setDismissedToastIds((cur) => (cur.includes(id) ? cur : [...cur, id]));
      markRead(id);
    }, TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [latestPublishedId, markRead]);

  return (
    <Screen>
      <OpenMapBg
        pins={trips.map((t) => ({ lat: t.lat, lng: t.lng, label: t.emoji }))}
        center={[134, 38.5]}
        zoom={5}
        onPinClick={(i) => setSelected(selected === i ? null : i)}
      />
      <FrostedHeader
        rightBadge={unread > 0}
        onBellClick={() => { setNotifOpen(true); setSelected(null); }}
      />
      <ZoomControls />
      <MainShell activeTab="map" />

      {/* Phase 5 A 토스트: 미열람 완료 알림이 있으면 표시 (5초 후 자동 사라짐) */}
      {selected === null && latestPublished && (
        <Toast style={{ animation: 'yh-toast-in 280ms ease-out' }}>
          <span style={{ fontSize: 14 }}>🔔</span>
          <span style={{ flex: 1 }}>{latestPublished.title}</span>
          <span
            onClick={() => {
              markRead(latestPublished.id);
              if (latestPublished.blogId) {
                router.push(`/editor?blogId=${encodeURIComponent(latestPublished.blogId)}`);
              } else {
                router.push('/complete');
              }
            }}
            style={{ color: SAGE, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            열기 →
          </span>
          <span
            onClick={() => {
              setDismissedToastIds((cur) => [...cur, latestPublished.id]);
              markRead(latestPublished.id);
            }}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginLeft: 4, cursor: 'pointer' }}
            aria-label="닫기"
          >
            ✕
          </span>
        </Toast>
      )}

      {/* 알림 드로어 */}
      {notifOpen && (
        <>
          {/* 반투명 backdrop — 탭 시 닫힘 */}
          <div
            onClick={() => setNotifOpen(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 20 }}
          />
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
              {list.map((n: Notification) => {
                if (n.kind === 'blog:published') {
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.blogId) router.push(`/editor?blogId=${encodeURIComponent(n.blogId)}`);
                        else if (n.roomId) router.push(`/editor?roomId=${encodeURIComponent(n.roomId)}`);
                        else router.push('/editor');
                      }}
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
                      onClick={() => { setNotifOpen(false); router.push('/generating'); }}
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
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.roomId) { setNotifOpen(false); router.push(`/trip-detail?roomId=${encodeURIComponent(n.roomId)}`); }
                    }}
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
        </>
      )}

      {selected !== null && trips[selected] && (
        <div
          onClick={() => router.push(`/trip-detail?roomId=${encodeURIComponent(trips[selected].id)}`)}
          style={{
            position: 'absolute', left: 12, right: 12, bottom: 14,
            background: '#f6f1e6', borderRadius: 14,
            border: `1.2px solid ${INK}`,
            padding: 10,
            boxShadow: '0 -6px 16px rgba(0,0,0,0.08)',
            cursor: 'pointer', zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50% 50% 50% 8%',
              transform: 'rotate(-45deg)', background: '#d8c9a5',
              border: `1.2px solid ${INK}`, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: 16 }}>{trips[selected].emoji}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{trips[selected].title}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                {trips[selected].dates} · {trips[selected].info}
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
