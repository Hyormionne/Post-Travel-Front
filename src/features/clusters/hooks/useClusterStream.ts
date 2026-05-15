'use client';

import { useEffect, useRef, useState } from 'react';
import type { PhotoProcessingProgressEvent, JobStatus, ClusterCreatedEvent } from '../../../types/realtime';
import { getSocket, subscribeRoom } from '../../../lib/socket';

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) ||
  'http://localhost:3000';

function getAccessToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('yh_access') : null;
  } catch {
    return null;
  }
}

export interface ClusterStreamState {
  doneCount: number;
  totalCount: number;
  percent: number;           // 0~100
  status: JobStatus | null;
  isAnalyzing: boolean;      // RUNNING | PROCESSING_CALLBACK
  isDone: boolean;           // SUCCESS
  isFailed: boolean;
  elapsedSec: number;        // 경과 시간(초)
  etaSec: number | null;     // 예상 남은 시간(초)
}

const INITIAL: ClusterStreamState = {
  doneCount: 0, totalCount: 0, percent: 0,
  status: null, isAnalyzing: true, isDone: false, isFailed: false,
  elapsedSec: 0, etaSec: null,
};

export function useClusterStream(roomId: string, onNewCluster?: () => void) {
  const [state, setState] = useState<ClusterStreamState>(INITIAL);
  const startRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 경과 시간 타이머
  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.isDone || prev.isFailed) return prev;
        const elapsedSec = Math.floor((Date.now() - startRef.current) / 1000);
        let etaSec: number | null = null;
        if (prev.doneCount > 0 && prev.totalCount > prev.doneCount) {
          const rate = prev.doneCount / elapsedSec;
          etaSec = Math.ceil((prev.totalCount - prev.doneCount) / rate);
        }
        return { ...prev, elapsedSec, etaSec };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roomId]);

  // Socket.IO 연결
  useEffect(() => {
    if (!roomId) return;

    let socket: import('socket.io-client').Socket | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const token = getAccessToken();
        socket = io(`${API_BASE}/realtime`, {
          auth: token ? { token } : {},
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          timeout: 10000,
        });

        socket.on('connect', () => {
          socket?.emit('room:subscribe', { roomId });
        });

        socket.on('photo:processing_progress', (e: PhotoProcessingProgressEvent) => {
          if (cancelled) return;
          const percent = e.totalCount > 0 ? Math.round((e.doneCount / e.totalCount) * 100) : 0;
          const elapsedSec = Math.floor((Date.now() - startRef.current) / 1000);
          let etaSec: number | null = null;
          if (e.doneCount > 0 && elapsedSec > 0 && e.totalCount > e.doneCount) {
            const rate = e.doneCount / elapsedSec;
            etaSec = Math.ceil((e.totalCount - e.doneCount) / rate);
          }
          setState({
            doneCount: e.doneCount,
            totalCount: e.totalCount,
            percent,
            status: e.status,
            isAnalyzing: e.status === 'RUNNING' || e.status === 'PROCESSING_CALLBACK' || e.status === 'PENDING',
            isDone: e.status === 'SUCCESS',
            isFailed: e.status === 'FAILED',
            elapsedSec,
            etaSec,
          });
        });

        socket.on('cluster:created', () => {
          if (cancelled) return;
          onNewCluster?.();
        });

        socket.on('connect_error', () => {
          // WebSocket 실패 시 무시 — polling으로 클러스터 갱신
        });
      } catch {
        // socket.io-client 로드 실패 시 무시
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return state;
}

// 초 → "약 N분 N초" 포맷
export function formatEta(sec: number): string {
  if (sec < 60) return `약 ${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `약 ${m}분 ${s}초` : `약 ${m}분`;
}

// GeneratingPage 등에서 사용하는 데모용 가짜 진행 훅 (WebSocket 미연결 시 폴백)
interface FakeProgressOptions {
  enabled?: boolean;
  totalSteps?: number;
  stepMs?: number;
  onSuccess?: () => void;
  onFailure?: () => void;
}
export function useFakeProgress({ enabled = true, totalSteps = 5, stepMs = 700, onSuccess, onFailure }: FakeProgressOptions = {}) {
  const [event, setEvent] = useState<import('../../../types/realtime').PhotoProcessingProgressEvent>({
    jobId: 'job-mock', doneCount: 0, totalCount: totalSteps, status: 'PENDING',
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
      const status = cur === totalSteps ? 'PROCESSING_CALLBACK' : 'RUNNING';
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
