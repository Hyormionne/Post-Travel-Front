'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { SectionTitle } from '../../components/ui';
import { MainShell } from '../../components/MainShell';
import {
  INK, INK_SOFT, INK_FAINT, PAPER_2, SAGE, TERRA,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import { getRoom, listTrips, resolveMemberName } from './api';
import { FolderCardLive } from '../clusters/components/FolderCardLive';
import { fetchClusters } from '../clusters/api';
import { listBlogs } from '../blog/api';
import type { Room } from '../../types/room';
import type { Cluster } from '../../types/cluster';
import type { Blog } from '../../types/blog';
import { MOCK_PHOTOS } from '../../mocks/data';

type Tab = '블로그' | '폴더';

export function TripDetailPage() {
  const router = useRouter();
  const search = useSearchParams();
  const roomId = search?.get('roomId') ?? 'room-001';

  const [tab, setTab] = useState<Tab>('블로그');
  const [room, setRoom] = useState<Room | null>(null);
  const [trip, setTrip] = useState<{ emoji: string; title: string; dates: string; info: string } | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [r, all, cs, bs] = await Promise.all([
        getRoom(roomId).catch(() => null),
        listTrips().catch(() => []),
        fetchClusters(roomId).catch(() => []),
        listBlogs(roomId).catch(() => []),
      ]);
      if (cancelled) return;
      setRoom(r);
      const t = all.find((x) => x.id === roomId) ?? all[0] ?? null;
      if (t) setTrip({ emoji: t.emoji, title: t.title, dates: t.dates, info: t.info });
      setClusters(cs);
      setBlogs(bs);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const photoKeywordIndex = useMemo(() => {
    const idx: Record<string, string[]> = {};
    for (const p of MOCK_PHOTOS) idx[p.id] = p.aiKeywords;
    return idx;
  }, []);

  const members = room?.members ?? [];
  const memberNames = members.map((m) => resolveMemberName(m.userId));

  const onOpenBlog = (b: Blog) => {
    router.push(`/editor?blogId=${encodeURIComponent(b.id)}`);
  };
  const onNewBlog = () => {
    router.push(`/editor?roomId=${encodeURIComponent(roomId)}`);
  };

  return (
    <Screen scrollable>
      {/* Compact header — 채팅 확정: height 36, 우상단 ⋯ 삭제 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 24,
        background: 'rgba(246,241,230,0.85)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${INK_FAINT}`,
        padding: '10px 14px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxSizing: 'content-box',
      }}>
        <span onClick={() => router.back()} style={{ fontSize: 14, cursor: 'pointer' }}>←</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>여행 상세</span>
        <span style={{ width: 14 }} />
      </div>
      <div style={{ padding: '14px 16px 90px' }}>
        {/* Title + emoji + members */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50% 50% 50% 8%',
            transform: 'rotate(-45deg)', background: '#d8c9a5',
            border: `1.4px solid ${INK}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
          }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: 22 }}>{trip?.emoji ?? '✨'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_HAND, fontSize: 24, lineHeight: 1.05 }}>
              {trip?.title ?? room?.title ?? '여행'}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginTop: 4 }}>
              {trip?.dates ?? '날짜 미정'} · {trip?.info ?? `사진 ${MOCK_PHOTOS.length}`} · AI 초안 ✦
            </div>
          </div>
        </div>
        {/* Members */}
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 10, background: PAPER_2,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT }}>함께한 사람</span>
          <div style={{ display: 'flex' }}>
            {memberNames.map((c, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `1.2px solid ${INK}`, background: SAGE,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_HAND, fontSize: 12,
                marginLeft: i === 0 ? 0 : -8, position: 'relative',
                zIndex: memberNames.length - i,
              }}>{c.charAt(0)}</div>
            ))}
          </div>
          <span style={{ fontFamily: FONT_UI, fontSize: 10 }}>
            {memberNames.join(', ') || '아직 멤버 없음'}
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: FONT_UI, fontSize: 10, color: SAGE, fontWeight: 600, cursor: 'pointer' }}>
            + 초대
          </span>
        </div>
        {/* Tabs — 채팅 확정: 블로그/폴더 2개만 (미니맵 삭제) */}
        <div style={{ display: 'flex', gap: 14, marginTop: 16, borderBottom: `1px solid ${INK_FAINT}` }}>
          {(['블로그', '폴더'] as const).map((t) => {
            const active = tab === t;
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 0', fontSize: 11, fontWeight: active ? 600 : 400,
                  borderBottom: active ? `2px solid ${TERRA}` : 'none',
                  color: active ? INK : INK_SOFT, cursor: 'pointer',
                }}
              >
                {t}
              </div>
            );
          })}
        </div>

        {tab === '블로그' && (
          <>
            <SectionTitle hint={`${blogs.length}개`} style={{ marginTop: 12, marginBottom: 8 }}>블로그</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blogs.map((b, i) => {
                const published = b.publishedAt != null;
                return (
                  <div key={b.id} onClick={() => onOpenBlog(b)} style={{
                    display: 'flex', gap: 10, padding: 10, borderRadius: 10,
                    border: `1px solid ${INK_FAINT}`, alignItems: 'center', cursor: 'pointer',
                  }}>
                    <PhotoTile w={56} h={56} label={String.fromCharCode(65 + i)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 11 }}>{b.title}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                        {new Date(b.updatedAt).toLocaleDateString()} · {published ? '발행됨' : 'AI 초안'}
                      </div>
                      <div style={{
                        marginTop: 4, padding: 4, fontSize: 9,
                        background: PAPER_2, borderRadius: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {b.content.slice(0, 60)}...
                      </div>
                    </div>
                    <span style={{
                      color: published ? SAGE : TERRA,
                      fontFamily: FONT_HAND, fontSize: 13, fontWeight: 600,
                    }}>{published ? '읽기' : '편집'} →</span>
                  </div>
                );
              })}
              <div onClick={onNewBlog} style={{
                padding: 12, borderRadius: 6, border: `1.2px dashed ${INK}`,
                textAlign: 'center', fontFamily: FONT_HAND, fontSize: 13, color: INK_SOFT,
                cursor: 'pointer',
              }}>+ 새 블로그 글 작성</div>
            </div>
          </>
        )}

        {tab === '폴더' && (
          <>
            <SectionTitle hint={`${clusters.length}개`} style={{ marginTop: 12, marginBottom: 8 }}>폴더</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {clusters.map((c) => (
                <FolderCardLive
                  key={c.id}
                  cluster={c}
                  photoKeywordIndex={photoKeywordIndex}
                  onClick={() =>
                    router.push(
                      `/editor?roomId=${encodeURIComponent(roomId)}&cluster=${encodeURIComponent(c.id)}`,
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
      <MainShell activeTab="map" />
    </Screen>
  );
}
