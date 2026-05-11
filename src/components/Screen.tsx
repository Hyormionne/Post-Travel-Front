import { type CSSProperties, type ReactNode } from 'react';
import { PAPER, INK, INK_SOFT, FONT_UI, FONT_MONO } from '../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: CSSProperties;
}

export function Screen({ children, scrollable = false, style }: ScreenProps) {
  return (
    <div style={{
      width: '100%', maxWidth: 390, height: '100%', minHeight: '100dvh',
      position: 'relative', margin: '0 auto',
      background: PAPER, color: INK, fontFamily: FONT_UI, fontSize: 11,
      overflow: scrollable ? 'auto' : 'hidden',
      ...style,
    }}>
      {/* status bar */}
      <div style={{
        position: 'sticky', top: 0, left: 0, right: 0, height: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 16px', fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
        zIndex: 50, background: 'transparent',
      }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <span>•••</span><span>&#9680;</span><span>&#9646;</span>
        </span>
      </div>
      {children}
    </div>
  );
}
