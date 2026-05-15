'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { PhotoTile } from '../../components/PhotoTile';
import { BottomSheet, Pill, Btn } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, FONT_MONO, FONT_UI, TERRA } from '../../theme/tokens';
import { isAllowedType } from './api';
import { resetUploadFlow, setUploadFlow, useUploadFlow } from '../../store/uploadFlow';
import { photoCache } from '../../store/photoCache';
import { storeFiles } from '../../store/uploadFiles';

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

  const [items, setItems] = useState<LocalFile[]>([]);
  const [picks, setPicks] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('전체');
  const [error, setError] = useState<string | null>(null);
  const [flow] = useUploadFlow();

  // 새 업로드 흐름 시작 — 이전 흐름 초기화
  useEffect(() => {
    resetUploadFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ObjectURL은 photoCache가 관리 — 컴포넌트 언마운트 시 직접 revoke 안 함
  // (MetadataPage에서 대표사진 미리보기에 그대로 사용)

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

    const next: LocalFile[] = accepted.slice(0, 50).map((f, i) => {
      const id = `file-${Date.now()}-${i}`;
      const previewUrl = URL.createObjectURL(f);
      photoCache.set(id, previewUrl); // MetadataPage에서도 사용 가능하도록 캐시
      return { id, name: f.name, size: f.size, type: f.type, previewUrl, file: f };
    });
    setItems((cur) => [...next, ...cur]);
    setPicks((cur) => [...next.map((n) => n.id), ...cur]);
  };

  const goNext = () => {
    if (picks.length === 0) return;
    if (picks.length > 50) {
      setError('1회 최대 50장까지 업로드 가능해요.');
      return;
    }
    // 선택된 사진의 File 객체를 인메모리 store에 저장 (MetadataPage에서 사용)
    const pickedFiles = items
      .filter((it) => picks.includes(it.id) && it.file)
      .map((it) => ({ id: it.id, file: it.file! }));
    storeFiles(pickedFiles);
    setUploadFlow({ selectedLocalIds: picks });
    router.push('/metadata');
  };

  const visibleItems = items; // 필터 UI는 표시만, 실 필터링은 차후

  return (
    <Screen>
      <MapBg style={{ filter: 'blur(2px) brightness(0.95)' }} />
      <div
        onClick={() => router.push('/')}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 370, height: 140,
          zIndex: 20, cursor: 'pointer',
        }}
      />
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
            {visibleItems.map((it) => (
              <div key={it.id} data-id={it.id} style={{ cursor: 'pointer' }}>
                {it.previewUrl ? (
                  <div style={{
                    width: '100%', height: 70, position: 'relative', borderRadius: 4,
                    overflow: 'hidden', flexShrink: 0,
                    border: `1px solid ${picks.includes(it.id) ? TERRA : INK}`,
                    boxShadow: picks.includes(it.id) ? `0 0 0 2px ${TERRA}` : 'none',
                  }}>
                    <img
                      src={it.previewUrl}
                      alt={it.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {picks.includes(it.id) && (
                      <span style={{
                        position: 'absolute', top: 3, right: 3, width: 16, height: 16,
                        borderRadius: '50%', background: TERRA, color: 'white',
                        fontSize: 10, lineHeight: '16px', textAlign: 'center', fontWeight: 700,
                      }}>&#10003;</span>
                    )}
                  </div>
                ) : (
                  <PhotoTile
                    w="100%"
                    h={70}
                    label={it.name}
                    picked={picks.includes(it.id)}
                  />
                )}
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
