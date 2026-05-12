'use client';
// 백엔드 미연결 동안 photo:processing_progress / blog:published 흐름을 흉내내는 hook.
// 실 서버 붙으면 socket.io 클라이언트로 교체.
// USE_MOCKS와 무관하게 항상 실행 — 실 WebSocket 미연결 상태에서도 데모 흐름이 동작해야 함.
import { useEffect, useRef, useState } from 'react';
import type { PhotoProcessingProgressEvent, JobStatus } from '../../../types/realtime';

interface Options {
  enabled?: boolean;
  totalSteps?: number;
  stepMs?: number;
  onSuccess?: () => void;
  onFailure?: () => void;
}

export function useFakeProgress({ enabled = true, totalSteps = 5, stepMs = 700, onSuccess, onFailure }: Options = {}) {
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
    let timer = setTimeout(tick, stepMs);
    return () => clearTimeout(timer);
  }, [enabled, totalSteps, stepMs]);

  return event;
}
