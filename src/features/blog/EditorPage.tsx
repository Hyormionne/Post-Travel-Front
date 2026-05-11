'use client';

import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Btn, Pill, SectionTitle } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, FONT_HAND, FONT_UI, FONT_MONO } from '../../theme/tokens';

export function EditorPage() {
  const router = useRouter();

  return (
    <Screen scrollable>
      {/* Editor header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 72, paddingTop: 28,
        background: PAPER, borderBottom: `1px solid ${INK_FAINT}`,
        padding: '32px 14px 8px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={() => router.push('/')} style={{ fontSize: 16, cursor: 'pointer' }}>←</span>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: SAGE,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE }} />
          저장됨
        </div>
        <Btn primary style={{ padding: '6px 12px', fontSize: 11 }}>최종 발행</Btn>
      </div>
      {/* Body */}
      <div style={{ padding: '12px 16px 100px' }}>
        <div style={{
          fontFamily: FONT_HAND, fontSize: 24, fontWeight: 600,
          lineHeight: 1.15, marginBottom: 4,
        }}>
          홋카이도, 5월의 봄
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 12,
        }}>2025.05.12 — 05.16 · 일행 3 · AI 초안 ✦</div>
        {/* Hero photo */}
        <PhotoTile w="100%" h={140} label="A" style={{ marginBottom: 6 }} />
        <div style={{ fontFamily: FONT_UI, fontSize: 9, color: INK_SOFT, marginBottom: 14 }}>
          비에이 ▸ 흰 자작나무 길
        </div>
        {/* AI text placeholder */}
        <div style={{
          padding: 8, border: `1.2px dashed ${INK_FAINT}`, borderRadius: 6,
          marginBottom: 10, minHeight: 40, position: 'relative',
        }}>
          <span style={{ fontFamily: FONT_UI, fontSize: 10, color: INK }}>
            오전 6시, 비에이의 들판에 도착했다. 안개가 천천히 걷히기 시작했고, 자작나무 길은 마치 다른 세계처럼 보였다. 차가운 공기가 폐를 가득 채울 때마다 여행의 시작을 실감했다.
          </span>
          <span style={{
            position: 'absolute', bottom: 2, right: 4,
            fontFamily: FONT_MONO, fontSize: 7, color: INK_FAINT,
            textTransform: 'uppercase',
          }}>AI TEXT</span>
        </div>
        <SectionTitle>삿포로의 맛</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
          <PhotoTile w="100%" h={70} label="B" />
          <PhotoTile w="100%" h={70} label="C" />
        </div>
        <div style={{
          padding: 8, border: `1.2px dashed ${INK_FAINT}`, borderRadius: 6,
          marginBottom: 12, minHeight: 50, position: 'relative',
        }}>
          <span style={{ fontFamily: FONT_UI, fontSize: 10, color: INK }}>
            삿포로 라멘 골목에서 처음 먹은 미소 라멘은 지금까지 먹어본 것 중 가장 진한 맛이었다. 추운 날씨에 뜨거운 국물 한 모금이 온몸을 녹여주었다.
          </span>
          <span style={{
            position: 'absolute', bottom: 2, right: 4,
            fontFamily: FONT_MONO, fontSize: 7, color: INK_FAINT,
            textTransform: 'uppercase',
          }}>AI TEXT</span>
        </div>
        {/* AI suggestion */}
        <div style={{
          padding: 10, borderRadius: 10, background: PAPER_2,
          border: `1px dashed ${SAGE}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>✦</span>
          <span style={{ fontFamily: FONT_HAND, fontSize: 13, flex: 1 }}>
            여기에 '비에이의 풍경' 폴더 사진 더 넣을까요?
          </span>
          <Pill color={SAGE} solid>예</Pill>
        </div>
      </div>
      {/* Bottom toolbar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390, height: 44,
        background: PAPER, borderTop: `1px solid ${INK_FAINT}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        fontFamily: FONT_MONO, fontSize: 11, color: INK_SOFT,
        zIndex: 20,
      }}>
        {['B', 'I', 'H', '🖼', '✦'].map((s) => (
          <span key={s} style={{ cursor: 'pointer', padding: '8px 12px' }}>{s}</span>
        ))}
      </div>
    </Screen>
  );
}
