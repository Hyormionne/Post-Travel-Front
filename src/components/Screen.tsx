import { type CSSProperties, type ReactNode } from 'react';
import { PAPER, INK, FONT_UI } from '../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: CSSProperties;
}

// 메인 컨테이너. 폰 mock 폭(최대 390)을 가운데 정렬.
// 상단 28px은 모바일 safe-area / 노치용 예약 공간 (와이어프레임의 가짜 상태바 콘텐츠는 제거).
export function Screen({ children, scrollable = false, style }: ScreenProps) {
  return (
    <div style={{
      width: '100%', maxWidth: 390, height: '100%', minHeight: '100dvh',
      position: 'relative', margin: '0 auto',
      background: PAPER, color: INK, fontFamily: FONT_UI, fontSize: 11,
      overflow: scrollable ? 'auto' : 'hidden',
      paddingTop: 'env(safe-area-inset-top, 0)',
      ...style,
    }}>
      <div style={{ height: 28, flexShrink: 0 }} aria-hidden />
      {children}
    </div>
  );
}
