import { type CSSProperties, type ReactNode } from 'react';
import { PAPER_2, INK_FAINT } from '../theme/tokens';

interface MapBgProps {
  children?: ReactNode;
  style?: CSSProperties;
}

export function MapBg({ children, style }: MapBgProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: PAPER_2,
      backgroundImage: `
        radial-gradient(circle at 30% 40%, rgba(138,154,123,0.10) 0 80px, transparent 100px),
        radial-gradient(circle at 70% 60%, rgba(138,154,123,0.10) 0 100px, transparent 110px),
        linear-gradient(135deg, transparent 49.6%, rgba(44,38,32,0.18) 49.6% 50.2%, transparent 50.2%),
        linear-gradient(45deg, transparent 49.6%, rgba(44,38,32,0.10) 49.6% 50%, transparent 50%)
      `,
      backgroundSize: '100% 100%, 100% 100%, 60px 60px, 90px 90px',
      ...style,
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path
          d="M 10 80 Q 40 60 80 95 T 180 130 T 280 100 T 380 140 L 380 0 L 10 0 Z"
          fill="rgba(255,255,255,0.4)" stroke={INK_FAINT} strokeWidth={1}
          strokeDasharray="2 3" />
        <path d="M 0 360 Q 60 340 120 360 T 240 360 T 360 340"
          fill="none" stroke={INK_FAINT} strokeWidth={1} strokeDasharray="2 3" />
        <path d="M 50 200 C 120 180, 180 240, 260 220 S 360 180, 380 200"
          fill="none" stroke={INK_FAINT} strokeWidth={1.4} />
      </svg>
      {children}
    </div>
  );
}
