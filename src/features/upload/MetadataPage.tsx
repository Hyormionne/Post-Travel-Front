'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Progress, SectionTitle, Btn } from '../../components/ui';
import { INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA, FONT_HAND, FONT_UI, FONT_MONO } from '../../theme/tokens';

export function MetadataPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [tripName, setTripName] = useState('홋카이도, 5월');
  const [emoji, setEmoji] = useState('✨');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) { clearInterval(timer); return 1; }
        return prev + 0.02;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <Screen>
      <div style={{ position: 'absolute', inset: 0, background: PAPER }} />
      {/* Upload strip */}
      <div style={{
        position: 'absolute', top: 28, left: 0, right: 0, height: 84,
        background: PAPER_2, borderBottom: `1px solid ${INK_FAINT}`,
        padding: '10px 12px', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 6,
          fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
        }}>
          <span>업로드 중 · {Math.round(progress * 47)} / 47</span>
          <span>2.4 MB/s</span>
        </div>
        <Progress value={progress} />
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <PhotoTile key={i} w={42} h={42} label={String.fromCharCode(65 + i)}
              dim={i < Math.round(progress * 7) ? 1 : 0.4} />
          ))}
          <div style={{
            width: 42, height: 42, borderRadius: 4,
            border: `1px dashed ${INK_FAINT}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
          }}>+40</div>
        </div>
      </div>
      {/* Form area */}
      <div style={{ position: 'absolute', top: 124, left: 0, right: 0, bottom: 0, padding: '14px 16px', overflow: 'auto' }}>
        <SectionTitle hint="필수">여행 이름 · 마커 커스텀</SectionTitle>
        {/* Marker customization */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 10, padding: 10, borderRadius: 12,
          border: `1.2px solid ${INK}`, background: PAPER,
        }}>
          <div style={{ width: 70, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50% 50% 50% 8%',
              transform: 'rotate(-45deg)', background: '#d8c9a5',
              border: `1.6px solid ${INK}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: 22 }}>{emoji}</span>
            </div>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(-2))}
              style={{
                width: '100%', height: 26, borderRadius: 6,
                border: `1.2px solid ${INK}`, background: PAPER,
                textAlign: 'center', fontSize: 14, outline: 'none',
              }}
            />
            <span style={{ fontFamily: FONT_MONO, fontSize: 7, color: INK_SOFT }}>이모지 입력</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginBottom: 4 }}>배경 컬러</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['#d8c9a5', '#cfd8c2', '#e2c9bc', '#c9d2db', '#decfd8', '#f0ead2'].map((c, i) => (
                  <span key={c} style={{
                    width: 22, height: 22, borderRadius: 6, background: c,
                    border: `${i === 0 ? 1.6 : 1}px solid ${i === 0 ? INK : INK_FAINT}`,
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginBottom: 4 }}>모양</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[
                  { s: '50% 50% 50% 8%', r: -45, a: true },
                  { s: '50%', r: 0, a: false },
                  { s: '4px', r: 0, a: false },
                  { s: '50% 50% 4px 4px', r: 0, a: false },
                ].map((sh, i) => (
                  <span key={i} style={{
                    width: 22, height: 22, borderRadius: sh.s,
                    transform: `rotate(${sh.r}deg)`, background: '#d8c9a5',
                    border: `${sh.a ? 1.6 : 1}px solid ${sh.a ? INK : INK_FAINT}`,
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Trip name input */}
        <input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 6,
            border: `1.2px solid ${INK}`, background: 'transparent',
            fontFamily: FONT_UI, fontSize: 13, color: INK,
            marginBottom: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <SectionTitle hint="선택">일행</SectionTitle>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {['지', '민'].map((c, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1.2px solid ${INK}`, background: SAGE,
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_HAND, fontSize: 14,
            }}>{c}</div>
          ))}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `1.2px dashed ${INK}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_UI, fontSize: 16, color: INK_SOFT, cursor: 'pointer',
          }}>+</div>
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 6, border: `1.2px solid ${INK}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9 }}>yht.app/i/4Kj9..</span>
          <span style={{ fontFamily: FONT_UI, fontSize: 10, fontWeight: 600, color: TERRA, cursor: 'pointer' }}>🔗 복사</span>
        </div>
        <SectionTitle>대표 사진</SectionTitle>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[0, 1, 2, 3].map((i) => (
            <PhotoTile key={i} w={48} h={48} label={String.fromCharCode(75 + i)} picked={i === 1} />
          ))}
        </div>
        <Btn primary full onClick={() => router.push('/clusters')} style={{ marginTop: 8 }}>
          준비 완료
        </Btn>
      </div>
    </Screen>
  );
}
