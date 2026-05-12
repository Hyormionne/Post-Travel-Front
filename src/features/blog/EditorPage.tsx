'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Btn, Pill, SectionTitle } from '../../components/ui';
import {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import type { Blog, BlogVisibility } from '../../types/blog';
import { createBlog, getBlog, patchBlog, publishBlog, deleteBlog } from './api';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';
import { MOCK_PHOTOS } from '../../mocks/data';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const VISIBILITIES: { v: BlogVisibility; label: string }[] = [
  { v: 'PRIVATE', label: '비공개' },
  { v: 'ROOM', label: '여행 멤버' },
  { v: 'PUBLIC', label: '공개' },
];

// 본문 마크다운 wrap 헬퍼 — textarea의 선택 영역을 prefix/suffix로 감싼다.
function wrapSelection(
  ta: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  emptyHint: string,
): { value: string; cursorStart: number; cursorEnd: number } {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const sel = value.slice(s, e);
  const inner = sel.length > 0 ? sel : emptyHint;
  const next = value.slice(0, s) + prefix + inner + suffix + value.slice(e);
  const startCursor = s + prefix.length;
  const endCursor = startCursor + inner.length;
  return { value: next, cursorStart: startCursor, cursorEnd: endCursor };
}

function prefixCurrentLine(ta: HTMLTextAreaElement, prefix: string) {
  const { selectionStart: s, value } = ta;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  // 이미 같은 prefix면 토글로 제거
  if (value.slice(lineStart, lineStart + prefix.length) === prefix) {
    const next = value.slice(0, lineStart) + value.slice(lineStart + prefix.length);
    return { value: next, cursorStart: Math.max(lineStart, s - prefix.length), cursorEnd: Math.max(lineStart, s - prefix.length) };
  }
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  return { value: next, cursorStart: s + prefix.length, cursorEnd: s + prefix.length };
}

export function EditorPage() {
  const router = useRouter();
  const search = useSearchParams();
  const blogIdParam = search?.get('blogId');
  const roomIdParam = search?.get('roomId');

  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [save, setSave] = useState<SaveState>('idle');
  const [publishing, setPublishing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [visibility, setVisibility] = useState<BlogVisibility>('ROOM');
  const [aiSuggestionDismissed, setAiSuggestionDismissed] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  // 진입: blogId 있으면 GET, 없으면 roomId로 새 블로그 생성
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let b: Blog;
        if (blogIdParam) {
          b = await getBlog(blogIdParam);
        } else if (roomIdParam) {
          b = await createBlog({ roomId: roomIdParam, title: '제목 없음', content: '' });
        } else {
          b = await getBlog('blog-1');
        }
        if (cancelled) return;
        setBlog(b);
        setTitle(b.title);
        setContent(b.content);
        setVisibility(b.visibility);
        // load 직후 dirty 효과를 피하기 위해 한 tick 뒤에 initialized true
        setTimeout(() => {
          initialized.current = true;
          setSave('saved');
        }, 0);
      } catch {
        // 빈 상태 — UI 로딩 메시지로 처리
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [blogIdParam, roomIdParam]);

  const debouncedSave = useDebouncedCallback(async (next: { title?: string; content?: string }) => {
    if (!blog) return;
    setSave('saving');
    try {
      const updated = await patchBlog(blog.id, next);
      setBlog(updated);
      setSave('saved');
    } catch {
      setSave('error');
    }
  }, 1200);

  useEffect(() => {
    if (!initialized.current || !blog) return;
    setSave('dirty');
    debouncedSave({ title, content });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const onBack = () => router.back();

  const onPublishConfirm = async () => {
    if (!blog) return;
    setPublishing(true);
    try {
      if (visibility !== blog.visibility) {
        await patchBlog(blog.id, { visibility });
      }
      const published = await publishBlog(blog.id);
      setBlog(published);
      setConfirming(false);
      router.push('/');
    } finally {
      setPublishing(false);
    }
  };

  const onAcceptAiSuggestion = async () => {
    if (!blog) return;
    setAiSuggestionDismissed(true);
    // photoIds를 보내면 기존 연결 전부 교체 — 기존 + 새 합쳐서 전송.
    const existing = blog.photos.map((p) => p.photoId);
    const additions = MOCK_PHOTOS.filter((p) => p.sceneLabel === 'snow').slice(0, 3).map((p) => p.id);
    const merged = Array.from(new Set([...existing, ...additions]));
    const updated = await patchBlog(blog.id, { photoIds: merged });
    setBlog(updated);
    // 본문에도 AI text 한 단락 추가
    setContent((c) =>
      c + (c.endsWith('\n') || c === '' ? '' : '\n\n') +
      '비에이의 풍경 — 자작나무 길은 바람도 잠시 멈추는 듯했다. 눈 쌓인 들판을 따라 한참을 걸었다.'
    );
  };

  // 사진 제거
  const onRemovePhoto = async (photoId: string) => {
    if (!blog) return;
    const next = blog.photos.filter((p) => p.photoId !== photoId).map((p) => p.photoId);
    const updated = await patchBlog(blog.id, { photoIds: next });
    setBlog(updated);
  };

  // 사진 추가 (picker에서 선택)
  const onAddPhotos = async (ids: string[]) => {
    if (!blog) return;
    const existing = blog.photos.map((p) => p.photoId);
    const merged = Array.from(new Set([...existing, ...ids]));
    const updated = await patchBlog(blog.id, { photoIds: merged });
    setBlog(updated);
    setPhotoPickerOpen(false);
  };

  // 툴바 핸들러
  const applyEdit = (edit: { value: string; cursorStart: number; cursorEnd: number }) => {
    setContent(edit.value);
    // 다음 tick에 cursor 복원
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(edit.cursorStart, edit.cursorEnd);
    });
  };
  const onBold = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    applyEdit(wrapSelection(ta, '**', '**', '강조'));
  };
  const onItalic = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    applyEdit(wrapSelection(ta, '*', '*', '기울임'));
  };
  const onHeading = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    applyEdit(prefixCurrentLine(ta, '## '));
  };
  const onPickImage = () => setPhotoPickerOpen(true);

  const onDeleteBlog = async () => {
    if (!blog) return;
    if (typeof window !== 'undefined' && !window.confirm('이 블로그를 삭제할까요?')) return;
    setDeleting(true);
    try {
      await deleteBlog(blog.id);
      router.push('/');
    } finally {
      setDeleting(false);
    }
  };

  const saveLabel =
    save === 'saving' ? '저장 중...'
    : save === 'dirty' ? '변경됨'
    : save === 'error' ? '저장 실패'
    : '저장됨';
  const saveColor = save === 'error' ? TERRA : SAGE;

  // hero photo: blog.photos[0]가 있으면 그 라벨로, 없으면 'A'
  const heroLabel = blog?.photos?.[0]?.photoId?.slice(-1) ?? 'A';
  const restPhotos = (blog?.photos ?? []).slice(1);

  // picker에 보여줄 후보: 블로그에 아직 안 들어간 mock 사진들
  const pickerCandidates = useMemo(() => {
    const used = new Set(blog?.photos.map((p) => p.photoId) ?? []);
    return MOCK_PHOTOS.filter((p) => !used.has(p.id)).slice(0, 12);
  }, [blog?.photos]);

  return (
    <Screen scrollable>
      {/* Editor header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 72,
        background: PAPER, borderBottom: `1px solid ${INK_FAINT}`,
        padding: '12px 14px 8px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={onBack} style={{ fontSize: 16, cursor: 'pointer' }}>←</span>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: saveColor,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: saveColor }} />
          {saveLabel}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            onClick={onDeleteBlog}
            style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, cursor: 'pointer' }}
          >
            {deleting ? '...' : '삭제'}
          </span>
          <Btn primary onClick={() => setConfirming(true)} style={{ padding: '6px 12px', fontSize: 11 }}>
            {blog?.publishedAt ? '재발행' : '최종 발행'}
          </Btn>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '12px 16px 100px' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: FONT_HAND, fontSize: 24, fontWeight: 600,
            lineHeight: 1.15, marginBottom: 4, color: INK,
            border: 'none', outline: 'none', background: 'transparent',
            padding: 0,
          }}
        />
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 12,
        }}>
          {blog
            ? `${new Date(blog.createdAt).toLocaleDateString()} · 사진 ${blog.photos.length} · ${blog.publishedAt ? '발행됨' : 'AI 초안 ✦'}`
            : '로딩 중…'}
        </div>
        {/* Hero photo */}
        {blog && blog.photos.length > 0 ? (
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <PhotoTile w="100%" h={140} label={heroLabel} />
            <span
              onClick={() => onRemovePhoto(blog.photos[0].photoId)}
              style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.55)', color: 'white',
                borderRadius: '50%', width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, cursor: 'pointer',
              }}
              aria-label="대표 사진 제거"
            >×</span>
          </div>
        ) : (
          <div
            onClick={onPickImage}
            style={{
              width: '100%', height: 140, borderRadius: 4,
              border: `1.2px dashed ${INK_FAINT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_UI, fontSize: 11, color: INK_SOFT,
              cursor: 'pointer', marginBottom: 6, background: PAPER_2,
            }}
          >
            🖼  대표 사진 추가
          </div>
        )}
        <div style={{ fontFamily: FONT_UI, fontSize: 9, color: INK_SOFT, marginBottom: 14 }}>
          비에이 ▸ 흰 자작나무 길
        </div>
        {/* Editable content */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="여기에 본문을 작성하거나 AI 초안을 편집하세요."
          rows={8}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: 8, border: `1.2px dashed ${INK_FAINT}`, borderRadius: 6,
            marginBottom: 10, minHeight: 110, resize: 'vertical',
            fontFamily: FONT_UI, fontSize: 11, color: INK, lineHeight: 1.55,
            outline: 'none', background: 'transparent',
          }}
        />
        {/* Photo grid (rest) */}
        {restPhotos.length > 0 && (
          <>
            <SectionTitle hint={`${restPhotos.length}장`} style={{ marginTop: 4 }}>사진</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
              {restPhotos.map((p) => (
                <div key={p.photoId} style={{ position: 'relative' }}>
                  <PhotoTile w="100%" h={70} label={p.photoId.slice(-1)} />
                  <span
                    onClick={() => onRemovePhoto(p.photoId)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(0,0,0,0.55)', color: 'white',
                      borderRadius: '50%', width: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, cursor: 'pointer',
                    }}
                    aria-label="사진 제거"
                  >×</span>
                </div>
              ))}
              <div
                onClick={onPickImage}
                style={{
                  height: 70, borderRadius: 4,
                  border: `1.2px dashed ${INK_FAINT}`, background: PAPER_2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_UI, fontSize: 14, color: INK_SOFT, cursor: 'pointer',
                }}
              >
                +
              </div>
            </div>
          </>
        )}
        {/* AI suggestion */}
        {!aiSuggestionDismissed && blog && (
          <div style={{
            marginTop: 8,
            padding: 10, borderRadius: 10, background: PAPER_2,
            border: `1px dashed ${SAGE}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <span style={{ fontFamily: FONT_HAND, fontSize: 13, flex: 1 }}>
              여기에 '비에이의 풍경' 폴더 사진 더 넣을까요?
            </span>
            <span onClick={onAcceptAiSuggestion} style={{ cursor: 'pointer' }}>
              <Pill color={SAGE} solid>예</Pill>
            </span>
            <span
              onClick={() => setAiSuggestionDismissed(true)}
              style={{ cursor: 'pointer', color: INK_SOFT, fontSize: 11, marginLeft: 2 }}
              aria-label="제안 닫기"
            >×</span>
          </div>
        )}
      </div>
      {/* Publish confirm */}
      {confirming && (
        <div
          onClick={() => !publishing && setConfirming(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, animation: 'yh-fade-in 200ms ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 280, background: PAPER, border: `1.2px solid ${INK}`,
              borderRadius: 12, padding: 14,
              boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
              animation: 'yh-toast-in 240ms ease-out',
            }}
          >
            <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              블로그 발행
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 10 }}>
              공개 범위를 선택하세요. 발행 후에도 변경 가능합니다.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {VISIBILITIES.map((v) => {
                const active = visibility === v.v;
                return (
                  <div
                    key={v.v}
                    onClick={() => setVisibility(v.v)}
                    style={{
                      padding: '8px 10px', borderRadius: 8,
                      border: `${active ? 1.4 : 1}px solid ${active ? INK : INK_FAINT}`,
                      background: active ? PAPER_2 : 'transparent',
                      cursor: 'pointer',
                      fontFamily: FONT_UI, fontSize: 11, fontWeight: active ? 600 : 400,
                    }}
                  >
                    {v.label}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn onClick={() => setConfirming(false)} style={{ flex: 1 }}>
                취소
              </Btn>
              <Btn primary onClick={onPublishConfirm} style={{ flex: 1, opacity: publishing ? 0.7 : 1 }}>
                {publishing ? '발행 중...' : '발행'}
              </Btn>
            </div>
          </div>
        </div>
      )}
      {/* Photo picker */}
      {photoPickerOpen && (
        <PhotoPicker
          candidates={pickerCandidates}
          onPick={onAddPhotos}
          onClose={() => setPhotoPickerOpen(false)}
        />
      )}
      {/* Bottom toolbar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390, height: 44,
        background: PAPER, borderTop: `1px solid ${INK_FAINT}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        fontFamily: FONT_MONO, fontSize: 11, color: INK_SOFT,
        zIndex: 20,
      }}>
        <span onClick={onBold} title="굵게 (**텍스트**)" style={{ cursor: 'pointer', padding: '8px 12px', fontWeight: 700 }}>B</span>
        <span onClick={onItalic} title="기울임 (*텍스트*)" style={{ cursor: 'pointer', padding: '8px 12px', fontStyle: 'italic' }}>I</span>
        <span onClick={onHeading} title="제목 (## 줄)" style={{ cursor: 'pointer', padding: '8px 12px', fontWeight: 700 }}>H</span>
        <span onClick={onPickImage} title="사진 추가" style={{ cursor: 'pointer', padding: '8px 12px' }}>🖼</span>
        <span
          onClick={() => !aiSuggestionDismissed ? onAcceptAiSuggestion() : setAiSuggestionDismissed(false)}
          title="AI 보강"
          style={{ cursor: 'pointer', padding: '8px 12px' }}
        >✦</span>
      </div>
    </Screen>
  );
}

interface PhotoPickerProps {
  candidates: Array<{ id: string }>;
  onPick: (ids: string[]) => void;
  onClose: () => void;
}

function PhotoPicker({ candidates, onPick, onClose }: PhotoPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 50, animation: 'yh-fade-in 200ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 390, background: PAPER,
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          borderTop: `1.4px solid ${INK}`, padding: 14,
          boxShadow: '0 -12px 28px rgba(0,0,0,0.18)',
          animation: 'yh-toast-in 280ms ease-out',
          maxHeight: '70%', overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 600 }}>사진 추가</span>
          <span
            onClick={onClose}
            style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, cursor: 'pointer' }}
          >
            취소
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12 }}>
          {candidates.map((p) => (
            <div key={p.id} onClick={() => toggle(p.id)} style={{ cursor: 'pointer' }}>
              <PhotoTile w="100%" h={70} label={p.id.slice(-1)} picked={selected.includes(p.id)} />
            </div>
          ))}
        </div>
        <Btn
          primary
          full
          onClick={() => selected.length > 0 && onPick(selected)}
          style={{ opacity: selected.length > 0 ? 1 : 0.55 }}
        >
          {selected.length > 0 ? `${selected.length}장 추가` : '사진을 골라주세요'}
        </Btn>
      </div>
    </div>
  );
}
