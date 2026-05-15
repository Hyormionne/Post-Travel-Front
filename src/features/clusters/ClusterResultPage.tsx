'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, PAPER, TERRA, FONT_HAND, FONT_MONO } from '../../theme/tokens';
import type { Cluster } from '../../types/cluster';
import { fetchClusters, triggerBlogDraft } from './api';
import { FolderCardLive } from './components/FolderCardLive';
import { useUploadFlow, setUploadFlow } from '../../store/uploadFlow';
import { useProcessingProgress } from './hooks/useClusterStream';
import { fetchClusters as refetchClusters } from './api';

export function ClusterResultPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [flow] = useUploadFlow();
  const roomId = search?.get('roomId') ?? flow.roomId ?? '';

  const [clusters, setClusters] = useState<Cluster[] | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  // 초기 클러스터 목록 로드
  useEffect(() => {
    let cancelled = false;
    fetchClusters(roomId)
      .then((cs) => {
        if (cancelled) return;
        setClusters(cs);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'load failed');
        setClusters([]); // 에러 시 빈 배열로 로딩 해제
      });
    return () => { cancelled = true; };
  }, [roomId]);

  // WebSocket: cluster:created → 클러스터 목록 갱신
  //            photo:processing_progress(SUCCESS) → 분석 완료 상태 전환
  useProcessingProgress({
    roomId,
    onClusterCreated: async () => {
      try {
        const updated = await refetchClusters(roomId);
        setClusters(updated);
      } catch { /* 무시 */ }
    },
    onSuccess: () => setAnalysisComplete(true),
  });

  const photoKeywordIndex = useMemo<Record<string, string[]>>(() => ({}), []);

  const clusterCount = clusters?.length ?? 0;
  const loading = clusters === null;

  const tripName = flow.tripName || '여행';

  const onMagic = async () => {
    if (triggering) return;
    setTriggering(true);
    try {
      const { jobId } = await triggerBlogDraft(roomId);
      setUploadFlow({ jobId });
      router.push(`/generating?roomId=${encodeURIComponent(roomId)}&jobId=${encodeURIComponent(jobId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'trigger failed');
      setTriggering(false);
    }
  };

  const onLater = () => router.push('/');

  // 헤더 텍스트: 로딩 중 / 분석 중(클러스터 있음) / 완료
  const headerText = loading
    ? '✨ 사진을 분류하고 있어요…'
    : analysisComplete
      ? `✨ ${clusterCount}개의 추억으로 묶었어요`
      : clusterCount > 0
        ? `✨ ${clusterCount}개 발견 · 분류 중…`
        : '✨ 사진을 분류하고 있어요…';

  const subText = loading
    ? '분류 중...'
    : analysisComplete
      ? '클러스터링 완료'
      : '분류 중...';

  return (
    <Screen>
      <div style={{ position: 'absolute', inset: 0, background: PAPER }} />
      {/* Header */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, padding: '6px 16px' }}>
        <div style={{ fontFamily: FONT_HAND, fontSize: 18, color: INK, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 8 }}>
          {headerText}
          {!analysisComplete && !loading && (
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              border: `2px solid ${INK_FAINT}`, borderTopColor: TERRA,
              animation: 'spin 1s linear infinite', flexShrink: 0,
            }} />
          )}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 4 }}>
          {tripName} · {subText}
        </div>
      </div>
      {/* Grid */}
      <div style={{
        position: 'absolute', top: 90, left: 12, right: 12, bottom: 92,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        overflow: 'auto',
      }}>
        {error && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 10, borderRadius: 8, border: `1px solid ${TERRA}`,
            color: TERRA, fontFamily: FONT_MONO, fontSize: 9,
          }}>
            {error}
          </div>
        )}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: 140, borderRadius: 12,
              border: `1.2px dashed ${INK_FAINT}`, background: 'rgba(0,0,0,0.02)',
            }} />
          ))}
        {!loading && clusters?.map((c) => (
          <FolderCardLive
            key={c.id}
            cluster={c}
            photoKeywordIndex={photoKeywordIndex}
            onClick={() => router.push(`/trip-detail?roomId=${encodeURIComponent(roomId)}&cluster=${encodeURIComponent(c.id)}`)}
          />
        ))}
      </div>
      {/* Magic button */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 18 }}>
        <Btn
          magic
          full
          onClick={onMagic}
          style={{
            padding: '14px 16px',
            fontSize: 13,
            opacity: triggering || loading ? 0.7 : 1,
            cursor: triggering || loading ? 'wait' : 'pointer',
          }}
        >
          {triggering ? '시작 중...' : '✨ AI 여행로그 초안 만들기'}
        </Btn>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT,
          textAlign: 'center', marginTop: 8,
        }}>
          <span onClick={onLater} style={{ textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
            나중에 만들기
          </span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Screen>
  );
}
