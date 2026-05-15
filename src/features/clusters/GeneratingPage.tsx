'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { ThumbPin, FrostedHeader, FAB, MapToggle, ZoomControls, Toast } from '../../components/ui';
import { INK, PAPER, TERRA, INK_FAINT, FONT_MONO, SAGE } from '../../theme/tokens';
import { useFakeProgress } from './hooks/useClusterStream';
import { listBlogs } from '../blog/api';
import { useUploadFlow, setUploadFlow } from '../../store/uploadFlow';
import { pushNotification } from '../../store/notifications';
import { formatTripTitle } from '../trips/api';

const API_WS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) ||
  'http://localhost:3000';

function getAccessToken(): string | null {
  try { return typeof window !== 'undefined' ? localStorage.getItem('yh_access') : null; }
  catch { return null; }
}

// Phase 4 C 마커 (채팅 확정: pending 없음)
const PINS = [
  { x: 120, y: 220, label: '🌸' },
  { x: 250, y: 180, label: '🌊' },
  { x: 200, y: 310, label: '🍜' },
  { x: 70, y: 350, label: '🎌' },
  { x: 310, y: 340, label: '✨' },
];

export function GeneratingPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [flow] = useUploadFlow();
<<<<<<< HEAD
  const roomId = search?.get('roomId') ?? flow.roomId ?? 'room-001';
  const jobId = search?.get('jobId') ?? flow.jobId ?? null;

=======
  const roomId = search?.get('roomId') ?? flow.roomId ?? '';
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a
  const [toastVisible, setToastVisible] = useState(true);
  const [blogReady, setBlogReady] = useState(false);
  const [completedBlogId, setCompletedBlogId] = useState<string | null>(null);
  const handledRef = useRef(false);

<<<<<<< HEAD
  // 비주얼 진행률 (가짜) — WebSocket 응답 전까지 UX용
  const progress = useFakeProgress({ enabled: !blogReady, totalSteps: 8, stepMs: 600 });

  const handleBlogReady = (blogId: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    setBlogReady(true);
    setCompletedBlogId(blogId);
    pushNotification({
      id: `n-${blogId}`,
      kind: 'blog:published',
      blogId,
      roomId,
      title: `'${formatTripTitle(flow.cityName, flow.travelDates, flow.tripName)}' 초안 완성`,
      meta: '방금',
      highlight: true,
    });
    setUploadFlow({ jobId: null });
    setTimeout(() => {
      router.push(`/editor?blogId=${encodeURIComponent(blogId)}&roomId=${encodeURIComponent(roomId)}`);
    }, 1000);
  };

  // WebSocket: blog:generated 이벤트 수신 + 폴링 폴백
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    let socket: import('socket.io-client').Socket | null = null;

    // 8초마다 listBlogs 확인 (WebSocket 미연결 대비)
    const poll = setInterval(async () => {
      if (cancelled || handledRef.current) return;
      try {
        const blogs = await listBlogs(roomId);
        const ready = blogs.find((b) => b.content && b.content.length > 20);
        if (ready) { clearInterval(poll); handleBlogReady(ready.id); }
      } catch { /* 조용히 무시 */ }
    }, 8000);

    // Socket.IO 연결
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const token = getAccessToken();
        socket = io(`${API_WS}/realtime`, {
          auth: token ? { token } : {},
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          timeout: 10000,
        });
        socket.on('connect', () => socket?.emit('room:subscribe', { roomId }));
        // 백엔드 webhook.controller.ts 실제 이벤트명
        socket.on('blog:generated', (e: { jobId: string; blogId: string }) => {
          if (cancelled) return;
          if (!jobId || e.jobId === jobId) {
            clearInterval(poll);
            handleBlogReady(e.blogId);
          }
        });
        socket.on('connect_error', () => { /* 폴링으로 대체 */ });
      } catch { /* socket.io-client 로드 실패 — 폴링만 사용 */ }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
      clearInterval(poll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, jobId]);
=======
  const progress = useFakeProgress({
    enabled: true,
    totalSteps: 5,
    stepMs: 700,
    onSuccess: async () => {
      // 백엔드 job이 생성한 블로그를 폴링으로 찾기
      try {
        const blogs = await listBlogs(roomId);
        const latest = blogs[0];
        if (latest) {
          setCompletedBlogId(latest.id);
          pushNotification({
            id: `n-${latest.id}`,
            kind: 'blog:published',
            blogId: latest.id,
            roomId,
            title: `'${latest.title}' 초안 완성`,
            meta: '방금',
            highlight: true,
          });
          setTimeout(() => router.push(`/editor?blogId=${encodeURIComponent(latest.id)}`), 1200);
        } else {
          // 아직 생성 안 됨 — 여행 상세로 이동
          setTimeout(() => router.push(`/trip-detail?roomId=${encodeURIComponent(roomId)}`), 1200);
        }
      } catch {
        // 실패 시 사용자 액션 대기
      }
    },
  });
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a

  useEffect(() => {
    const t = setTimeout(() => setToastVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const dockLabel = completedBlogId
    ? '초안 완성'
    : progress.status === 'PROCESSING_CALLBACK'
      ? '마무리 중...'
      : `${progress.doneCount} / ${progress.totalCount} 분석 중`;

  return (
    <Screen>
      <MapBg>
        {PINS.map((p, i) => (
          <ThumbPin key={i} x={p.x} y={p.y} label={p.label} />
        ))}
      </MapBg>
      <div onClick={() => router.push('/complete')} style={{ cursor: 'pointer' }}>
        <FrostedHeader rightBadge />
      </div>
      <ZoomControls />
      <MapToggle active="map" onToggle={(v) => v === 'timeline' && router.push('/timeline')} />
      <FAB onClick={() => router.push('/upload')} />

      {/* 스피너 도크 */}
      <div style={{
        position: 'absolute', left: 14, top: 84,
        background: PAPER, border: `1px solid ${INK}`, borderRadius: 99,
        padding: '4px 10px 4px 6px', display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)', zIndex: 15,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `2px solid ${INK_FAINT}`,
          borderTopColor: completedBlogId ? SAGE : TERRA,
          animation: completedBlogId ? 'none' : 'spin 1s linear infinite',
        }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 9 }}>{dockLabel}</span>
      </div>

      {toastVisible && (
        <Toast>
          <span style={{ fontSize: 14 }}>{completedBlogId ? '🔔' : '✨'}</span>
          <span style={{ flex: 1 }}>
            {completedBlogId
              ? '초안이 완성되었어요. 잠시 후 에디터로 이동합니다…'
              : '블로그 작성을 시작했어요. 완료되면 알림으로 알려드릴게요!'}
          </span>
        </Toast>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Screen>
  );
}

export function _resetFlowAfterEditorEnter() {
  setUploadFlow({ selectedLocalIds: [], jobId: null });
}
