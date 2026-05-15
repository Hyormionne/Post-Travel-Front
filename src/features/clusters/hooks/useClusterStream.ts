'use client';
// WebSocket 기반 photo:processing_progress 구독 훅.
// 실 서버 연결 성공 → 실 이벤트 수신.
// 연결 실패(백엔드 미구동) → useFakeProgress로 자동 fallback.
import { useEffect, useRef, useState } from 'react';
import type { PhotoProcessingProgressEvent, JobStatus, ClusterCreatedEvent } from '../../../types/realtime';
import { getSocket, subscribeRoom } from '../../../lib/socket';

// ─── Fake progress (백엔드 미연결 fallback) ────────────────────────────────
interface FakeOptions {
  enabled?: boolean;
  totalSteps?: number;
  stepMs?: number;
  onSuccess?: () => void;
  onFailure?: () => void;
}

export function useFakeProgress({
  enabled = true,
  totalSteps = 5,
  stepMs = 700,
  onSuccess,
  onFailure,
}: FakeOptions = {}) {
  const [event, setEvent] = useState<PhotoProcessingProgressEvent>({
    jobId: 'job-mock',
    doneCount: 0,
    totalCount: totalSteps,
    status: 'PENDING',
  });
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;

  useEffect(() => {
    if (!enabled) return;
    let cur = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      cur++;
      let status: JobStatus = 'RUNNING';
      if (cur === totalSteps) status = 'PROCESSING_CALLBACK';
      setEvent({ jobId: 'job-mock', doneCount: cur, totalCount: totalSteps, status });
      if (cur < totalSteps) {
        timer = setTimeout(tick, stepMs);
      } else {
        timer = setTimeout(() => {
          setEvent({ jobId: 'job-mock', doneCount: totalSteps, totalCount: totalSteps, status: 'SUCCESS' });
          onSuccessRef.current?.();
        }, stepMs);
      }
    };
    timer = setTimeout(tick, stepMs);
    return () => clearTimeout(timer);
  }, [enabled, totalSteps, stepMs]);

  return event;
}

// ─── 실 WebSocket 기반 progress 훅 ────────────────────────────────────────
interface StreamOptions {
  roomId: string;
  jobId?: string | null;
  /** cluster:created 이벤트 수신 시 콜백 */
  onClusterCreated?: (e: ClusterCreatedEvent) => void;
  /** SUCCESS 도달 시 콜백 */
  onSuccess?: () => void;
  onFailure?: () => void;
}

interface StreamResult {
  event: PhotoProcessingProgressEvent;
  /** 실 WebSocket 연결 성공 여부 (false면 fake progress 중) */
  isRealSocket: boolean;
}

export function useProcessingProgress({
  roomId,
  jobId,
  onClusterCreated,
  onSuccess,
  onFailure,
}: StreamOptions): StreamResult {
  const [event, setEvent] = useState<PhotoProcessingProgressEvent>({
    jobId: jobId ?? 'pending',
    doneCount: 0,
    totalCount: 1,
    status: 'PENDING',
  });
  const [isRealSocket, setIsRealSocket] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  const onClusterCreatedRef = useRef(onClusterCreated);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;
  onClusterCreatedRef.current = onClusterCreated;

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    let socket: import('socket.io-client').Socket | null = null;

    getSocket().then((s) => {
      if (cancelled) return;
      if (!s) {
        // 연결 실패 → caller가 useFakeProgress로 처리
        setIsRealSocket(false);
        return;
      }
      socket = s;
      setIsRealSocket(true);
      subscribeRoom(s, roomId);

      const onProgress = (e: PhotoProcessingProgressEvent) => {
        if (cancelled) return;
        // jobId 필터링 (jobId 없으면 모든 이벤트 수신)
        if (jobId && e.jobId !== jobId) return;
        setEvent(e);
        if (e.status === 'SUCCESS') onSuccessRef.current?.();
        if (e.status === 'FAILED') onFailureRef.current?.();
      };

      const onCreated = (e: ClusterCreatedEvent) => {
        if (cancelled) return;
        onClusterCreatedRef.current?.(e);
      };

      s.on('photo:processing_progress', onProgress);
      s.on('cluster:created', onCreated);
    });

    return () => {
      cancelled = true;
      if (socket) {
        socket.off('photo:processing_progress');
        socket.off('cluster:created');
      }
    };
  }, [roomId, jobId]);

  return { event, isRealSocket };
}
