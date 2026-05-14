'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import {
  INK, INK_SOFT, INK_FAINT, SAGE, TERRA, PAPER, PAPER_2,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import {
  updateProfile, mockUpdateProfile,
  changePassword,
  deleteAccount,
  logout,
} from './api';
import { getUser, getAccessToken, clearAuth } from '../../store/auth';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

const AVATAR_EMOJIS = ['🌸', '🌊', '🍜', '🎌', '✈', '🏔', '🌅', '🗺', '🎒', '📸', '🌿', '🍵'];

// ── 작은 섹션 헤더 ──
function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT,
      letterSpacing: 0.5, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ── 구분선 ──
function Divider() {
  return <div style={{ height: 1, background: INK_FAINT, opacity: 0.3, margin: '24px 0' }} />;
}

// ── 인라인 저장 피드백 ──
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
function SaveFeedback({ state, errorMsg }: { state: SaveState; errorMsg?: string }) {
  if (state === 'idle') return null;
  const map: Record<SaveState, { text: string; color: string }> = {
    idle:   { text: '', color: '' },
    saving: { text: '저장 중...', color: INK_SOFT },
    saved:  { text: '✓ 저장됐어요', color: SAGE },
    error:  { text: errorMsg ?? '저장에 실패했어요', color: TERRA },
  };
  const { text, color } = map[state];
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color, marginLeft: 8 }}>{text}</span>
  );
}

export function ProfileEditPage() {
  const router = useRouter();

  // ── 초기 유저 정보 ──
  const [initDone, setInitDone] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✈');

  useEffect(() => {
    const u = getUser();
    if (u) {
      setNickname(u.nickname);
      setSelectedEmoji(u.profileEmoji);
    }
    setInitDone(true);
  }, []);

  // ── 프로필 저장 상태 ──
  const [profileSave, setProfileSave] = useState<SaveState>('idle');
  const [profileError, setProfileError] = useState('');
  const nicknameRef = useRef<HTMLInputElement>(null);

  const handleProfileSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 2) {
      nicknameRef.current?.focus();
      return;
    }
    setProfileSave('saving');
    try {
      if (IS_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        mockUpdateProfile(trimmed, selectedEmoji);
      } else {
        const token = getAccessToken();
        if (!token) throw new Error('로그인이 필요해요.');
        await updateProfile(trimmed, selectedEmoji, token);
      }
      setProfileSave('saved');
      setTimeout(() => setProfileSave('idle'), 2000);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : '저장 실패');
      setProfileSave('error');
      setTimeout(() => setProfileSave('idle'), 3000);
    }
  };

  // ── 비밀번호 변경 ──
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSave, setPwSave] = useState<SaveState>('idle');
  const [pwError, setPwError] = useState('');

  const handlePasswordChange = async () => {
    if (!curPw || !newPw || !confirmPw) { setPwError('모든 항목을 입력해주세요.'); return; }
    if (newPw.length < 8) { setPwError('새 비밀번호는 8자 이상이어야 해요.'); return; }
    if (newPw !== confirmPw) { setPwError('새 비밀번호가 일치하지 않아요.'); return; }
    setPwError('');
    setPwSave('saving');
    try {
      if (IS_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const token = getAccessToken();
        if (!token) throw new Error('로그인이 필요해요.');
        await changePassword(curPw, newPw, token);
      }
      setCurPw(''); setNewPw(''); setConfirmPw('');
      setPwSave('saved');
      setTimeout(() => setPwSave('idle'), 2000);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : '변경 실패');
      setPwSave('error');
      setTimeout(() => setPwSave('idle'), 3000);
    }
  };

  // ── 계정 삭제 ──
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteInput !== '삭제') return;
    setDeleting(true);
    try {
      if (!IS_MOCK) {
        const token = getAccessToken();
        if (!token) throw new Error('로그인이 필요해요.');
        await deleteAccount(token);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      await logout().catch(() => {});
      clearAuth();
      router.replace('/login');
    } catch {
      setDeleting(false);
      setDeleteInput('');
    }
  };

  if (!initDone) return null;

  return (
    <Screen scrollable>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px',
        background: 'rgba(246,241,230,0.92)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${INK_FAINT}`,
        zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT_UI, fontSize: 13, color: INK, padding: '2px 4px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← 뒤로
        </button>
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 13 }}>프로필 수정</span>
      </div>

      <div style={{ padding: '24px 20px 60px', display: 'flex', flexDirection: 'column' }}>

        {/* ── 섹션 1: 아바타 + 닉네임 ── */}
        <SectionLabel>프로필</SectionLabel>

        {/* 아바타 미리보기 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: PAPER_2, border: `2px solid ${INK}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          }}>
            {selectedEmoji}
          </div>
        </div>

        {/* 이모지 그리드 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20,
        }}>
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              style={{
                aspectRatio: '1', borderRadius: 10, fontSize: 20,
                background: selectedEmoji === emoji ? PAPER_2 : 'transparent',
                border: selectedEmoji === emoji ? `2px solid ${INK}` : `1.5px solid ${INK_FAINT}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: selectedEmoji === emoji ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* 닉네임 */}
        <label style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 6, letterSpacing: 0.4 }}>
          닉네임
        </label>
        <input
          ref={nicknameRef}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={12}
          style={{
            width: '100%', padding: '11px 13px',
            background: PAPER, border: `1.4px solid ${INK_FAINT}`, borderRadius: 10,
            fontFamily: FONT_UI, fontSize: 14, color: INK, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_FAINT }}>{nickname.length} / 12</span>
        </div>

        {/* 저장 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <button
            onClick={handleProfileSave}
            disabled={profileSave === 'saving'}
            style={{
              padding: '9px 20px', borderRadius: 10,
              background: SAGE, border: 'none', color: PAPER,
              fontFamily: FONT_UI, fontSize: 12, fontWeight: 600,
              cursor: profileSave === 'saving' ? 'not-allowed' : 'pointer',
              opacity: profileSave === 'saving' ? 0.7 : 1,
            }}
          >
            저장
          </button>
          <SaveFeedback state={profileSave} errorMsg={profileError} />
        </div>

        <Divider />

        {/* ── 섹션 2: 비밀번호 변경 ── */}
        <SectionLabel>비밀번호 변경</SectionLabel>

        {(['현재 비밀번호', '새 비밀번호', '새 비밀번호 확인'] as const).map((label, i) => {
          const values = [curPw, newPw, confirmPw];
          const setters = [setCurPw, setNewPw, setConfirmPw];
          return (
            <div key={label} style={{ marginBottom: 10 }}>
              <label style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>
                {label}
              </label>
              <input
                type="password"
                value={values[i]}
                onChange={(e) => setters[i](e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 13px',
                  background: PAPER, border: `1.4px solid ${INK_FAINT}`, borderRadius: 10,
                  fontFamily: FONT_UI, fontSize: 14, color: INK, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          );
        })}

        {pwError && (
          <p style={{ fontFamily: FONT_MONO, fontSize: 9, color: TERRA, margin: '4px 0 8px' }}>
            {pwError}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handlePasswordChange}
            disabled={pwSave === 'saving'}
            style={{
              padding: '9px 20px', borderRadius: 10,
              background: 'transparent', border: `1.4px solid ${INK}`,
              color: INK, fontFamily: FONT_UI, fontSize: 12, fontWeight: 600,
              cursor: pwSave === 'saving' ? 'not-allowed' : 'pointer',
              opacity: pwSave === 'saving' ? 0.7 : 1,
            }}
          >
            변경
          </button>
          <SaveFeedback state={pwSave} errorMsg={pwError} />
        </div>

        <Divider />

        {/* ── 섹션 3: 계정 삭제 ── */}
        <SectionLabel>계정 삭제</SectionLabel>

        {!deleteConfirm ? (
          <>
            <p style={{ fontFamily: FONT_UI, fontSize: 12, color: INK_SOFT, lineHeight: 1.6, margin: '0 0 12px' }}>
              계정을 삭제하면 모든 여행 기록과 블로그가 영구적으로 사라져요. 이 작업은 되돌릴 수 없어요.
            </p>
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{
                padding: '9px 20px', borderRadius: 10, alignSelf: 'flex-start',
                background: 'transparent', border: `1.4px solid ${TERRA}`,
                color: TERRA, fontFamily: FONT_UI, fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              계정 삭제
            </button>
          </>
        ) : (
          <div style={{
            background: '#fff5f3', border: `1.4px solid ${TERRA}`,
            borderRadius: 12, padding: '16px',
          }}>
            <p style={{ fontFamily: FONT_UI, fontSize: 12, color: TERRA, fontWeight: 600, margin: '0 0 8px' }}>
              정말 삭제할까요?
            </p>
            <p style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, margin: '0 0 12px', lineHeight: 1.6 }}>
              확인을 위해 아래 입력창에 <b style={{ color: INK }}>삭제</b>를 입력하세요.
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="삭제"
              style={{
                width: '100%', padding: '10px 12px',
                background: PAPER, border: `1.4px solid ${TERRA}`, borderRadius: 8,
                fontFamily: FONT_UI, fontSize: 14, color: INK, outline: 'none',
                boxSizing: 'border-box', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: 'transparent', border: `1.4px solid ${INK_FAINT}`,
                  color: INK_SOFT, fontFamily: FONT_UI, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== '삭제' || deleting}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: deleteInput === '삭제' ? TERRA : INK_FAINT,
                  border: 'none', color: PAPER,
                  fontFamily: FONT_UI, fontSize: 12, fontWeight: 600,
                  cursor: deleteInput === '삭제' && !deleting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {deleting && (
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: PAPER,
                    animation: 'spin 0.8s linear infinite',
                  }} />
                )}
                {deleting ? '삭제 중...' : '영구 삭제'}
              </button>
            </div>
          </div>
        )}

      </div>
    </Screen>
  );
}
