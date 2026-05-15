import { type CSSProperties } from 'react';
import { INK, TERRA, FONT_MONO } from '../theme/tokens';

interface PhotoTileProps {
  w?: number | string;
  h?: number | string;
  label?: string;
  dim?: number;
  style?: CSSProperties;
  picked?: boolean;
  kind?: string;
  src?: string;
}

const TONES: [string, string][] = [
  ['#d8c9a5', '#b8a279'],
  ['#cfd8c2', '#a3b491'],
  ['#dcc4b3', '#b89884'],
  ['#c8cdd4', '#9ba4ad'],
  ['#e1d3a8', '#bda973'],
];

export function PhotoTile({ w = 60, h = 60, label, dim = 1, style, picked = false, kind, src }: PhotoTileProps) {
  const [a, b] = TONES[Math.abs((label || '').charCodeAt(0) || 0) % TONES.length];
  const sw = typeof w === 'number' ? w : 80;
  const sh = typeof h === 'number' ? h : 80;

  return (
    <div style={{
      width: w, height: h, position: 'relative', borderRadius: 4,
      background: src ? '#e8e0d0' : `linear-gradient(135deg, ${a}, ${b})`,
      border: `1px solid ${picked ? TERRA : INK}`,
      boxShadow: picked ? `0 0 0 2px ${TERRA}` : 'none',
      overflow: 'hidden', flexShrink: 0,
      opacity: dim,
      ...style,
    }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <svg width="100%" height="100%" viewBox={`0 0 ${sw} ${sh}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0 }}>
          <line x1={0} y1={sh * 0.7} x2={sw * 0.4} y2={sh * 0.3}
            stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
          <line x1={sw * 0.3} y1={sh} x2={sw} y2={sh * 0.4}
            stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
          <circle cx={sw * 0.7} cy={sh * 0.35} r={Math.min(sw, sh) * 0.12}
            fill="rgba(255,255,255,0.5)" />
        </svg>
      )}
      {kind && (
        <span style={{
          position: 'absolute', top: 2, left: 3,
          fontFamily: FONT_MONO, fontSize: 7, color: 'rgba(255,255,255,0.85)',
          textShadow: '0 1px 0 rgba(0,0,0,0.3)',
        }}>{kind}</span>
      )}
      {picked && (
        <span style={{
          position: 'absolute', top: 3, right: 3, width: 12, height: 12,
          borderRadius: '50%', background: TERRA, color: 'white',
          fontSize: 9, lineHeight: '12px', textAlign: 'center', fontWeight: 700,
        }}>&#10003;</span>
      )}
    </div>
  );
}
