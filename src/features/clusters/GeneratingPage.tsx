'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { ThumbPin, FrostedHeader, FAB, MapToggle, ZoomControls, Toast } from '../../components/ui';
import { INK, PAPER, TERRA, INK_FAINT, FONT_MONO, SAGE } from '../../theme/tokens';
import { useProcessingProgress, useFakeProgress } from './hooks/useClusterStream';
import { listBlogs } from '../blog/api';
import { useUploadFlow, setUploadFlow } from '../../store/uploadFlow';
import { pushNotification } from '../../store/notifications';

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
  const roomId = search?.get('roomId') ?? flow.roomId ?? '';
  const jobId = search?.get('jobId') ?? flow.jobId ?? null;

  const [toastVisible, setToastVisible] = useState(true);
  const [completedBlogId, setCompletedBlogId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 완료 후 블로그 조회 → 에디터 이동
  const handleSuccess = async () => {
    if (done) return;
    setDone(true);
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
        setTimeout(() => router.push(`/trip-detail?roomId=${encodeURIComponent(roomId)}`), 1200);
      }
    } catch {
      // 실패 시 사용자 액션 대기
    }
  };

  // ── 실 WebSocket ──────────────────────────────────────────────────────────
  const { event: realEvent, isRealSocket } = useProcessingProgress({
    roomId,
    jobId,
    onSuccess: handleSuccess,
  });

  // ── Fake fallback (실 소켓 연결 실패 시) ─────────────────────────────────
  const fakeEvent = useFakeProgress({
    enabled: !isRealSocket,   // 실 소켓이 없을 때만 동작
    totalSteps: 5,
    stepMs: 700,
    onSuccess: handleSuccess,
  });

  // 실 소켓 연결 여부에 따라 표시할 progress 선택
  const progress = isRealSocket ? realEvent : fakeEvent;

  // 토스트 5초 후 자동 사라짐
  useEffect(() => {
    const t = setTimeout(() => setToastVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // 백그라운드 유지 — 알림 센터 이동
  const onBellClick = () => router.push('/complete');

  const label = completedBlogId
    ? '초안 완성'
    : progress.status === 'PROCESSING_CALLBACK'
      ? '마무리 중...'
      : progress.status === 'SUCCESS'
        ? '완료'
        : `${progress.doneCount} / ${progress.totalCount} 작성 중`;

  return (
    <Screen>
      <MapBg>
        {PINS.map((p, i) => (
          <ThumbPin key={i} x={p.x} y={p.y} label={p.label} />
        ))}
      </MapBg>
      <div onClick={onBellClick} style={{ cursor: 'pointer' }}>
        <FrostedHeader rightBadge />
      </div>
      <ZoomControls />
      <MapToggle active="map" onToggle={(v) => v === 'timeline' && router.push('/timeline')} />
      <FAB onClick={() => router.push('/upload')} />
      {/* Spinner dock */}
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
          animation: (completedBlogId || progress.status === 'SUCCESS') ? 'none' : 'spin 1s linear infinite',
        }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 9 }}>{label}</span>
        {!isRealSocket && (
          <span style={{ fontFamily: FONT_MONO, fontSize: 7, color: INK_FAINT, marginLeft: 2 }}>(시뮬)</span>
        )}
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

// 흐름 완료 후 store 정리
export function _resetFlowAfterEditorEnter() {
  setUploadFlow({ selectedLocalIds: [], jobId: null });
}
