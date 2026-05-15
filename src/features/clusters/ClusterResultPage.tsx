'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Btn } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA, FONT_HAND, FONT_MONO, FONT_UI } from '../../theme/tokens';
import type { Cluster, ClusterPhoto } from '../../types/cluster';
import { fetchClusters, fetchClusterPhotos, triggerBlogDraft } from './api';
import { FolderCardLive } from './components/FolderCardLive';
<<<<<<< HEAD
import { useUploadFlow, setUploadFlow, resetUploadFlow } from '../../store/uploadFlow';
import { useClusterStream, formatEta } from './hooks/useClusterStream';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
=======
import { useUploadFlow, setUploadFlow } from '../../store/uploadFlow';
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a

export function ClusterResultPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [flow] = useUploadFlow();
<<<<<<< HEAD
  const rawRoomId = search?.get('roomId') ?? flow.roomId ?? '';
  const roomId = rawRoomId;

  // roomId가 유효한 UUID가 아니면 폴링 없이 재업로드 안내
  const isInvalidRoom = !UUID_RE.test(roomId);
=======
  const roomId = search?.get('roomId') ?? flow.roomId ?? '';
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a

  const [clusters, setClusters] = useState<Cluster[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  // 클러스터 사진 상세 시트
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [detailPhotos, setDetailPhotos] = useState<ClusterPhoto[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refetch = useCallback(() => {
    if (isInvalidRoom) return;
    fetchClusters(roomId)
      .then(setClusters)
      .catch((e) => setError(e instanceof Error ? e.message : 'load failed'));
  }, [roomId, isInvalidRoom]);

  // WebSocket 진행률 (cluster:created 시 자동 refetch)
  const stream = useClusterStream(isInvalidRoom ? '' : roomId, refetch);

  // 초기 fetch + 5초 polling — 유효하지 않은 roomId면 건너뜀
  useEffect(() => {
    if (isInvalidRoom) return;
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const load = () => {
      fetchClusters(roomId)
        .then((cs) => {
          if (cancelled) return;
          setClusters(cs);
          timerId = setTimeout(load, 5000);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : 'load failed');
        });
    };

    load();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [roomId, isInvalidRoom]);

<<<<<<< HEAD
  // 유효하지 않은 roomId — 재업로드 안내 화면
  if (isInvalidRoom) {
    return (
      <Screen>
        <div style={{ position: 'absolute', inset: 0, background: PAPER }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 32px', gap: 16, textAlign: 'center',
        }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <div style={{ fontFamily: FONT_HAND, fontSize: 18, color: INK }}>
            업로드 정보가 초기화됐어요
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, color: INK_SOFT, lineHeight: 1.6 }}>
            이전 세션의 데이터가 유효하지 않아요.<br />
            사진을 다시 업로드해 주세요.
          </div>
          <Btn primary full onClick={() => { resetUploadFlow(); router.push('/upload'); }}>
            사진 다시 업로드
          </Btn>
          <Btn full onClick={() => { resetUploadFlow(); router.push('/'); }}>
            메인으로 돌아가기
          </Btn>
        </div>
      </Screen>
    );
  }

  const totalPhotos = flow.photoCount || flow.selectedLocalIds.length || 0;
=======
  const photoKeywordIndex = useMemo<Record<string, string[]>>(() => ({}), []);

>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a
  const clusterCount = clusters?.length ?? 0;
  const loading = clusters === null;
  const tripName = flow.cityName || flow.tripName || '새 여행';

<<<<<<< HEAD
  // 진행률 표시용
  const showProgress = !stream.isDone || clusterCount === 0;
  // WebSocket 이벤트가 오면 실제 퍼센트, 없으면 경과 시간 기반 추정 (5분 = 99%)
  const progressPercent = stream.totalCount > 0
    ? stream.percent
    : Math.min(99, Math.floor((stream.elapsedSec / 300) * 100));
  // 3분 이상 대기 중인데 클러스터가 없으면 경고
  const isSlowWarning = stream.elapsedSec > 180 && clusterCount === 0;

  const onFolderClick = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setDetailPhotos(null);
    setDetailLoading(true);
    fetchClusterPhotos(cluster.id, roomId)
      .then((photos) => { setDetailPhotos(photos); setDetailLoading(false); })
      .catch(() => { setDetailPhotos([]); setDetailLoading(false); });
  };
=======
  const tripName = flow.tripName || '여행';
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a

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

  return (
    <Screen>
      <div style={{ position: 'absolute', inset: 0, background: PAPER }} />

      {/* 닫기 버튼 */}
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'absolute', top: 8, right: 14, zIndex: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: FONT_UI, fontSize: 18, color: INK_SOFT, lineHeight: 1, padding: 4,
        }}
      >×</button>

      {/* 헤더 */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, padding: '6px 16px' }}>
        <div style={{ fontFamily: FONT_HAND, fontSize: 18, color: INK, lineHeight: 1.1 }}>
          {loading
<<<<<<< HEAD
            ? `✨ ${totalPhotos}장의 사진을 분류하고 있어요…`
            : clusterCount > 0
              ? `✨ ${totalPhotos}장의 사진을 ${clusterCount}개의 추억으로 묶었어요`
              : `✨ ${totalPhotos}장의 사진을 분석 중이에요`}
=======
            ? '✨ 사진을 분류하고 있어요…'
            : `✨ ${clusterCount}개의 추억으로 묶었어요`}
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 4 }}>
          {tripName} · {loading ? '분류 중...' : clusterCount > 0 && stream.isDone ? '클러스터링 완료' : 'AI 분석 중...'}
        </div>

        {/* 진행률 바 */}
        {showProgress && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 5, background: INK_FAINT, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: stream.isDone
                  ? SAGE
                  : `linear-gradient(90deg, ${SAGE}, ${TERRA})`,
                width: `${stream.isDone ? 100 : progressPercent}%`,
                transition: 'width 1.2s ease',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 4,
              fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT,
            }}>
              <span>
                {stream.totalCount > 0
                  ? `${stream.doneCount} / ${stream.totalCount}장 분석 완료`
                  : stream.isDone
                    ? '분석 완료 ✓'
                    : `${progressPercent}% 진행 중`}
              </span>
              <span>
                {stream.isDone
                  ? '완료 ✓'
                  : stream.etaSec !== null
                    ? `남은 시간 ${formatEta(stream.etaSec)}`
                    : stream.elapsedSec >= 60
                      ? `경과 ${Math.floor(stream.elapsedSec / 60)}분 ${stream.elapsedSec % 60}초`
                      : `경과 ${stream.elapsedSec}초`}
              </span>
            </div>

            {/* 3분 이상 지연 경고 */}
            {isSlowWarning && (
              <div style={{
                marginTop: 8, padding: '7px 10px', borderRadius: 8,
                background: 'rgba(195,120,80,0.08)', border: `1px solid ${TERRA}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: TERRA }}>
                  AI 서버 처리가 오래 걸리고 있어요
                </span>
                <button
                  onClick={refetch}
                  style={{
                    background: 'none', border: `1px solid ${TERRA}`, borderRadius: 6,
                    padding: '3px 8px', cursor: 'pointer',
                    fontFamily: FONT_MONO, fontSize: 8, color: TERRA,
                  }}
                >
                  새로고침
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 폴더 그리드 */}
      <div style={{
        position: 'absolute',
        top: showProgress ? 126 : 90,
        left: 12, right: 12, bottom: 92,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        overflow: 'auto',
        transition: 'top 0.3s ease',
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
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            height: 140, borderRadius: 12,
            border: `1.2px dashed ${INK_FAINT}`, background: 'rgba(0,0,0,0.02)',
          }} />
        ))}
        {!loading && clusterCount === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>
              {isSlowWarning ? '⏱️' : '🔍'}
            </div>
            <div style={{ fontFamily: FONT_UI, fontSize: 12, color: INK, fontWeight: 600, marginBottom: 6 }}>
              {isSlowWarning ? '분석에 예상보다 시간이 걸려요' : 'AI가 사진을 분석하고 있어요'}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, lineHeight: 1.7 }}>
              {isSlowWarning
                ? <>서버 부하로 처리가 지연될 수 있어요<br />완료되면 자동으로 표시됩니다</>
                : <>분류가 완료되면 자동으로 표시됩니다<br />GPU 분석에 1~3분 소요될 수 있어요</>}
            </div>
          </div>
        )}
        {!loading && clusters?.map((c) => (
          <FolderCardLive
            key={c.id}
            cluster={c}
            onClick={() => onFolderClick(c)}
          />
        ))}
      </div>

      {/* 매직 버튼 */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 18 }}>
        <Btn
          magic full onClick={onMagic}
          style={{
            padding: '14px 16px', fontSize: 13,
            opacity: triggering || loading ? 0.7 : 1,
            cursor: triggering || loading ? 'wait' : 'pointer',
          }}
        >
          {triggering ? '시작 중...' : '✨ AI 여행로그 초안 만들기'}
        </Btn>
        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, textAlign: 'center', marginTop: 8 }}>
          <span onClick={() => router.push('/')} style={{ textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
            나중에 만들기
          </span>
        </div>
      </div>

      {/* 사진 상세 시트 */}
      {selectedCluster && (
        <>
          <div onClick={() => setSelectedCluster(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 20 }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            height: '72%', background: PAPER,
            borderTopLeftRadius: 22, borderTopRightRadius: 22,
            border: `1.2px solid ${INK}`, borderBottom: 'none',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.14)',
            zIndex: 21, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ flexShrink: 0, padding: '14px 16px 10px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: INK_FAINT, margin: '0 auto 10px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: INK }}>
                    {selectedCluster.title}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                    {detailLoading ? '불러오는 중...' : `${detailPhotos?.length ?? 0}장`}
                  </div>
                </div>
                <span onClick={() => setSelectedCluster(null)}
                  style={{ fontFamily: FONT_UI, fontSize: 18, color: INK_SOFT, cursor: 'pointer', padding: 4 }}>×</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
              {detailLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ height: 90, borderRadius: 6, background: PAPER_2, border: `1px dashed ${INK_FAINT}` }} />
                  ))}
                </div>
              )}
              {!detailLoading && detailPhotos?.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>
                  사진이 없습니다
                </div>
              )}
              {!detailLoading && detailPhotos && detailPhotos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                  {detailPhotos.map((photo, i) => (
                    <div key={photo.id} style={{ borderRadius: 6, overflow: 'hidden' }}>
                      {photo.thumbnailUrl ? (
                        <img src={photo.thumbnailUrl} alt=""
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <PhotoTile w="100%" h={90} label={String.fromCharCode(65 + (i % 26))} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}
