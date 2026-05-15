'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Progress, SectionTitle, Btn } from '../../components/ui';
import {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA,
  FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import { useUploadFlow, setUploadFlow } from '../../store/uploadFlow';
import { photoCache } from '../../store/photoCache';
import type { MarkerBgColor } from '../../types/room';
import { createRoom, getPresignedUrls, putToS3, completeUpload } from './api';
import { saveRoomLocation, saveLocalTrip, formatTripTitle } from '../trips/api';

const BG_COLORS: MarkerBgColor[] = ['#d8c9a5', '#cfd8c2', '#e2c9bc', '#c9d2db', '#decfd8', '#f0ead2'];

type Shape = 'classic' | 'polaroid' | 'sticker' | 'dot' | 'flag' | 'ribbon';
const SHAPES: { k: Shape; s: string; r: number }[] = [
  { k: 'classic', s: '50% 50% 50% 8%', r: -45 },
  { k: 'polaroid', s: '4px', r: -6 },
  { k: 'sticker', s: '50%', r: 0 },
  { k: 'dot', s: '50%', r: 0 },
  { k: 'flag', s: '50% 50% 4px 4px', r: 0 },
  { k: 'ribbon', s: '6px', r: 0 },
];

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface CityOption {
  name: string;
  lat: number;
  lng: number;
}

// ── 날짜 선택 캘린더 ───────────────────────────────────────────────
function DatePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (dates: string[]) => void;
}) {
  const today = new Date();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=일

  const prevMonth = () => setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));

  const toggle = (d: number) => {
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(selected.includes(str) ? selected.filter((x) => x !== str) : [...selected, str]);
  };

  const label = view.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, border: `1.2px solid ${INK_FAINT}`, background: PAPER }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: INK_SOFT, fontSize: 14 }}
        >←</button>
        <span style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, color: INK }}>{label}</span>
        <button
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: INK_SOFT, fontSize: 14 }}
        >→</button>
      </div>
      {/* 요일 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontFamily: FONT_MONO, fontSize: 8, color: INK_FAINT }}>
            {d}
          </div>
        ))}
      </div>
      {/* 날짜 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSel = selected.includes(str);
          return (
            <div
              key={i}
              onClick={() => toggle(day)}
              style={{
                textAlign: 'center', padding: '5px 0', fontSize: 10,
                borderRadius: 5, cursor: 'pointer',
                background: isSel ? SAGE : 'transparent',
                color: isSel ? '#fff' : INK,
                fontWeight: isSel ? 600 : 400,
                fontFamily: FONT_MONO,
                transition: 'background .12s',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: 8, fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>
          {selected.length}일 선택됨
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export function MetadataPage() {
  const router = useRouter();
  const [flow] = useUploadFlow();
  const fileCount = flow.selectedLocalIds.length || 47;

  // ── 마커 커스텀 ──
  const [marker, setMarker] = useState(flow.marker);

  const [tripName] = useState(flow.tripName || '');
  const travelDatesRef = useRef<string[]>(flow.travelDates || []);

  // ── 도시 검색 ──
  const [cityQuery, setCityQuery] = useState(flow.cityName || '');
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(
    flow.cityName ? { name: flow.cityName, lat: flow.cityLat ?? 0, lng: flow.cityLng ?? 0 } : null,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 날짜 선택 ──
  const [travelDates, setTravelDates] = useState<string[]>(flow.travelDates || []);
  // ref를 통해 비동기 upload 클로저에서 최신 날짜 읽기
  useEffect(() => { travelDatesRef.current = travelDates; }, [travelDates]);

  // ── 업로드 진행 ──
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'completing' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // ── 대표사진: photoCache에서 실제 업로드 파일만 ──
  const uploadedPhotoIds = useMemo(
    () => flow.selectedLocalIds.filter((id) => id.startsWith('file-') && photoCache.get(id)),
    [flow.selectedLocalIds],
  );

  // ── 마커 변경 즉시 store 반영 ──
  useEffect(() => {
    setUploadFlow({ marker });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker.emoji, marker.bgColor, marker.shape]);

  // ── 진입 즉시 presigned → S3 → complete ──
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setStatus('uploading');
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        let roomId = flow.roomId;
        // 저장된 roomId가 mock ID(UUID 아님)면 버리고 재생성
        if (roomId && !UUID_RE.test(roomId)) {
          roomId = null;
          setUploadFlow({ roomId: null, inviteToken: null });
        }

        if (!roomId) {
          // title만 전송 (백엔드 CreateRoomDto에 title만 있음)
          const room = await createRoom({ title: flow.cityName || tripName || '새 여행' });
          if (cancelled) return;
          if (!UUID_RE.test(room.id)) {
            throw new Error('방 생성에 실패했어요. 로그인 상태를 확인하고 다시 시도해주세요.');
          }
          roomId = room.id;
          setUploadFlow({ roomId, inviteToken: room.inviteToken });
        }

        // 실제 파일: photoCache에 ObjectURL이 있는 'file-xxx' ID들
        const realIds = flow.selectedLocalIds.filter(
          (id) => id.startsWith('file-') && photoCache.get(id),
        );

        // blob 가져오기 — ObjectURL을 fetch해서 Blob으로 변환
        type FileInfo = { name: string; size: number; contentType: 'image/jpeg' | 'image/png' | 'image/webp'; blob: Blob };
        let fileInfos: FileInfo[];
        if (realIds.length > 0) {
          fileInfos = (
            await Promise.all(
              realIds.map(async (id) => {
                const objectUrl = photoCache.get(id)!;
                try {
                  const res = await fetch(objectUrl);
                  const blob = await res.blob();
                  const ct = (blob.type || 'image/jpeg') as FileInfo['contentType'];
                  return { name: `photo_${id}.jpg`, size: blob.size || 1024, contentType: ct, blob };
                } catch {
                  return { name: `photo_${id}.jpg`, size: 1024, contentType: 'image/jpeg' as const, blob: new Blob([''], { type: 'image/jpeg' }) };
                }
              }),
            )
          );
        } else {
          // 실제 파일 없음 — 데모용 더미 1개
          fileInfos = [{ name: 'demo.jpg', size: 1024, contentType: 'image/jpeg', blob: new Blob(['DEMO'], { type: 'image/jpeg' }) }];
        }

        const files = fileInfos.map((f) => ({ name: f.name, size: f.size, contentType: f.contentType }));
        const presigned = await getPresignedUrls({ roomId, files });
        if (cancelled) return;

        const totalBytes = fileInfos.reduce((s, f) => s + f.blob.size, 0) * 2 || 1;
        const loaded = new Array<number>(presigned.length * 2).fill(0);
        const update = () => setProgress(Math.min(1, loaded.reduce((a, b) => a + b, 0) / totalBytes));

        const tasks: Promise<void>[] = [];
        presigned.forEach((p, i) => {
          const blob = fileInfos[i]?.blob ?? new Blob([''], { type: 'image/jpeg' });
          tasks.push(putToS3(p.original.url, blob, (l) => { loaded[i * 2] = l; update(); }));
          tasks.push(putToS3(p.thumbnail.url, blob, (l) => { loaded[i * 2 + 1] = l; update(); }));
        });
        await Promise.all(tasks);
        if (cancelled) return;
        setProgress(1);
        setStatus('completing');

        // takenAt: travelDatesRef에서 최신 날짜 배열을 읽어 사진에 분산
        const dates = travelDatesRef.current.slice().sort();
        const photos = presigned.map((p, i) => {
          const item: import('../../types/photo').PhotoCompleteItem = {
            photoId: p.photoId,
            s3Key: p.original.key,
            thumbnailKey: p.thumbnail.key,
            fileSize: Math.max(1, fileInfos[i]?.blob.size ?? 1024),
          };
          if (dates.length > 0) {
            const dateIdx = Math.min(Math.floor((i / presigned.length) * dates.length), dates.length - 1);
            item.takenAt = `${dates[dateIdx]}T10:00:00.000Z`;
          }
          return item;
        });

        const result = await completeUpload({ roomId, photos });
        if (cancelled) return;
        setUploadFlow({ 
          photoCount: result.length,
          uploadedPhotoIds: result.map((p) => p.id),
          uploadedPhotos: result.map((p) => ({
            id: p.id,
            url: p.url,
            thumbnailUrl: p.thumbnailUrl,
         })),
        });
        setStatus('done');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : '업로드 실패');
      }
    }
    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 도시 검색 (Nominatim) ──
  const onCityQueryChange = (val: string) => {
    setCityQuery(val);
    setSelectedCity(null);
    if (cityTimer.current) clearTimeout(cityTimer.current);
    if (val.trim().length < 2) { setCitySuggestions([]); setShowSuggestions(false); return; }
    cityTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&accept-language=ko`,
          { headers: { 'Accept-Language': 'ko' } },
        );
        const data: NominatimResult[] = await res.json();
        const opts: CityOption[] = data.map((d) => ({
          name: d.display_name.split(',').slice(0, 2).join(',').trim(),
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        }));
        setCitySuggestions(opts);
        setShowSuggestions(opts.length > 0);
      } catch { /* 네트워크 오류 시 무시 */ }
    }, 400);
  };

  const onSelectCity = (city: CityOption) => {
    setSelectedCity(city);
    setCityQuery(city.name);
    setCitySuggestions([]);
    setShowSuggestions(false);
    setUploadFlow({ cityName: city.name, cityLat: city.lat, cityLng: city.lng });
  };

  // ── 완료 처리 ──
  const goCluster = () => {
    if (status !== 'done') return;
    if (!flow.roomId) return;
    const lat = selectedCity?.lat ?? flow.cityLat ?? null;
    const lng = selectedCity?.lng ?? flow.cityLng ?? null;
    const cityName = selectedCity?.name ?? cityQuery;
    setUploadFlow({
      tripName,
      travelDates,
      cityName,
      cityLat: lat,
      cityLng: lng,
    });
    if (lat && lng) {
      saveRoomLocation(flow.roomId, lat, lng);
      const title = formatTripTitle(cityName, travelDates, tripName);
      const sorted = travelDates.slice().sort();
      const dates = sorted.length > 1
        ? `${sorted[0].slice(5).replace('-', '/')} — ${sorted[sorted.length - 1].slice(5).replace('-', '/')}`
        : sorted[0] ?? '';
      saveLocalTrip({
        id: flow.roomId,
        emoji: flow.marker.emoji || '✈',
        title,
        dates,
        info: `사진 ${flow.photoCount || 0}`,
        status: '초안',
        lat,
        lng,
        year: sorted[0]?.slice(0, 4) ?? String(new Date().getFullYear()),
        thumbnails: [],
      });
    }
    router.push(`/clusters?roomId=${encodeURIComponent(flow.roomId)}`);
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
    status === 'done' ? '업로드 완료'
    : status === 'completing' ? 'AI 분석 시작 중'
    : `업로드 중 · ${doneCount} / ${fileCount}`;

  const visiblePreviewCount = Math.min(7, fileCount);

  const canComplete = status === 'done';

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
        title="생성 취소"
      >
        ×
      </button>

      {/* 업로드 진행 스트립 */}
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
          {flow.selectedLocalIds.slice(0, visiblePreviewCount).map((id, i) => {
            const url = photoCache.get(id);
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
              width: 42, height: 42, borderRadius: 4, border: `1px dashed ${INK_FAINT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
            }}>+{fileCount - visiblePreviewCount}</div>
          )}
        </div>
      </div>

      {/* 폼 영역 */}
      <div style={{ position: 'absolute', top: 124, left: 0, right: 0, bottom: 0, padding: '14px 16px', overflow: 'auto' }}>

        {/* ── 마커 커스텀 ── */}
        <SectionTitle hint="필수">여행 이름 · 마커 커스텀</SectionTitle>
        <div style={{
          display: 'flex', gap: 10, marginBottom: 10, padding: 10, borderRadius: 12,
          border: `1.2px solid ${INK}`, background: PAPER,
        }}>
          {/* 마커 미리보기 + 이모지/텍스트 입력 */}
          <div style={{ width: 70, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: SHAPES.find((s) => s.k === marker.shape)?.s ?? '50% 50% 50% 8%',
              transform: `rotate(${SHAPES.find((s) => s.k === marker.shape)?.r ?? -45}deg)`,
              background: marker.bgColor, border: `1.6px solid ${INK}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
            }}>
              <span style={{
                transform: `rotate(${-(SHAPES.find((s) => s.k === marker.shape)?.r ?? -45)}deg)`,
                fontSize: marker.emoji.length > 1 ? 11 : 22,
                fontFamily: FONT_UI, fontWeight: 700,
              }}>{marker.emoji || '✨'}</span>
            </div>
            <input
              value={marker.emoji}
              placeholder="이모지"
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.slice(0, 6);
                setMarker((m) => ({ ...m, emoji: val }));
              }}
              onBlur={() => {
                if (!marker.emoji.trim()) setMarker((m) => ({ ...m, emoji: '✨' }));
              }}
              style={{
                width: '100%', height: 26, borderRadius: 6,
                border: `1.2px solid ${INK}`, background: PAPER,
                textAlign: 'center', fontSize: 12, outline: 'none', fontFamily: FONT_UI,
              }}
            />
            <span style={{ fontFamily: FONT_MONO, fontSize: 7, color: INK_SOFT, textAlign: 'center', lineHeight: 1.4 }}>
              이모지 또는<br />텍스트 입력<br />(1~6자)
            </span>
          </div>

          {/* 색상 + 모양 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginBottom: 4 }}>배경 컬러</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {BG_COLORS.map((c) => {
                  const active = marker.bgColor === c;
                  return (
                    <span key={c} onClick={() => setMarker((m) => ({ ...m, bgColor: c }))} style={{
                      width: 22, height: 22, borderRadius: 6, background: c,
                      border: `${active ? 1.6 : 1}px solid ${active ? INK : INK_FAINT}`,
                      cursor: 'pointer',
                    }} />
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
                    <span key={sh.k} onClick={() => setMarker((m) => ({ ...m, shape: sh.k }))} title={sh.k} style={{
                      width: 22, height: 22, borderRadius: sh.s,
                      transform: `rotate(${sh.r}deg)`, background: marker.bgColor,
                      border: `${active ? 1.6 : 1}px solid ${active ? INK : INK_FAINT}`,
                      cursor: 'pointer',
                    }} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 도시 검색 ── */}
        <SectionTitle>도시</SectionTitle>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <input
            value={cityQuery}
            onChange={(e) => onCityQueryChange(e.target.value)}
            onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="도시 이름 검색 (선택)"
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 6,
              border: `1.2px solid ${selectedCity ? SAGE : INK}`,
              background: 'transparent', fontFamily: FONT_UI, fontSize: 13, color: INK,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {selectedCity && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>📍</span>
          )}
          {showSuggestions && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              background: '#fff', border: `1.2px solid ${INK_FAINT}`, borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)', marginTop: 2,
            }}>
              {citySuggestions.map((city, i) => (
                <div
                  key={i}
                  onMouseDown={() => onSelectCity(city)}
                  style={{
                    padding: '9px 14px', fontFamily: FONT_UI, fontSize: 12, color: INK,
                    cursor: 'pointer', borderBottom: i < citySuggestions.length - 1 ? `1px solid ${INK_FAINT}` : 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = PAPER_2; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                >
                  {city.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 날짜 선택 ── */}
        <SectionTitle>여행 날짜</SectionTitle>
        <div style={{ marginBottom: 14 }}>
          <DatePicker selected={travelDates} onChange={setTravelDates} />
        </div>

        {/* ── 일행 초대 ── */}
        <SectionTitle hint="선택">일행</SectionTitle>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          padding: '10px 12px', borderRadius: 8, border: `1.2px dashed ${INK_FAINT}`,
          cursor: 'default',
        }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontFamily: FONT_UI, fontSize: 12, color: INK_SOFT }}>
            일행 초대
          </span>
          <span style={{
            marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
          }}>링크를 공유하세요</span>
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 6, border: `1.2px solid ${INK}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK }}>{inviteUrl}</span>
          <span onClick={onCopyInvite} style={{ fontFamily: FONT_UI, fontSize: 10, fontWeight: 600, color: TERRA, cursor: 'pointer' }}>
            🔗 복사
          </span>
        </div>

        {/* ── 대표 사진 ── */}
        <SectionTitle>대표 사진</SectionTitle>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {uploadedPhotoIds.length > 0 ? (
            uploadedPhotoIds.slice(0, 8).map((id) => {
              const src = photoCache.get(id);
              const picked = flow.coverPhotoId === id;
              return (
                <div key={id} onClick={() => setUploadFlow({ coverPhotoId: picked ? null : id })} style={{ cursor: 'pointer' }}>
                  <PhotoTile w={56} h={56} src={src} picked={picked} />
                </div>
              );
            })
          ) : (
            // 실제 업로드 사진이 없으면 placeholder 4장
            [0, 1, 2, 3].map((i) => {
              const id = `cover-${i}`;
              const picked = flow.coverPhotoId === id;
              return (
                <div key={i} onClick={() => setUploadFlow({ coverPhotoId: picked ? null : id })} style={{ cursor: 'pointer' }}>
                  <PhotoTile w={56} h={56} label={String.fromCharCode(75 + i)} picked={picked} />
                </div>
              );
            })
          )}
        </div>

        {/* ── 완료 버튼 ── */}
        <Btn
          primary={canComplete}
          full
          onClick={goCluster}
          style={{
            marginTop: 8,
            opacity: canComplete ? 1 : 0.55,
            cursor: canComplete ? 'pointer' : 'not-allowed',
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

        <div style={{ height: 32 }} />
      </div>
    </Screen>
  );
}
