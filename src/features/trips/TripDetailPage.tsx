'use client';

import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { FolderCard, SectionTitle } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, PAPER_2, SAGE, TERRA, FONT_HAND, FONT_UI, FONT_MONO } from '../../theme/tokens';

export function TripDetailPage() {
  const router = useRouter();

  return (
    <Screen scrollable>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 56, paddingTop: 28,
        background: 'rgba(246,241,230,0.85)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${INK_FAINT}`,
        padding: '32px 14px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={() => router.back()} style={{ fontSize: 16, cursor: 'pointer' }}>←</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>여행 상세</span>
        <span style={{ fontSize: 14 }}>⋯</span>
      </div>
      <div style={{ padding: '14px 16px 60px' }}>
        {/* Title + emoji + members */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50% 50% 50% 8%',
            transform: 'rotate(-45deg)', background: '#d8c9a5',
            border: `1.4px solid ${INK}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
          }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: 22 }}>✨</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_HAND, fontSize: 24, lineHeight: 1.05 }}>홋카이도, 5월의 봄</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginTop: 4 }}>
              2025.05.12 — 05.16 · 사진 127 · AI 초안 ✦
            </div>
          </div>
        </div>
        {/* Members */}
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 10, background: PAPER_2,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>함께한 사람</span>
          <div style={{ display: 'flex' }}>
            {['나', '지', '민'].map((c, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `1.2px solid ${INK}`, background: SAGE,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_HAND, fontSize: 12,
                marginLeft: i === 0 ? 0 : -8, position: 'relative', zIndex: 3 - i,
              }}>{c}</div>
            ))}
          </div>
          <span style={{ fontFamily: FONT_UI, fontSize: 10 }}>나, 지원, 민호</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONT_UI, fontSize: 10, color: SAGE, fontWeight: 600 }}>+ 초대</span>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 14, marginTop: 16, borderBottom: `1px solid ${INK_FAINT}` }}>
          {['블로그', '폴더', '미니맵'].map((t, i) => (
            <div key={t} style={{
              padding: '8px 0', fontSize: 11, fontWeight: i === 0 ? 600 : 400,
              borderBottom: i === 0 ? `2px solid ${TERRA}` : 'none',
              color: i === 0 ? INK : INK_SOFT, cursor: 'pointer',
            }}>{t}</div>
          ))}
        </div>
        {/* Blog cards */}
        <SectionTitle hint="2개" style={{ marginTop: 12, marginBottom: 8 }}>블로그</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { t: '오전 6시, 비에이의 안개', ex: 'AI 초안', d: '5월 13일' },
            { t: '삿포로 라멘 골목 산책', ex: '발행됨', d: '5월 14일' },
          ].map((b, i) => (
            <div key={i} onClick={() => router.push('/editor')} style={{
              display: 'flex', gap: 10, padding: 10, borderRadius: 10,
              border: `1px solid ${INK_FAINT}`, alignItems: 'center', cursor: 'pointer',
            }}>
              <PhotoTile w={56} h={56} label={String.fromCharCode(65 + i)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 11 }}>{b.t}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                  {b.d} · {b.ex}
                </div>
                <div style={{
                  marginTop: 4, padding: 4, fontSize: 9,
                  background: PAPER_2, borderRadius: 4,
                }}>
                  안개가 천천히 걷히기 시작했고, 자작나무 길은...
                </div>
              </div>
              <span style={{
                color: i === 0 ? TERRA : SAGE,
                fontFamily: FONT_HAND, fontSize: 13, fontWeight: 600,
              }}>{i === 0 ? '편집' : '읽기'} →</span>
            </div>
          ))}
          <div onClick={() => router.push('/editor')} style={{
            padding: 12, borderRadius: 6, border: `1.2px dashed ${INK}`,
            textAlign: 'center', fontFamily: FONT_HAND, fontSize: 13, color: INK_SOFT,
            cursor: 'pointer',
          }}>+ 새 블로그 글 작성</div>
        </div>
        {/* Folder grid */}
        <SectionTitle hint="4개" style={{ marginTop: 20, marginBottom: 8 }}>폴더</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FolderCard icon="🍣" title="삿포로의 맛" count={32} kw={['라멘', '스시']} />
          <FolderCard icon="❄️" title="비에이의 풍경" count={28} kw={['눈', '밭']} />
          <FolderCard icon="👥" title="우리들" count={24} kw={['셀카']} />
          <FolderCard icon="🌸" title="거리의 봄" count={43} kw={['벚꽃']} />
        </div>
      </div>
    </Screen>
  );
}
