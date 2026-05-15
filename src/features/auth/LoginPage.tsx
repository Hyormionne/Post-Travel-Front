'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { FONT_UI, FONT_HAND } from '../../theme/tokens';
import { mockLogin, emailLogin, emailSignup } from './api';
import { isLoggedIn, getHasProfile } from '../../store/auth';
import { USE_MOCKS } from '../../lib/mockMode';

const IS_MOCK = USE_MOCKS;

// 컬러 — 와이어프레임 토큰 (globals.css :root 기준)
const C = {
  paper: '#faf5e8',
  ink: '#221f1a',
  ink2: '#3a342b',
  inkSoft: '#6b6353',
  inkFaint: '#9a917e',
  coral:    '#c66a4d',
  sage:     '#5a7a4a', // 더 진한 sage (버튼 가독성)
  tan:      '#d9b889',
};

export function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이메일 로그인/회원가입 상태
  type EmailStep = 'none' | 'login' | 'signup';
  const [emailStep, setEmailStep] = useState<EmailStep>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace(getHasProfile() ? '/' : '/profile-setup');
    }
  }, [router]);

  const handleEmailSubmit = async () => {
    if (IS_MOCK) {
      mockLogin();
      router.replace('/profile-setup');
      return;
    }
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 해요.');
      return;
    }
    if (emailStep === 'signup' && !nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (emailStep === 'login') {
        await emailLogin(email.trim(), password);
        router.replace('/');
      } else {
        await emailSignup(email.trim(), password, nickname.trim());
        router.replace('/');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      // 401 = 계정 없음 또는 비밀번호 불일치 → 회원가입으로 전환
      if (emailStep === 'login' && (msg.includes('401') || msg.includes('비밀번호') || msg.includes('Unauthorized'))) {
        setEmailStep('signup');
        setError('계정이 없거나 비밀번호가 틀려요. 새로 가입하시려면 닉네임을 입력해주세요.');
      } else {
        setError(msg || '문제가 발생했어요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable style={{ background: C.paper }}>
      {/* pseudo-element 스타일 (인라인으로 표현 불가한 것들) */}
      <style>{`
        .yh-accent::after {
          content: "";
          position: absolute;
          left: -2px; right: -2px; bottom: -2px;
          height: 8px;
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 10'><path d='M2 6 Q 22 1 42 5 T 82 5 T 118 5' fill='none' stroke='%23e7a851' stroke-width='3' stroke-linecap='round'/></svg>") no-repeat;
          background-size: 100% 100%;
          z-index: -1;
        }
        .yh-photo-p1::after {
          content: "";
          position: absolute;
          left: 30%; top: 14%;
          width: 8px; height: 8px;
          background: #fef0b8;
          border-radius: 50%;
          box-shadow: 0 0 12px 3px #fde79c;
        }
        .yh-photo-p2::after {
          content: "";
          position: absolute;
          left: 50%; top: 42%;
          transform: translateX(-50%);
          width: 24px; height: 24px;
          background: #fde0a4;
          border-radius: 50%;
          box-shadow: 0 0 20px 6px rgba(253,224,164,.6);
        }
        .yh-photo-p3::before {
          content: "";
          position: absolute;
          left: 0; right: 0;
          top: 48%; height: 1px;
          background: rgba(255,255,255,.5);
        }
        .yh-btn:active { transform: scale(.985); }
      `}</style>

      {/* 배경만 absolute — 콘텐츠와 분리 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(420px 280px at 88% -10%, #f6e8c2 0%, transparent 70%),
          radial-gradient(360px 280px at -10% 100%, #efe1ba 0%, transparent 70%),
          ${C.paper}
        `,
        pointerEvents: 'none',
      }} />

      {/* 콘텐츠 — 자연스럽게 흐르는 flex column */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        padding: '56px 28px 36px',
        zIndex: 1,
      }}>

        {/* 브랜드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <div style={{ width: 30, height: 36, flexShrink: 0 }}>
            <svg viewBox="0 0 30 36" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path
                d="M15 1.5 C 7.3 1.5 2 7 2 14.3 C 2 24.2 15 34.5 15 34.5 C 15 34.5 28 24.2 28 14.3 C 28 7 22.7 1.5 15 1.5 Z"
                fill={C.coral} stroke={C.ink} strokeWidth="1.4"
              />
              <circle cx="15" cy="13.5" r="4.6" fill={C.paper} stroke={C.ink} strokeWidth="1.4" />
            </svg>
          </div>
          <div style={{
            fontFamily: "'Gaegu', cursive", fontWeight: 700,
            fontSize: 30, letterSpacing: '.02em', lineHeight: 1, color: C.ink,
          }}>
            y<span style={{ color: C.coral }}>e</span>ohu
          </div>
        </div>

        {/* 히어로 일러스트 */}
        <div style={{
          position: 'relative',
          height: 220,
          margin: '18px -4px 0',
          borderRadius: 22,
          background: 'linear-gradient(180deg, #f7e6bb 0%, #ead0a0 60%, #d9b889 100%)',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px rgba(34,31,26,.06), 0 20px 40px -28px rgba(80,55,20,.55)',
          flexShrink: 0,
        }}>
          {/* 태양 */}
          <div style={{
            position: 'absolute', right: 38, top: 42,
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, #ffd884 0%, #e8a64b 70%, #c98837 100%)',
            boxShadow: '0 0 40px 6px rgba(231,168,81,.5)',
          }} />

          {/* 구름 */}
          {[
            { left: 30, top: 50, width: 70, height: 14 },
            { left: 54, top: 62, width: 46, height: 10 },
            { right: 130, top: 90, width: 54, height: 12 },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute', background: '#fdf4d8', borderRadius: 999, opacity: .85,
              boxShadow: '0 8px 0 -2px rgba(255,255,255,.4) inset',
              ...c,
            }} />
          ))}

          {/* 산 능선 */}
          <div style={{ position: 'absolute', left: -10, right: -10, bottom: 0, height: 170 }}>
            <svg viewBox="0 0 400 170" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0 110 L 60 70 L 110 100 L 170 60 L 230 95 L 290 65 L 350 100 L 400 80 L 400 170 L 0 170 Z" fill="#b59866" opacity=".55" />
              <path d="M0 140 L 50 110 L 100 130 L 160 100 L 220 130 L 280 105 L 340 135 L 400 115 L 400 170 L 0 170 Z" fill="#8a6e44" opacity=".5" />
            </svg>
          </div>

          {/* 스티커 */}
          <div style={{
            position: 'absolute', left: 14, top: 34,
            fontFamily: "'Gaegu', cursive", fontWeight: 700, color: '#7a3525', fontSize: 13,
            background: '#f6c2b4', padding: '3px 9px', borderRadius: 999,
            border: '1px solid rgba(34,31,26,.15)',
            boxShadow: '0 3px 8px -3px rgba(40,30,15,.3)',
            transform: 'rotate(-9deg)',
          }}>
            2025 · spring
          </div>
          <div style={{
            position: 'absolute', right: 14, top: 18,
            fontFamily: "'Gaegu', cursive", fontWeight: 700, color: '#41562a', fontSize: 13,
            background: '#dbe7c1', padding: '3px 9px', borderRadius: 999,
            border: '1px solid rgba(34,31,26,.15)',
            boxShadow: '0 3px 8px -3px rgba(40,30,15,.3)',
            transform: 'rotate(6deg)',
          }}>
            홋카이도 ✿
          </div>

          {/* 하트 */}
          <svg
            viewBox="0 0 24 24"
            style={{ position: 'absolute', right: 32, bottom: 140, width: 18, height: 18, transform: 'rotate(12deg)' }}
          >
            <path
              d="M12 21s-7-4.5-9.5-9C.9 8.7 2.6 4.5 6.4 4.5c2 0 3.5 1.2 4.6 2.8 1.1-1.6 2.6-2.8 4.6-2.8 3.8 0 5.5 4.2 3.9 7.5C19 16.5 12 21 12 21z"
              fill={C.coral} stroke={C.ink} strokeWidth="1.2" strokeLinejoin="round"
            />
          </svg>

          {/* 폴라로이드 사진 3장 */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -2, height: 170 }}>
            {/* p1 — 제주 한라산 (녹색, 좌측 기울기) */}
            <div style={{
              position: 'absolute', left: 24, bottom: 14, width: 112, height: 132,
              transform: 'rotate(-7deg)',
              background: '#fdf9ec', borderRadius: 6, padding: '8px 8px 22px',
              boxShadow: '0 12px 24px -8px rgba(40,30,15,.35), 0 2px 0 rgba(0,0,0,.04)',
              border: '1px solid rgba(34,31,26,.06)',
            }}>
              <div className="yh-photo-p1" style={{
                width: '100%', height: '100%', borderRadius: 3, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(180deg, #d9e3bf 0%, #b8c890 38%, #7d9258 70%, #5a7340 100%)',
              }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center',
                fontFamily: "'Gaegu', cursive", fontSize: 13, color: C.ink2, lineHeight: 1,
              }}>제주, 한라산</div>
            </div>

            {/* p3 — 발리 (블루, 우측 기울기) */}
            <div style={{
              position: 'absolute', right: 18, bottom: 8, width: 108, height: 126,
              transform: 'rotate(8deg)',
              background: '#fdf9ec', borderRadius: 6, padding: '8px 8px 22px',
              boxShadow: '0 12px 24px -8px rgba(40,30,15,.35), 0 2px 0 rgba(0,0,0,.04)',
              border: '1px solid rgba(34,31,26,.06)',
            }}>
              <div className="yh-photo-p3" style={{
                width: '100%', height: '100%', borderRadius: 3, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(180deg, #d6e6e6 0%, #9bbecb 40%, #5d8aa0 75%, #3c6677 100%)',
              }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center',
                fontFamily: "'Gaegu', cursive", fontSize: 13, color: C.ink2, lineHeight: 1,
              }}>발리 — 한 달</div>
            </div>

            {/* p2 — 교토 (코랄, 가운데, z-index 2) */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 24, width: 118, height: 138,
              transform: 'translateX(-50%) rotate(2deg)', zIndex: 2,
              background: '#fdf9ec', borderRadius: 6, padding: '8px 8px 22px',
              boxShadow: '0 12px 24px -8px rgba(40,30,15,.35), 0 2px 0 rgba(0,0,0,.04)',
              border: '1px solid rgba(34,31,26,.06)',
            }}>
              <div className="yh-photo-p2" style={{
                width: '100%', height: '100%', borderRadius: 3, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(180deg, #f7d49a 0%, #ec9d68 36%, #c66a4d 64%, #6b3d3a 100%)',
              }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center',
                fontFamily: "'Gaegu', cursive", fontSize: 13, color: C.ink2, lineHeight: 1,
              }}>교토의 저녁</div>
            </div>
          </div>
        </div>

        {/* 태그라인 */}
        <div style={{ marginTop: 18, textAlign: 'left' }}>
          <h1 style={{
            margin: 0,
            fontFamily: FONT_UI,
            fontWeight: 800, fontSize: 30, lineHeight: 1.2,
            letterSpacing: '-.022em', color: C.ink,
          }}>
            여행을,{' '}
            <span className="yh-accent" style={{ color: C.coral, position: 'relative', display: 'inline-block' }}>
              잊지 않게.
            </span>
          </h1>
          <p style={{
            margin: '8px 0 0', fontSize: 14, lineHeight: 1.55,
            color: C.inkSoft, fontWeight: 400,
          }}>
            여행 사진을 불러오면<br />
            AI가 날짜·장소별로 정리해 하나의 기록을 만들어줘요.
          </p>
        </div>

        {/* CTA 버튼 영역 */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {emailStep === 'none' ? (
            <>
              {/* 이메일로 계속하기 */}
              <button
                className="yh-btn"
                onClick={() => { setEmailStep('login'); setError(null); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', height: 54, borderRadius: 16,
                  fontSize: 15, fontWeight: 600, fontFamily: FONT_UI,
                  letterSpacing: '-.01em',
                  background: C.sage, color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 0 rgba(0,0,0,0.08), 0 8px 16px -8px rgba(40,30,15,.25)',
                  cursor: 'pointer',
                  transition: 'transform .15s ease',
                }}
              >
                이메일로 시작하기
              </button>
            </>
          ) : (
            <>
              {/* 이메일 로그인/회원가입 폼 */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <button
                  onClick={() => { setEmailStep('none'); setError(null); setEmail(''); setPassword(''); setNickname(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: FONT_UI, fontSize: 13, color: C.inkSoft, padding: '2px 0',
                  }}
                >
                  ← 돌아가기
                </button>
                <span style={{ marginLeft: 'auto', fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: C.ink }}>
                  {emailStep === 'login' ? '로그인' : '회원가입'}
                </span>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                style={{
                  width: '100%', height: 48, borderRadius: 12, padding: '0 16px',
                  fontSize: 14, fontFamily: FONT_UI, color: C.ink,
                  background: '#ffffff', border: '1px solid rgba(34,31,26,.15)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && emailStep === 'login' && handleEmailSubmit()}
                placeholder="비밀번호 (8자 이상)"
                style={{
                  width: '100%', height: 48, borderRadius: 12, padding: '0 16px',
                  fontSize: 14, fontFamily: FONT_UI, color: C.ink,
                  background: '#ffffff', border: '1px solid rgba(34,31,26,.15)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              {emailStep === 'signup' && (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="닉네임 (1~32자)"
                  maxLength={32}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, padding: '0 16px',
                    fontSize: 14, fontFamily: FONT_UI, color: C.ink,
                    background: '#ffffff', border: '1px solid rgba(34,31,26,.15)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              )}

              <button
                className="yh-btn"
                onClick={handleEmailSubmit}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', height: 54, borderRadius: 16,
                  fontSize: 15, fontWeight: 600, fontFamily: FONT_UI,
                  letterSpacing: '-.01em',
                  background: C.sage, color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 0 rgba(0,0,0,0.08), 0 8px 16px -8px rgba(40,30,15,.25)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'transform .15s ease',
                }}
              >
                {loading ? (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : null}
                {loading ? '처리 중...' : emailStep === 'login' ? '로그인' : '가입하기'}
              </button>

              {emailStep === 'login' && (
                <button
                  onClick={() => { setEmailStep('signup'); setError(null); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: FONT_UI, fontSize: 12, color: C.inkSoft,
                    textDecoration: 'underline', textUnderlineOffset: 2,
                    padding: '4px 0', alignSelf: 'center',
                  }}
                >
                  계정이 없으신가요? 회원가입
                </button>
              )}
              {emailStep === 'signup' && (
                <button
                  onClick={() => { setEmailStep('login'); setError(null); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: FONT_UI, fontSize: 12, color: C.inkSoft,
                    textDecoration: 'underline', textUnderlineOffset: 2,
                    padding: '4px 0', alignSelf: 'center',
                  }}
                >
                  이미 계정이 있으신가요? 로그인
                </button>
              )}
            </>
          )}

          {/* 에러 메시지 */}
          {error && (
            <p style={{ fontSize: 11, color: C.coral, textAlign: 'center', margin: '2px 0 0', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          {/* 이용약관 */}
          <div style={{
            marginTop: 14, textAlign: 'center',
            fontSize: 11, color: C.inkFaint, lineHeight: 1.55,
          }}>
            계속 진행하면{' '}
            <a href="#" style={{ color: C.inkSoft, textDecoration: 'underline', textUnderlineOffset: 2 }}>서비스 약관</a>
            {' · '}
            <a href="#" style={{ color: C.inkSoft, textDecoration: 'underline', textUnderlineOffset: 2 }}>개인정보 처리방침</a>에<br />
            동의하는 것으로 간주됩니다.
          </div>
        </div>

      </div>
    </Screen>
  );
}

