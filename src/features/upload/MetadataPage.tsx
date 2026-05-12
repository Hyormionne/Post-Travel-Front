'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Progress, SectionTitle, Btn } from '../../components/ui';
import {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import { useUploadFlow, setUploadFlow } from '../../store/uploadFlow';
import { createRoom, getPresignedUrls, putToS3, completeUpload, buildCompleteItems } from './api';

const BG_COLORS = ['#d8c9a5', '#cfd8c2', '#e2c9bc', '#c9d2db', '#decfd8', '#f0ead2'];

type Shape = 'classic' | 'polaroid' | 'sticker' | 'dot' | 'flag' | 'ribbon';
const SHAPES: { k: Shape; s: string; r: number; label: string }[] = [
  { k: 'classic', s: '50% 50% 50% 8%', r: -45, label: '✦' },
  { k: 'polaroid', s: '4px', r: -6, label: '폴' },
  { k: 'sticker', s: '50%', r: 0, label: '스' },
  { k: 'dot', s: '50%', r: 0, label: '•' },
  { k: 'flag', s: '50% 50% 4px 4px', r: 0, label: '깃' },
  { k: 'ribbon', s: '6px', r: 0, label: '리' },
];

export function MetadataPage() {
  const router = useRouter();
  const [flow, setFlow] = useUploadFlow();
  const fileCount = flow.selectedLocalIds.length || 47;

  const [tripName, setTripName] = useState(flow.tripName || '홋카이도, 5월');
  const [marker, setMarker] = useState(flow.marker);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'completing' | 'done' | 'error'>('uploading');
  const [error, setError] = useState<string | null>(null);

  // 마커 커스텀은 변경 즉시 store에 반영
  useEffect(() => {
    setFlow({ marker, tripName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker.emoji, marker.bgColor, marker.shape, tripName]);

  // 진입 즉시 presigned → S3 PUT → complete의 mock 흐름 시작
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setStatus('uploading');
        // 1) 룸이 아직 없으면 임시 생성 (실제 흐름은 메타 완료 시 호출도 OK).
        let roomId = flow.roomId;
        if (!roomId) {
          const room = await createRoom({ title: tripName });
          if (cancelled) return;
          roomId = room.id;
          setFlow({ roomId });
        }
        // 2) presigned-urls (1~50개씩 배치). mock에서는 모두 한 번에.
        const totalFiles = fileCount;
        const files = Array.from({ length: totalFiles }, (_, i) => ({
          name: `IMG_${1000 + i}.jpg`,
          size: 3_500_000,
          contentType: 'image/jpeg' as const,
        }));
        const presigned = await getPresignedUrls({ roomId, files });
        if (cancelled) return;

        // 3) 각 파일의 original + thumbnail PUT — 진행률 평균으로 표시
        const totalBytes = files.reduce((s, f) => s + f.size, 0) * 2; // original + thumbnail
        const loaded = new Array<number>(presigned.length * 2).fill(0);
        const update = () => {
          const sum = loaded.reduce((a, b) => a + b, 0);
          setProgress(Math.min(1, sum / totalBytes));
        };
        const tasks: Promise<void>[] = [];
        presigned.forEach((p, i) => {
          const blob = new Blob([new Uint8Array(0)], { type: 'image/jpeg' });
          tasks.push(
            putToS3(p.original.url, blob, (l) => {
              loaded[i * 2] = l;
              update();
            }),
          );
          tasks.push(
            putToS3(p.thumbnail.url, blob, (l) => {
              loaded[i * 2 + 1] = l;
              update();
            }),
          );
        });
        await Promise.all(tasks);
        if (cancelled) return;
        setProgress(1);

        // 4) complete
        setStatus('completing');
        const items = buildCompleteItems(presigned, files.map((f) => new File([], f.name, { type: f.contentType })));
        await completeUpload({ roomId, photos: items });
        if (cancelled) return;
        setStatus('done');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : '업로드 실패');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goCluster = () => {
    if (status !== 'done') return;
    if (!flow.roomId) return;
    router.push(`/clusters?roomId=${encodeURIComponent(flow.roomId)}`);
  };

  const inviteUrl = useMemo(() => {
    const token = flow.roomId ? flow.roomId.slice(-6) : '4Kj9aB';
    return `yht.app/i/${token}`;
  }, [flow.roomId]);

  const onCopyInvite = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${inviteUrl}`).catch(() => {});
    }
  };

  const doneCount = Math.round(progress * fileCount);
  const headerLabel =
    status === 'done'
      ? '업로드 완료'
      : status === 'completing'
        ? 'AI 분석 시작 중'
        : `업로드 중 · ${doneCount} / ${fileCount}`;

  const visiblePreviewCount = Math.min(7, fileCount);

  return (
    <Screen>
      <div style={{ position: 'absolute', inset: 0, background: PAPER }} />
      {/* Upload strip */}
      <div style={{
        position: 'absolute', top: 28, left: 0, right: 0, height: 84,
        background: PAPER_2, borderBottom: `1px solid ${INK_FAINT}`,
        padding: '10px 12px', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 6,
          fontFamily: FONT_MONO, fontSize: 9, color: status === 'error' ? TERRA : INK_SOFT,
        }}>
          <span>{status === 'error' ? `오류 · ${error}` : headerLabel}</span>
          <span>{status === 'uploading' ? '2.4 MB/s' : status === 'done' ? '✓' : '...'}</span>
        </div>
        <Progress value={progress} />
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {Array.from({ length: visiblePreviewCount }).map((_, i) => (
            <PhotoTile key={i} w={42} h={42} label={String.fromCharCode(65 + i)}
              dim={i < Math.round(progress * visiblePreviewCount) ? 1 : 0.4} />
          ))}
          {fileCount > visiblePreviewCount && (
            <div style={{
              width: 42, height: 42, borderRadius: 4,
              border: `1px dashed ${INK_FAINT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
            }}>+{fileCount - visiblePreviewCount}</div>
          )}
        </div>
      </div>
      {/* Form area */}
      <div style={{ position: 'absolute', top: 124, left: 0, right: 0, bottom: 0, padding: '14px 16px', overflow: 'auto' }}>
        <SectionTitle hint="필수">여행 이름 · 마커 커스텀</SectionTitle>
        {/* Marker customization */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 10, padding: 10, borderRadius: 12,
          border: `1.2px solid ${INK}`, background: PAPER,
        }}>
          <div style={{ width: 70, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: SHAPES.find((s) => s.k === marker.shape)?.s ?? '50% 50% 50% 8%',
              transform: `rotate(${SHAPES.find((s) => s.k === marker.shape)?.r ?? -45}deg)`,
              background: marker.bgColor,
              border: `1.6px solid ${INK}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
            }}>
              <span style={{
                transform: `rotate(${-(SHAPES.find((s) => s.k === marker.shape)?.r ?? -45)}deg)`,
                fontSize: 22,
              }}>{marker.emoji}</span>
            </div>
            <input
              value={marker.emoji}
              onChange={(e) => setMarker((m) => ({ ...m, emoji: e.target.value.slice(-2) || '✨' }))}
              style={{
                width: '100%', height: 26, borderRadius: 6,
                border: `1.2px solid ${INK}`, background: PAPER,
                textAlign: 'center', fontSize: 14, outline: 'none',
              }}
            />
            <span style={{ fontFamily: FONT_MONO, fontSize: 7, color: INK_SOFT }}>이모지 입력</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginBottom: 4 }}>배경 컬러</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {BG_COLORS.map((c) => {
                  const active = marker.bgColor === c;
                  return (
                    <span
                      key={c}
                      onClick={() => setMarker((m) => ({ ...m, bgColor: c }))}
                      style={{
                        width: 22, height: 22, borderRadius: 6, background: c,
                        border: `${active ? 1.6 : 1}px solid ${active ? INK : INK_FAINT}`,
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginBottom: 4 }}>모양</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SHAPES.map((sh) => {
                  const active = marker.shape === sh.k;
                  return (
                    <span
                      key={sh.k}
                      onClick={() => setMarker((m) => ({ ...m, shape: sh.k }))}
                      title={sh.k}
                      style={{
                        width: 22, height: 22, borderRadius: sh.s,
                        transform: `rotate(${sh.r}deg)`, background: marker.bgColor,
                        border: `${active ? 1.6 : 1}px solid ${active ? INK : INK_FAINT}`,
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Trip name input */}
        <input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="여행 이름"
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 6,
            border: `1.2px solid ${INK}`, background: 'transparent',
            fontFamily: FONT_UI, fontSize: 13, color: INK,
            marginBottom: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <SectionTitle hint="선택">일행</SectionTitle>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {['지', '민'].map((c, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1.2px solid ${INK}`, background: SAGE,
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_HAND, fontSize: 14,
            }}>{c}</div>
          ))}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `1.2px dashed ${INK}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_UI, fontSize: 16, color: INK_SOFT, cursor: 'pointer',
          }}>+</div>
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 6, border: `1.2px solid ${INK}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9 }}>{inviteUrl}</span>
          <span
            onClick={onCopyInvite}
            style={{ fontFamily: FONT_UI, fontSize: 10, fontWeight: 600, color: TERRA, cursor: 'pointer' }}
          >
            🔗 복사
          </span>
        </div>
        <SectionTitle>대표 사진</SectionTitle>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[0, 1, 2, 3].map((i) => {
            const id = `cover-${i}`;
            const picked = flow.coverPhotoId === id;
            return (
              <div key={i} onClick={() => setUploadFlow({ coverPhotoId: picked ? null : id })} style={{ cursor: 'pointer' }}>
                <PhotoTile w={48} h={48} label={String.fromCharCode(75 + i)} picked={picked} />
              </div>
            );
          })}
        </div>
        <Btn
          primary={status === 'done'}
          full
          onClick={goCluster}
          style={{
            marginTop: 8,
            opacity: status === 'done' ? 1 : 0.55,
            cursor: status === 'done' ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'done'
            ? '준비 완료'
            : status === 'completing'
              ? 'AI 분석 시작 중...'
              : `업로드 중 ${doneCount} / ${fileCount}`}
        </Btn>
      </div>
    </Screen>
  );
}
