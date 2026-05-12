'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { PhotoTile } from '../../components/PhotoTile';
import { BottomSheet, Pill, Btn } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, FONT_MONO, FONT_UI, TERRA } from '../../theme/tokens';
import { isAllowedType } from './api';
import { setUploadFlow, useUploadFlow } from '../../store/uploadFlow';

interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  file?: File;
}

// 로컬 picker로 받은 파일 + 라이브러리 placeholder를 함께 다룬다.
function makePlaceholderItems(n: number): LocalFile[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `local-${i}`,
    name: `IMG_${1000 + i}.jpg`,
    size: 3_500_000,
    type: 'image/jpeg',
  }));
}

const FILTERS = ['전체', '5월', '즐겨찾기', '스크린샷'];

export function PhotoUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<LocalFile[]>(() => makePlaceholderItems(12));
  // 데모용 초기 선택 — BE 없이도 "다음 →"이 바로 동작하도록.
  const [picks, setPicks] = useState<string[]>(['local-0', 'local-1', 'local-4', 'local-5', 'local-8', 'local-11']);
  const [filter, setFilter] = useState<string>('전체');
  const [error, setError] = useState<string | null>(null);
  const [flow] = useUploadFlow();

  // 흐름 진입 시 이전 흐름의 임시 선택 복원
  useEffect(() => {
    if (flow.selectedLocalIds.length > 0) setPicks(flow.selectedLocalIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ObjectURL 누수 방지
  useEffect(() => {
    return () => {
      for (const it of items) if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePick = (id: string) => {
    setPicks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onPickFiles = () => inputRef.current?.click();

  const onFiles = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    const rejected = files.filter((f) => !isAllowedType(f.type));
    if (rejected.length > 0) {
      setError(`${rejected.length}장은 JPEG/PNG/WebP가 아니라 제외됐어요.`);
    } else {
      setError(null);
    }
    const accepted = files.filter((f) => isAllowedType(f.type));
    if (accepted.length === 0) return;

    const next: LocalFile[] = accepted.slice(0, 50).map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.type,
      previewUrl: URL.createObjectURL(f),
      file: f,
    }));
    setItems((cur) => [...next, ...cur]);
    setPicks((cur) => [...next.map((n) => n.id), ...cur]);
  };

  const goNext = () => {
    if (picks.length === 0) return;
    if (picks.length > 50) {
      setError('1회 최대 50장까지 업로드 가능해요.');
      return;
    }
    setUploadFlow({ selectedLocalIds: picks });
    router.push('/metadata');
  };

  const visibleItems = items; // 필터 UI는 표시만, 실 필터링은 차후

  return (
    <Screen>
      <MapBg style={{ filter: 'blur(2px) brightness(0.95)' }} />
      <BottomSheet height="84%">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13, fontFamily: FONT_UI }}>어떤 추억을 기록할까요?</span>
          <span
            onClick={onPickFiles}
            style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, cursor: 'pointer' }}
          >
            라이브러리 ▾
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {FILTERS.map((f) => (
            <span key={f} onClick={() => setFilter(f)} style={{ cursor: 'pointer' }}>
              <Pill solid={filter === f} color={INK}>
                {f}
              </Pill>
            </span>
          ))}
        </div>
        {error && (
          <div
            style={{
              marginBottom: 8,
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${TERRA}`,
              color: TERRA,
              fontFamily: FONT_MONO,
              fontSize: 9,
            }}
          >
            {error}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const tile = target.closest('[data-id]');
            if (tile) togglePick(tile.getAttribute('data-id')!);
          }}
          style={{ paddingBottom: 60 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
            <div
              onClick={onPickFiles}
              style={{
                height: 70,
                border: `1.2px dashed ${INK}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_UI,
                fontSize: 18,
                color: INK_SOFT,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.4)',
              }}
            >
              +
            </div>
            {visibleItems.map((it, i) => (
              <div key={it.id} data-id={it.id} style={{ cursor: 'pointer' }}>
                <PhotoTile
                  w="100%"
                  h={70}
                  label={String.fromCharCode(65 + (i % 26))}
                  picked={picks.includes(it.id)}
                />
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 12,
            background: '#f6f1e6',
            borderTop: `1px solid ${INK_FAINT}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>
              {picks.length}장 선택됨 {picks.length > 50 ? '(최대 50)' : ''}
            </div>
          </div>
          <Btn primary onClick={goNext}>
            다음 →
          </Btn>
        </div>
      </BottomSheet>
    </Screen>
  );
}
