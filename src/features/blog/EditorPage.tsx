'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Screen } from '../../components/Screen';
import { PhotoTile } from '../../components/PhotoTile';
import { Btn, SectionTitle } from '../../components/ui';
import {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_2, SAGE, TERRA,
  FONT_HAND, FONT_UI, FONT_MONO,
} from '../../theme/tokens';
import type { Blog } from '../../types/blog';
import { createBlog, getBlog, patchBlog, publishBlog } from './api';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function EditorPage() {
  const router = useRouter();
  const search = useSearchParams();
  const blogIdParam = search?.get('blogId');
  const roomIdParam = search?.get('roomId');

  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [save, setSave] = useState<SaveState>('idle');
  const [publishing, setPublishing] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [toolbarFormat, setToolbarFormat] = useState({ bold: false, italic: false, heading: false });
  const initialized = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { style: 'max-width:100%;border-radius:6px;margin:8px 0;' },
      }),
      Placeholder.configure({
        placeholder: '여기에 본문을 작성하거나 AI 초안을 편집하세요...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        style: [
          `font-family:${FONT_UI}`,
          'font-size:12px',
          `color:${INK}`,
          'line-height:1.65',
          'outline:none',
          'min-height:140px',
          'padding:0',
          '-webkit-tap-highlight-color:transparent',
        ].join(';'),
      },
    },
    onUpdate({ editor: ed }) {
      if (!initialized.current) return;
      setSave('dirty');
      debouncedSave({ content: ed.getHTML() });
    },
    onSelectionUpdate({ editor: ed }) {
      setToolbarFormat({
        bold: ed.isActive('bold'),
        italic: ed.isActive('italic'),
        heading: ed.isActive('heading'),
      });
    },
  });

  // 진입: blogId 있으면 GET, 없으면 roomId로 새 블로그 생성
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let b: Blog;
        if (blogIdParam) {
          b = await getBlog(blogIdParam);
        } else if (roomIdParam) {
          // 기존 블로그가 있으면 가져오고, 없을 때만 새로 생성
          const { listBlogs } = await import('./api');
          const existing = await listBlogs(roomIdParam);
          if (existing.length > 0) {
            b = existing[0];
          } else {
            b = await createBlog({ roomId: roomIdParam, title: '제목 없음', content: '' });
          }
        } else {
          return; // blogId도 roomId도 없으면 아무것도 안 함
        }
        if (cancelled) return;
        setBlog(b);
        setTitle(b.title);
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(b.content || '');
        }
        setTimeout(() => {
          initialized.current = true;
          setSave('saved');
        }, 0);
      } catch {
        // 빈 상태
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogIdParam, roomIdParam, editor]);

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

  // title 변경 시 debounce save
  useEffect(() => {
    if (!initialized.current || !blog) return;
    setSave('dirty');
    debouncedSave({ title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const onBack = () => router.back();

  const onPublish = async () => {
    if (!blog || publishing) return;
    setPublishing(true);
    try {
      if (blog.visibility !== 'ROOM') {
        await patchBlog(blog.id, { visibility: 'ROOM' });
      }
      await publishBlog(blog.id);
      router.push('/');
    } finally {
      setPublishing(false);
    }
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
  const onBold = useCallback(() => { editor?.chain().focus().toggleBold().run(); }, [editor]);
  const onItalic = useCallback(() => { editor?.chain().focus().toggleItalic().run(); }, [editor]);
  const onHeading = useCallback(() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); }, [editor]);
  const onBulletList = useCallback(() => { editor?.chain().focus().toggleBulletList().run(); }, [editor]);
  const onBlockquote = useCallback(() => { editor?.chain().focus().toggleBlockquote().run(); }, [editor]);
  const onPickImage = () => setPhotoPickerOpen(true);

  // 저장 표시 2초 후 자동 숨김
  useEffect(() => {
    if (save !== 'saved') return;
    const timer = setTimeout(() => setSave('idle'), 2000);
    return () => clearTimeout(timer);
  }, [save]);

  const showSaveIndicator = save === 'saved' || save === 'saving' || save === 'error';
  const saveLabel = save === 'saving' ? '저장 중...' : save === 'error' ? '저장 실패' : '저장됨';
  const saveColor = save === 'error' ? TERRA : SAGE;

  const heroLabel = blog?.photos?.[0]?.photoId?.slice(-1) ?? 'A';
  const restPhotos = (blog?.photos ?? []).slice(1);

  const pickerCandidates = useMemo(() => {
    return [] as { id: string; thumbnailUrl: string }[];
  }, []);

  return (
    <Screen scrollable>
      <style>{tiptapStyles}</style>

      {/* Editor header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 44,
        background: PAPER, borderBottom: `1px solid ${INK_FAINT}`,
        padding: '7px 14px 11px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={onBack} style={{ fontSize: 16, cursor: 'pointer', padding: '4px 8px 4px 0' }}>←</span>
        {showSaveIndicator && (
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            fontFamily: FONT_MONO, fontSize: 9, color: saveColor,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: saveColor }} />
            {saveLabel}
          </div>
        )}
        <Btn primary onClick={onPublish} style={{ padding: '6px 12px', fontSize: 11, opacity: publishing ? 0.7 : 1 }}>
          {publishing ? '발행 중...' : blog?.publishedAt ? '재발행' : '최종 발행'}
        </Btn>
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

        {/* Tiptap editor */}
        <EditorContent editor={editor} />

        {/* Photo grid (rest) */}
        {restPhotos.length > 0 && (
          <>
            <SectionTitle hint={`${restPhotos.length}장`} style={{ marginTop: 12 }}>사진</SectionTitle>
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

      </div>

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
        width: '100%', maxWidth: 390, height: 48,
        background: PAPER, borderTop: `1px solid ${INK_FAINT}`,
        display: 'flex', alignItems: 'center',
        padding: '0 8px',
        fontFamily: FONT_MONO, fontSize: 11, color: INK_SOFT,
        zIndex: 20,
      }}>
        <ToolbarBtn
          label="B"
          active={toolbarFormat.bold}
          onClick={onBold}
          style={{ fontWeight: 700 }}
        />
        <ToolbarBtn
          label="I"
          active={toolbarFormat.italic}
          onClick={onItalic}
          style={{ fontStyle: 'italic' }}
        />
        <ToolbarBtn
          label="H"
          active={toolbarFormat.heading}
          onClick={onHeading}
          style={{ fontWeight: 700 }}
        />
        <ToolbarBtn
          label="—"
          active={false}
          onClick={onBulletList}
          title="목록"
        />
        <ToolbarBtn
          label="❝"
          active={false}
          onClick={onBlockquote}
          title="인용"
        />
        <div style={{ width: 1, height: 20, background: INK_FAINT, margin: '0 2px' }} />
        <ToolbarBtn label="🖼" active={false} onClick={onPickImage} title="사진 추가" />
      </div>
    </Screen>
  );
}

/* ── 툴바 버튼 ── */
function ToolbarBtn({ label, active, onClick, title, style }: {
  label: string; active: boolean; onClick: () => void; title?: string; style?: React.CSSProperties;
}) {
  return (
    <span
      onClick={onClick}
      title={title}
      style={{
        cursor: 'pointer',
        padding: '8px 10px',
        borderRadius: 6,
        background: active ? PAPER_2 : 'transparent',
        color: active ? INK : INK_SOFT,
        fontFamily: FONT_MONO,
        fontSize: 13,
        transition: 'background 120ms',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {label}
    </span>
  );
}

/* ── 사진 선택 바텀시트 ── */
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

/* ── Tiptap 스타일 (인라인 CSS) ── */
const tiptapStyles = `
  .tiptap-editor {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  .tiptap-editor:focus {
    outline: none;
  }
  .tiptap-editor p {
    margin: 0 0 0.6em 0;
  }
  .tiptap-editor h2 {
    font-family: ${FONT_HAND};
    font-size: 18px;
    font-weight: 600;
    margin: 1em 0 0.4em 0;
    color: ${INK};
  }
  .tiptap-editor h3 {
    font-family: ${FONT_HAND};
    font-size: 15px;
    font-weight: 600;
    margin: 0.8em 0 0.3em 0;
    color: ${INK};
  }
  .tiptap-editor strong {
    font-weight: 600;
  }
  .tiptap-editor em {
    font-style: italic;
  }
  .tiptap-editor ul, .tiptap-editor ol {
    padding-left: 1.2em;
    margin: 0.4em 0;
  }
  .tiptap-editor li {
    margin: 0.15em 0;
  }
  .tiptap-editor blockquote {
    border-left: 3px solid ${SAGE};
    margin: 0.6em 0;
    padding: 4px 0 4px 12px;
    color: ${INK_SOFT};
    font-style: italic;
  }
  .tiptap-editor hr {
    border: none;
    border-top: 1px solid ${INK_FAINT};
    margin: 1em 0;
  }
  .tiptap-editor img {
    max-width: 100%;
    border-radius: 6px;
    margin: 8px 0;
  }
  .tiptap-editor .is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: ${INK_FAINT};
    pointer-events: none;
    height: 0;
    font-family: ${FONT_UI};
    font-size: 12px;
  }
  .tiptap-editor code {
    font-family: ${FONT_MONO};
    font-size: 11px;
    background: ${PAPER_2};
    padding: 1px 4px;
    border-radius: 3px;
  }
  .tiptap-editor pre {
    background: ${PAPER_2};
    border-radius: 6px;
    padding: 10px 12px;
    margin: 0.6em 0;
    overflow-x: auto;
  }
  .tiptap-editor pre code {
    background: none;
    padding: 0;
  }
`;
