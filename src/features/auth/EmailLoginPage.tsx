'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { FONT_UI, FONT_MONO } from '../../theme/tokens';
import { loginWithEmail } from './api';

const INK      = '#221f1a';
const INK_SOFT = '#6b6353';
const PAPER    = '#faf5e8';
const CORAL    = '#c66a4d';
const SAGE_VVD = '#5a7a4a';

export function EmailLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { hasProfile } = await loginWithEmail(email.trim(), password);
      router.replace(hasProfile ? '/' : '/profile-setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했어요.');
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
        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 14, color: INK }}>로그인</span>
      </div>

      <div style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="이메일"
          style={inputStyle}
          autoComplete="email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="비밀번호"
          style={inputStyle}
          autoComplete="current-password"
        />

        {error && (
          <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: CORAL, margin: 0, lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...actionBtnStyle,
            background: loading ? '#8a9a7b' : SAGE_VVD,
            marginTop: 4,
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Spinner /> 로그인 중...
            </span>
          ) : '로그인'}
        </button>

        <p style={{ fontFamily: FONT_UI, fontSize: 13, color: INK_SOFT, textAlign: 'center', margin: '8px 0 0' }}>
          계정이 없으신가요?{' '}
          <span
            onClick={() => router.push('/signup')}
            style={{ color: INK, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}
          >
            회원가입
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '15px 16px',
  background: '#fff', border: '1.5px solid #e0dbd0', borderRadius: 14,
  fontFamily: FONT_UI, fontSize: 15, color: INK, outline: 'none',
  boxSizing: 'border-box',
};

const actionBtnStyle: React.CSSProperties = {
  width: '100%', padding: '16px',
  border: 'none', borderRadius: 14,
  fontFamily: FONT_UI, fontSize: 15, fontWeight: 700, color: '#fff',
  cursor: 'pointer', transition: 'opacity .15s',
  boxShadow: '0 4px 12px rgba(90,122,74,0.35)',
};
