'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import {
  INK, INK_SOFT, INK_FAINT, SAGE, TERRA, PAPER, PAPER_2,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import { createProfile, mockCreateProfile } from './api';
import { isLoggedIn, getHasProfile, getAccessToken } from '../../store/auth';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

const AVATAR_EMOJIS = ['🌸', '🌊', '🍜', '🎌', '✈', '🏔', '🌅', '🗺', '🎒', '📸', '🌿', '🍵'];

export function ProfileSetupPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✈');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
    if (getHasProfile()) {
      router.replace('/');
    }
  }, [router]);

  const validate = (): boolean => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError('닉네임을 입력해주세요.');
      inputRef.current?.focus();
      return false;
    }
    if (trimmed.length < 2) {
      setNicknameError('두 글자 이상 입력해주세요.');
      inputRef.current?.focus();
      return false;
    }
    if (trimmed.length > 12) {
      setNicknameError('12자 이하로 입력해주세요.');
      inputRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      if (IS_MOCK) {
        mockCreateProfile(nickname.trim(), selectedEmoji);
        router.replace('/');
        return;
      }
      const token = getAccessToken();
      if (!token) throw new Error('로그인 상태가 아닙니다.');
      await createProfile(nickname.trim(), selectedEmoji, token);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '프로필 생성에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (nicknameError) setNicknameError(null);
  };

  return (
    <Screen scrollable>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100%',
        padding: '64px 24px 48px',
      }}>

        {/* 상단 타이틀 */}
        <h1 style={{
          fontFamily: FONT_HAND,
          fontSize: 28,
          fontWeight: 600,
          color: INK,
          margin: '0 0 6px',
          textAlign: 'center',
        }}>
          반가워요! 👋
        </h1>
        <p style={{
          fontFamily: FONT_UI,
          fontSize: 13,
          color: INK_SOFT,
          margin: '0 0 40px',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          여행후유증에서 쓸 프로필을 만들어요
        </p>

        {/* 아바타 이모지 선택 */}
        <div style={{
          width: 80, height: 80,
          borderRadius: '50%',
          background: PAPER_2,
          border: `2px solid ${INK}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          marginBottom: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          position: 'relative',
        }}>
          {selectedEmoji}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 22, height: 22,
            borderRadius: '50%',
            background: SAGE,
            border: `2px solid ${PAPER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10,
          }}>
            ✎
          </div>
        </div>

        <p style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: INK_SOFT,
          margin: '0 0 12px',
        }}>
          아바타 선택
        </p>

        {/* 이모지 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
          marginBottom: 36,
          width: '100%',
          maxWidth: 300,
        }}>
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 10,
                background: selectedEmoji === emoji ? PAPER_2 : 'transparent',
                border: selectedEmoji === emoji ? `2px solid ${INK}` : `1.5px solid ${INK_FAINT}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                transition: 'all 0.12s',
                boxShadow: selectedEmoji === emoji ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* 닉네임 입력 */}
        <div style={{ width: '100%', maxWidth: 300, marginBottom: 12 }}>
          <label style={{
            display: 'block',
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: INK_SOFT,
            marginBottom: 8,
            letterSpacing: 0.4,
          }}>
            닉네임
          </label>
          <input
            ref={inputRef}
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="예: 여행덕후, 맛집탐험가"
            maxLength={12}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: PAPER,
              border: `1.4px solid ${nicknameError ? TERRA : INK_FAINT}`,
              borderRadius: 10,
              fontFamily: FONT_UI,
              fontSize: 14,
              color: INK,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.12s',
            }}
            onFocus={(e) => {
              if (!nicknameError) e.target.style.borderColor = INK;
            }}
            onBlur={(e) => {
              if (!nicknameError) e.target.style.borderColor = INK_FAINT;
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 5,
          }}>
            {nicknameError ? (
              <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: TERRA }}>
                {nicknameError}
              </span>
            ) : (
              <span />
            )}
            <span style={{
              fontFamily: FONT_MONO,
              fontSize: 8,
              color: INK_FAINT,
            }}>
              {nickname.length} / 12
            </span>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <p style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: TERRA,
            textAlign: 'center',
            margin: '0 0 12px',
          }}>
            {error}
          </p>
        )}

        {/* 시작하기 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            maxWidth: 300,
            padding: '14px',
            background: loading ? INK_FAINT : SAGE,
            border: 'none',
            borderRadius: 12,
            fontFamily: FONT_UI,
            fontSize: 14,
            fontWeight: 700,
            color: PAPER,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 4px 0 rgba(0,0,0,0.12), 0 8px 20px rgba(138,154,123,0.30)',
            transition: 'all 0.15s',
            marginTop: 4,
          }}
        >
          {loading && (
            <div style={{
              width: 16, height: 16,
              borderRadius: '50%',
              border: `2px solid rgba(255,255,255,0.4)`,
              borderTopColor: PAPER,
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
          {loading ? '저장 중...' : '여행 시작하기 →'}
        </button>

        <p style={{
          fontFamily: FONT_MONO,
          fontSize: 8,
          color: INK_FAINT,
          textAlign: 'center',
          marginTop: 16,
        }}>
          닉네임은 나중에 설정에서 변경할 수 있어요
        </p>
      </div>
    </Screen>
  );
}
