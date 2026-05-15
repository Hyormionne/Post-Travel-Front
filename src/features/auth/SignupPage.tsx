'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { FONT_UI, FONT_MONO } from '../../theme/tokens';
import { registerWithEmail } from './api';

const INK      = '#221f1a';
const INK_SOFT = '#6b6353';
const PAPER    = '#faf5e8';
const CORAL    = '#c66a4d';
const SAGE_VVD = '#5a7a4a';

export function SignupPage() {
  const router = useRouter();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [nickname, setNickname]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const validate = () => {
    if (!email.trim()) return '이메일을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아니에요.';
    if (password.length < 8) return '비밀번호는 8자 이상이어야 해요.';
    if (!nickname.trim()) return '닉네임을 입력해주세요.';
    return null;
  };

  const handleSignup = async () => {
    const validErr = validate();
    if (validErr) { setError(validErr); return; }
    setLoading(true);
    setError(null);
    try {
      const { hasProfile } = await registerWithEmail(email.trim(), password, nickname.trim());
      router.replace(hasProfile ? '/' : '/profile-setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원가입에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 10px',
      }}>
        <button onClick={() => router.back()} style={headerBtnStyle}>← 돌아가기</button>
        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 14, color: INK }}>회원가입</span>
      </div>

      <div style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 이메일 */}
        <div>
          <label style={labelStyle}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="example@email.com"
            style={inputStyle}
            autoComplete="email"
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label style={labelStyle}>비밀번호 <span style={{ color: '#9a917e', fontWeight: 400 }}>(8자 이상)</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="••••••••"
            style={inputStyle}
            autoComplete="new-password"
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label style={labelStyle}>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
            placeholder="홍길동"
            style={inputStyle}
            autoComplete="nickname"
          />
        </div>

        {/* 에러 */}
        {error && (
          <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: CORAL, margin: 0, lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        {/* 가입하기 버튼 */}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            ...actionBtnStyle,
            background: loading ? '#8a9a7b' : SAGE_VVD,
            marginTop: 4,
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Spinner /> 가입 중...
            </span>
          ) : '가입하기'}
        </button>

        {/* 로그인 링크 */}
        <p style={{ fontFamily: FONT_UI, fontSize: 13, color: INK_SOFT, textAlign: 'center', margin: '8px 0 0' }}>
          이미 계정이 있으신가요?{' '}
          <span
            onClick={() => router.push('/login/email')}
            style={{ color: INK, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}
          >
            로그인
          </span>
        </p>
      </div>
    </Screen>
  );
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

const headerBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: FONT_UI, fontSize: 13, color: '#6b6353', padding: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: FONT_UI, fontSize: 12,
  fontWeight: 600, color: '#3a342b', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '15px 16px',
  background: '#fff', border: '1.5px solid #e0dbd0', borderRadius: 14,
  fontFamily: FONT_UI, fontSize: 15, color: '#221f1a', outline: 'none',
  boxSizing: 'border-box',
};

const actionBtnStyle: React.CSSProperties = {
  width: '100%', padding: '16px',
  border: 'none', borderRadius: 14,
  fontFamily: FONT_UI, fontSize: 15, fontWeight: 700, color: '#fff',
  cursor: 'pointer', transition: 'opacity .15s',
  boxShadow: '0 4px 12px rgba(90,122,74,0.35)',
};
