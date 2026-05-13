'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '../../components/Screen';
import {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import { Btn } from '../../components/ui';
import { joinRoom } from './api';
import type { Room } from '../../types/room';

type Status = 'loading' | 'success' | 'error';

export function InviteAcceptPage({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [room, setRoom] = useState<Room | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function accept() {
      try {
        const joined = await joinRoom(token);
        if (cancelled) return;
        setRoom(joined);
        setStatus('success');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(
          err instanceof Error ? err.message : '초대를 수락하지 못했어요',
        );
        setStatus('error');
      }
    }

    accept();
    return () => { cancelled = true; };
  }, [token]);

  const goToTrip = () => {
    if (room) {
      router.push(`/trip-detail?roomId=${encodeURIComponent(room.id)}`);
    }
  };

  const goHome = () => {
    router.push('/');
  };

  return (
    <Screen>
      <div style={{
        position: 'absolute', inset: 0, background: PAPER,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 32, gap: 20, textAlign: 'center',
      }}>
        {/* 로딩 */}
        {status === 'loading' && (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `3px solid ${INK_FAINT}`,
              borderTopColor: SAGE,
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontFamily: FONT_UI, fontSize: 13, color: INK_SOFT }}>
              초대를 확인하고 있어요...
            </span>
          </>
        )}

        {/* 성공 */}
        {status === 'success' && room && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: SAGE, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28,
            }}>
              {room.markerEmoji || '✈️'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{
                fontFamily: FONT_HAND, fontSize: 22, color: INK, fontWeight: 600,
              }}>
                초대를 수락했어요!
              </span>
              <span style={{
                fontFamily: FONT_UI, fontSize: 13, color: INK_SOFT, lineHeight: 1.5,
              }}>
                <strong style={{ color: INK }}>{room.title || '새 여행'}</strong>에
                {'\n'}함께하게 되었어요
              </span>
            </div>

            <div style={{
              background: PAPER_2, borderRadius: 12, padding: '14px 18px',
              width: '100%', maxWidth: 260, display: 'flex',
              flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: INK_SOFT }}>일행</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK_SOFT }}>
                  {room.members.length}명
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: INK_SOFT }}>생성일</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK_SOFT }}>
                  {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Btn onClick={goHome}>메인으로</Btn>
              <Btn primary onClick={goToTrip}>여행 보기</Btn>
            </div>
          </>
        )}

        {/* 에러 */}
        {status === 'error' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: PAPER_2, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28,
              border: `1.5px solid ${INK_FAINT}`,
            }}>
              😥
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{
                fontFamily: FONT_HAND, fontSize: 22, color: INK, fontWeight: 600,
              }}>
                초대를 수락하지 못했어요
              </span>
              <span style={{
                fontFamily: FONT_UI, fontSize: 12, color: INK_SOFT, lineHeight: 1.5,
              }}>
                링크가 만료되었거나 유효하지 않아요.{'\n'}
                초대한 사람에게 다시 요청해 보세요.
              </span>
            </div>

            {errorMsg && (
              <span style={{
                fontFamily: FONT_MONO, fontSize: 9, color: INK_FAINT,
                background: PAPER_2, borderRadius: 6, padding: '4px 10px',
              }}>
                {errorMsg}
              </span>
            )}

            <Btn primary onClick={goHome}>메인으로 돌아가기</Btn>
          </>
        )}
      </div>
    </Screen>
  );
}
