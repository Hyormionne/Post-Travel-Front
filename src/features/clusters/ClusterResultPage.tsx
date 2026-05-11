'use client';

import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { FolderCard, Btn } from '../../components/ui';
import { INK, INK_SOFT, PAPER, FONT_HAND, FONT_MONO } from '../../theme/tokens';

export function ClusterResultPage() {
  const router = useRouter();

  return (
    <Screen>
      <div style={{ position: 'absolute', inset: 0, background: PAPER }} />
      {/* Header */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, padding: '6px 16px' }}>
        <div style={{ fontFamily: FONT_HAND, fontSize: 18, color: INK, lineHeight: 1.1 }}>
          ✨ 127장의 사진을 5개의 추억으로 묶었어요
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 4 }}>
          홋카이도, 5월 · 클러스터링 완료
        </div>
      </div>
      {/* Grid */}
      <div style={{
        position: 'absolute', top: 90, left: 12, right: 12, bottom: 92,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        overflow: 'auto',
      }}>
        <FolderCard icon="🍣" title="삿포로의 맛" count={32} kw={['라멘', '스시']} />
        <FolderCard icon="❄️" title="비에이의 하얀 풍경" count={28} kw={['눈', '밭']} />
        <FolderCard icon="👥" title="우리들" count={24} kw={['셀카', '가족']} />
        <FolderCard icon="🌸" title="거리의 봄" count={43} kw={['벚꽃', '거리']} />
      </div>
      {/* Magic button */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 18 }}>
        <Btn magic full onClick={() => router.push('/generating')} style={{ padding: '14px 16px', fontSize: 13 }}>
          ✨ AI 여행로그 초안 만들기
        </Btn>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT,
          textAlign: 'center', marginTop: 8,
        }}>
          <span onClick={() => router.push('/')} style={{ textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
            나중에 만들기
          </span>
        </div>
      </div>
    </Screen>
  );
}
