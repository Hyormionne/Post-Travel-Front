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
import type { MarkerBgColor } from '../../types/room';
import { createRoom, getPresignedUrls, putToS3, completeUpload, buildCompleteItems } from './api';
import { getStoredFiles } from '../../store/uploadFiles';
import { addRoomId } from '../../store/roomRegistry';

const BG_COLORS: MarkerBgColor[] = ['#d8c9a5', '#cfd8c2', '#e2c9bc', '#c9d2db', '#decfd8', '#f0ead2'];

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

  // 인메모리 store에서 실제 File 객체 가져오기
  const storedFiles = useMemo(() => getStoredFiles(), []);
  const realFiles = useMemo(() => {
    return flow.selectedLocalIds
      .map((id) => ({ id, file: storedFiles.get(id) }))
      .filter((x): x is { id: string; file: File } => !!x.file);
  }, [flow.selectedLocalIds, storedFiles]);
  const fileCount = realFiles.length || flow.selectedLocalIds.length;

  // 실제 사진 미리보기 URL 생성
  const previewUrls = useMemo(() => {
    const urls = new Map<string, string>();
    for (const { id, file } of realFiles) {
      urls.set(id, URL.createObjectURL(file));
    }
    return urls;
  }, [realFiles]);

  // 미리보기 URL cleanup
  useEffect(() => {
    return () => {
      for (const url of previewUrls.values()) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  const [tripName, setTripName] = useState(flow.tripName || '');
  const [marker, setMarker] = useState(flow.marker);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'completing' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // 마커 커스텀은 변경 즉시 store에 반영
  useEffect(() => {
    setFlow({ marker, tripName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker.emoji, marker.bgColor, marker.shape, tripName]);

  const startUpload = async () => {
    if (status === 'uploading' || status === 'completing') return;
    if (!tripName.trim()) { setError('여행 이름을 입력해주세요.'); return; }
    if (realFiles.length === 0) { setError('업로드할 사진이 없어요.'); return; }

    setError(null);
    setStatus('uploading');
    setProgress(0);

    try {
      // 1) 룸 생성
      let roomId = flow.roomId;
      if (!roomId) {
        const room = await createRoom({
          title: tripName.trim(),
          markerEmoji: marker.emoji,
          markerBgColor: marker.bgColor,
          markerShape: marker.shape,
        });
        roomId = room.id;
        setFlow({ roomId, inviteToken: room.inviteToken });
      }
      addRoomId(roomId);

      // 2) presigned URLs
      const filesMeta = realFiles.map(({ file }) => ({
        name: file.name,
        size: file.size,
        contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      }));
      const presigned = await getPresignedUrls({ roomId, files: filesMeta });

      // 3) S3 PUT — 실제 파일 업로드 + 진행률
      const totalBytes = realFiles.reduce((s, { file }) => s + file.size, 0);
      const loaded = new Array<number>(presigned.length).fill(0);
      const update = () => {
        const sum = loaded.reduce((a, b) => a + b, 0);
        setProgress(Math.min(1, sum / totalBytes));
      };
      const tasks: Promise<void>[] = [];
      presigned.forEach((p, i) => {
        tasks.push(
          putToS3(p.original.url, realFiles[i].file, (l) => {
            loaded[i] = l;
            update();
          }),
        );
        // thumbnail은 같은 파일을 보냄 (서버 측 리사이즈 또는 차후 클라이언트 리사이즈)
        tasks.push(putToS3(p.thumbnail.url, realFiles[i].file));
      });
      await Promise.all(tasks);
      setProgress(1);

      // 4) complete
      setStatus('completing');
      const items = await buildCompleteItems(presigned, realFiles.map(({ file }) => file));
      await completeUpload({ roomId, photos: items });
      setStatus('done');

      // 바로 clusters 페이지로 이동
      router.push(`/clusters?roomId=${encodeURIComponent(roomId)}`);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : '업로드 실패');
    }
  };

  const inviteUrl = useMemo(() => {
    const token = flow.inviteToken ?? '4Kj9aB';
    return `yht.app/i/${token}`;
  }, [flow.inviteToken]);

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
        : status === 'uploading'
          ? `업로드 중 · ${doneCount} / ${fileCount}`
          : `${fileCount}장 준비됨`;

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
          {realFiles.slice(0, visiblePreviewCount).map(({ id }, i) => {
            const url = previewUrls.get(id);
            const uploaded = status === 'uploading' ? i < Math.round(progress * visiblePreviewCount) : status !== 'idle';
            return url ? (
              <div key={id} style={{
                width: 42, height: 42, borderRadius: 4, overflow: 'hidden',
                border: `1px solid ${INK_FAINT}`, opacity: uploaded ? 1 : 0.4, flexShrink: 0,
              }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : (
              <PhotoTile key={id} w={42} h={42} label={String.fromCharCode(65 + i)} dim={uploaded ? 1 : 0.4} />
            );
          })}
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
              placeholder=""
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setMarker((m) => ({ ...m, emoji: '' }));
                  return;
                }
                const chars = Array.from(val);
                setMarker((m) => ({ ...m, emoji: chars[chars.length - 1] }));
              }}
              onBlur={() => {
                if (!marker.emoji) setMarker((m) => ({ ...m, emoji: '✨' }));
              }}
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
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
          {realFiles.slice(0, 8).map(({ id }) => {
            const url = previewUrls.get(id);
            const picked = flow.coverPhotoId === id;
            return (
              <div
                key={id}
                onClick={() => setUploadFlow({ coverPhotoId: picked ? null : id })}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                {url ? (
                  <div style={{
                    width: 48, height: 48, borderRadius: 4, overflow: 'hidden', position: 'relative',
                    border: `1px solid ${picked ? TERRA : INK}`,
                    boxShadow: picked ? `0 0 0 2px ${TERRA}` : 'none',
                  }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {picked && (
                      <span style={{
                        position: 'absolute', top: 2, right: 2, width: 14, height: 14,
                        borderRadius: '50%', background: TERRA, color: 'white',
                        fontSize: 9, lineHeight: '14px', textAlign: 'center', fontWeight: 700,
                      }}>&#10003;</span>
                    )}
                  </div>
                ) : (
                  <PhotoTile w={48} h={48} label={id} picked={picked} />
                )}
              </div>
            );
          })}
        </div>
        <Btn
          primary={status === 'idle' || status === 'done'}
          full
          onClick={startUpload}
          style={{
            marginTop: 8,
            opacity: status === 'uploading' || status === 'completing' ? 0.55 : 1,
            cursor: status === 'uploading' || status === 'completing' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'idle'
            ? '업로드 시작'
            : status === 'uploading'
              ? `업로드 중 ${doneCount} / ${fileCount}`
              : status === 'completing'
                ? 'AI 분석 시작 중...'
                : status === 'error'
                  ? '다시 시도'
                  : '준비 완료'}
        </Btn>
      </div>
    </Screen>
  );
}
