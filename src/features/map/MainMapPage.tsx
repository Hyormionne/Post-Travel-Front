'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { FrostedHeader, ZoomControls, Toast, Btn, Progress } from '../../components/ui';
import { MainShell } from '../../components/MainShell';
import { INK, INK_SOFT, INK_FAINT, SAGE, TERRA, PAPER, PAPER_2, FONT_HAND, FONT_MONO, FONT_UI } from '../../theme/tokens';
import { listTrips } from '../trips/api';
import type { TripSummary } from '../../types/room';
import { useNotifications, markAllRead, type Notification } from '../../store/notifications';
import { getUser, clearAuth } from '../../store/auth';
import { logout } from '../auth/api';

const OpenMapBg = dynamic(
  () => import('../../components/OpenMapBg').then((m) => m.OpenMapBg),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: '#ede6d4' }} /> },
);

const TOAST_AUTO_DISMISS_MS = 5000;
const LOC_RADIUS = 0.15; // ~15km, 같은 도시 기준

interface TripGroup { trips: TripSummary[]; lat: number; lng: number; }

function groupByLocation(trips: TripSummary[]): TripGroup[] {
  const result: TripGroup[] = [];
  for (const trip of trips) {
    if (!trip.lat && !trip.lng) continue;
    const g = result.find(
      (x) => Math.abs(x.lat - trip.lat) < LOC_RADIUS && Math.abs(x.lng - trip.lng) < LOC_RADIUS,
    );
    if (g) g.trips.push(trip);
    else result.push({ trips: [trip], lat: trip.lat, lng: trip.lng });
  }
  return result;
}

export function MainMapPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const groups = useMemo(() => groupByLocation(trips), [trips]);
  const [dismissedToastIds, setDismissedToastIds] = useState<string[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const { list, unread, markRead } = useNotifications();

  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    const refetch = () => listTrips().then(setTrips).catch(() => {});
    refetch();
    // 다른 화면에서 돌아올 때(탭 포커스, 라우터 캐시 재사용)도 핀 갱신
    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
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
        pins={groups.map((g) => ({ lat: g.lat, lng: g.lng, label: g.trips[0].emoji }))}
        center={groups.length > 0 ? [groups[0].lng, groups[0].lat] : [127, 37.5]}
        zoom={groups.length > 0 ? 6 : 5}
        onPinClick={(i) => setSelected(selected === i ? null : i)}
        onMapClick={() => setSelected(null)}
      />
      <FrostedHeader
        rightBadge={unread > 0}
        profile={user?.profileEmoji ?? '나'}
        onProfileClick={() => { setProfileMenuOpen((v) => !v); setNotifOpen(false); }}
        onBellClick={() => { setNotifOpen(true); setSelected(null); setProfileMenuOpen(false); }}
      />

      {/* 프로필 드롭다운 메뉴 */}
      {profileMenuOpen && (
        <>
          <div
            onClick={() => setProfileMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 20 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 80, left: 8, width: 200,
              background: PAPER, border: `1.4px solid ${INK}`, borderRadius: 14,
              padding: '12px 14px', zIndex: 30,
              boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            }}
          >
            {/* 유저 정보 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${INK_FAINT}` }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: PAPER_2, border: `1.2px solid ${INK}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {user?.profileEmoji ?? '✈'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.nickname ?? '여행자'}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email ?? ''}
                </div>
              </div>
            </div>

            {/* 프로필 수정 버튼 */}
            <button
              onClick={() => { setProfileMenuOpen(false); router.push('/profile-edit'); }}
              style={{
                width: '100%', padding: '8px 10px',
                background: 'transparent', border: `1px solid ${INK_FAINT}`,
                borderRadius: 8, cursor: 'pointer',
                fontFamily: FONT_UI, fontSize: 11, fontWeight: 500, color: INK,
                display: 'flex', alignItems: 'center', gap: 6,
                textAlign: 'left', marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 13 }}>✎</span> 프로필 수정
            </button>

            {/* 로그아웃 버튼 */}
            <button
              onClick={async () => {
                setProfileMenuOpen(false);
                await logout().catch(() => {});
                clearAuth();
                router.replace('/login');
              }}
              style={{
                width: '100%', padding: '8px 10px',
                background: 'transparent', border: `1px solid ${INK_FAINT}`,
                borderRadius: 8, cursor: 'pointer',
                fontFamily: FONT_UI, fontSize: 11, fontWeight: 500, color: INK,
                display: 'flex', alignItems: 'center', gap: 6,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13 }}>↩</span> 로그아웃
            </button>
          </div>
        </>
      )}
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

      {selected !== null && groups[selected] && (() => {
        const group = groups[selected];
        const isMulti = group.trips.length > 1;
        return (
          <div style={{
            position: 'absolute', left: 12, right: 12, bottom: 14,
            background: '#f6f1e6', borderRadius: 14,
            border: `1.2px solid ${INK}`,
            padding: 10,
            boxShadow: '0 -6px 16px rgba(0,0,0,0.08)',
            zIndex: 10,
            maxHeight: '55%', overflow: 'auto',
          }}>
            {isMulti && (
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 8 }}>
                이 도시의 여행 {group.trips.length}개
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.trips.map((t) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/trip-detail?roomId=${encodeURIComponent(t.id)}`)}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    padding: isMulti ? '8px 0' : 0,
                    borderBottom: isMulti ? `1px solid ${INK_FAINT}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50% 50% 50% 8%',
                    transform: 'rotate(-45deg)', background: '#d8c9a5',
                    border: `1.2px solid ${INK}`, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ transform: 'rotate(45deg)', fontSize: 16 }}>{t.emoji}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{t.title}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                      {t.dates} · {t.info}
                    </div>
                  </div>
                  <span style={{ fontFamily: FONT_HAND, fontSize: 12, color: TERRA, flexShrink: 0 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </Screen>
  );
}
