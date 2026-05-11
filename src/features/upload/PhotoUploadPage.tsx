'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { MapBg } from '../../components/MapBg';
import { PhotoTile } from '../../components/PhotoTile';
import { BottomSheet, Pill, Btn } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, FONT_MONO, FONT_UI } from '../../theme/tokens';

export function PhotoUploadPage() {
  const router = useRouter();
  const [picks, setPicks] = useState([0, 1, 4, 5, 8, 11]);

  const togglePick = (i: number) => {
    setPicks(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <Screen>
      <MapBg style={{ filter: 'blur(2px) brightness(0.95)' }} />
      <BottomSheet height="84%">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13, fontFamily: FONT_UI }}>어떤 추억을 기록할까요?</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>최근 ▾</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <Pill solid color={INK}>전체</Pill>
          <Pill>5월</Pill>
          <Pill>즐겨찾기</Pill>
          <Pill>스크린샷</Pill>
        </div>
        <div onClick={(e) => {
          const target = e.target as HTMLElement;
          const tile = target.closest('[data-idx]');
          if (tile) togglePick(Number(tile.getAttribute('data-idx')));
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} data-idx={i} style={{ cursor: 'pointer' }}>
                <PhotoTile w="100%" h={70}
                  label={String.fromCharCode(65 + i)}
                  kind={i % 5 === 0 ? 'IMG' : undefined}
                  picked={picks.includes(i)} />
              </div>
            ))}
          </div>
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: 12, background: '#f6f1e6',
          borderTop: `1px solid ${INK_FAINT}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>
              {picks.length}장 선택됨
            </div>
          </div>
          <Btn primary onClick={() => router.push('/metadata')}>다음 →</Btn>
        </div>
      </BottomSheet>
    </Screen>
  );
}
