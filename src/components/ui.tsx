import { type CSSProperties, type ReactNode } from 'react';
import { INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA, FONT_HAND, FONT_UI, FONT_MONO } from '../theme/tokens';

// ── ThumbPin ──
interface ThumbPinProps { x: number; y: number; label?: string; pending?: boolean; size?: number }
export function ThumbPin({ x, y, label, pending, size = 32 }: ThumbPinProps) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-100%)' }}>
      <div style={{
        width: size, height: size, borderRadius: '50% 50% 50% 8%',
        transform: 'rotate(-45deg)',
        background: pending ? 'transparent' : '#d8c9a5',
        border: `${pending ? '1.2px dashed' : '1.4px solid'} ${INK}`,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, transform: 'rotate(45deg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_HAND, fontSize: 10, color: INK_SOFT,
        }}>{pending ? '...' : (label || '✦')}</div>
      </div>
    </div>
  );
}

// ── FrostedHeader ──
interface FrostedHeaderProps { rightBadge?: boolean; profile?: string }
export function FrostedHeader({ rightBadge, profile = '나' }: FrostedHeaderProps) {
  return (
    <div style={{
      position: 'absolute', top: 28, left: 8, right: 8, height: 44,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 12px', borderRadius: 22,
      background: 'rgba(246,241,230,0.7)', backdropFilter: 'blur(8px)',
      border: `1px solid ${INK_FAINT}`, zIndex: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: `1.2px solid ${INK}`, background: PAPER_2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_HAND, fontSize: 12,
      }}>{profile}</div>
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: 16 }}>&#128276;</span>
        {rightBadge && (
          <span style={{
            position: 'absolute', top: -2, right: -2, width: 8, height: 8,
            borderRadius: '50%', background: TERRA, border: '1px solid white',
          }} />
        )}
      </div>
    </div>
  );
}

// ── FAB ──
interface FABProps { position?: 'right' | 'center'; label?: string; size?: number; color?: string; onClick?: () => void }
export function FAB({ position = 'right', label = '+', size = 56, color, onClick }: FABProps) {
  const pos = position === 'center'
    ? { left: '50%', transform: 'translateX(-50%)' } as CSSProperties
    : { right: 18 } as CSSProperties;
  return (
    <div onClick={onClick} style={{
      position: 'absolute', bottom: 24, ...pos,
      width: size, height: size, borderRadius: '50%',
      background: color || SAGE, color: 'white',
      border: `1.4px solid ${INK}`,
      boxShadow: '0 6px 0 rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_UI, fontSize: 26, fontWeight: 300,
      zIndex: 5, cursor: 'pointer',
    }}>{label}</div>
  );
}

// ── BottomSheet ──
interface BottomSheetProps { children: ReactNode; height?: string; style?: CSSProperties }
export function BottomSheet({ children, height = '78%', style }: BottomSheetProps) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height, background: PAPER,
      borderTopLeftRadius: 22, borderTopRightRadius: 22,
      border: `1.2px solid ${INK}`, borderBottom: 'none',
      boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
      padding: '14px 14px 12px', overflow: 'hidden',
      ...style,
    }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: INK_FAINT, margin: '0 auto 10px' }} />
      {children}
    </div>
  );
}

// ── Toast ──
interface ToastProps { children: ReactNode; style?: CSSProperties }
export function Toast({ children, style }: ToastProps) {
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 90,
      padding: '10px 14px', borderRadius: 10,
      background: INK, color: PAPER,
      fontFamily: FONT_UI, fontSize: 11,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
      zIndex: 20, ...style,
    }}>{children}</div>
  );
}

// ── Pill ──
interface PillProps { children: ReactNode; color?: string; solid?: boolean; style?: CSSProperties }
export function Pill({ children, color, solid, style }: PillProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99,
      fontFamily: FONT_UI, fontSize: 9, fontWeight: 500,
      border: `1px solid ${color || INK}`,
      background: solid ? (color || INK) : 'transparent',
      color: solid ? 'white' : (color || INK),
      ...style,
    }}>{children}</span>
  );
}

// ── Btn ──
interface BtnProps { children: ReactNode; primary?: boolean; magic?: boolean; full?: boolean; style?: CSSProperties; onClick?: () => void }
export function Btn({ children, primary, magic, full, style, onClick }: BtnProps) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer',
      padding: '10px 16px', borderRadius: 10,
      fontFamily: FONT_UI, fontSize: 12, fontWeight: 600,
      border: `1.2px solid ${INK}`,
      background: magic ? `linear-gradient(135deg, ${TERRA}, #d97a5c)` : (primary ? SAGE : 'transparent'),
      color: (primary || magic) ? 'white' : INK,
      width: full ? '100%' : 'auto',
      boxShadow: magic ? '0 4px 0 rgba(0,0,0,0.08)' : 'none',
      ...style,
    }}>{children}</button>
  );
}

// ── Progress ──
interface ProgressProps { value?: number; label?: string; style?: CSSProperties }
export function Progress({ value = 0.4, label, style }: ProgressProps) {
  return (
    <div style={style}>
      <div style={{ height: 4, background: INK_FAINT, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: TERRA, borderRadius: 2 }} />
      </div>
      {label && (
        <div style={{
          marginTop: 4, fontFamily: FONT_MONO, fontSize: 8,
          color: INK_SOFT, display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{label}</span><span>{Math.round(value * 100)}%</span>
        </div>
      )}
    </div>
  );
}

// ── SectionTitle ──
interface SectionTitleProps { children: ReactNode; hint?: string; style?: CSSProperties }
export function SectionTitle({ children, hint, style }: SectionTitleProps) {
  return (
    <div style={{
      fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, color: INK,
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 6, ...style,
    }}>
      <span>{children}</span>
      {hint && <span style={{ fontFamily: FONT_HAND, fontSize: 12, color: INK_SOFT, fontWeight: 400 }}>{hint}</span>}
    </div>
  );
}

// ── FolderCard ──
interface FolderCardProps { icon: string; title: string; count: number; kw?: string[]; style?: CSSProperties; onClick?: () => void }
export function FolderCard({ icon, title, count, kw = [], style, onClick }: FolderCardProps) {
  return (
    <div onClick={onClick} style={{
      border: `1.2px solid ${INK}`, borderRadius: 12,
      background: PAPER, padding: 10, position: 'relative',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      <div style={{ position: 'relative', height: 70, marginBottom: 8 }}>
        {['A', 'B', 'C'].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', left: 8 + i * 14, top: 4 + i * 4,
            transform: `rotate(${(i - 1) * 4}deg)`, zIndex: 3 - i,
            width: 56, height: 56, borderRadius: 4,
            background: `linear-gradient(135deg, #d8c9a5, #b8a279)`,
            border: `1px solid ${INK}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 11, flex: 1 }}>{title}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {kw.map((k) => <span key={k} style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>#{k}</span>)}
      </div>
    </div>
  );
}

// ── MapToggle (지도/타임라인) ──
interface MapToggleProps { active?: 'map' | 'timeline'; onToggle?: (v: 'map' | 'timeline') => void }
export function MapToggle({ active = 'map', onToggle }: MapToggleProps) {
  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 22,
      display: 'flex', background: 'rgba(246,241,230,0.92)',
      backdropFilter: 'blur(8px)', borderRadius: 99,
      border: `1.2px solid ${INK}`, padding: 3, gap: 2,
      boxShadow: '0 4px 10px rgba(0,0,0,0.10)',
    }}>
      {([{ l: '지도', k: 'map' as const, icon: '◉' }, { l: '타임라인', k: 'timeline' as const, icon: '☰' }]).map((s) => (
        <div key={s.k} onClick={() => onToggle?.(s.k)} style={{
          padding: '5px 12px', borderRadius: 99,
          background: active === s.k ? INK : 'transparent',
          color: active === s.k ? PAPER : INK,
          fontSize: 10, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 4,
          cursor: 'pointer',
        }}>
          <span style={{ fontSize: 9 }}>{s.icon}</span>{s.l}
        </div>
      ))}
    </div>
  );
}

// ── ZoomControls ──
export function ZoomControls() {
  return (
    <div style={{
      position: 'absolute', right: 14, top: 96,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {['+', '−'].map((s) => (
        <div key={s} style={{
          width: 28, height: 28, borderRadius: 8,
          background: PAPER, border: `1px solid ${INK}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_UI, fontSize: 14,
        }}>{s}</div>
      ))}
    </div>
  );
}
