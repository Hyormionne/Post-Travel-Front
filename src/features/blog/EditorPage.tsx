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
import type { ClusterPhoto } from '../../types/cluster';
import { createBlog, getBlog, patchBlog, publishBlog, generateBlogDraft } from './api';
import { fetchClusters, fetchClusterPhotos } from '../clusters/api';
import { getRoom, formatTripTitle } from '../trips/api';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';
import { useUploadFlow } from '../../store/uploadFlow';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function EditorPage() {
  const router = useRouter();
  const search = useSearchParams();
  const blogIdParam = search?.get('blogId');
  const roomIdParam = search?.get('roomId');
  const [flow] = useUploadFlow();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [save, setSave] = useState<SaveState>('idle');
  const [publishing, setPublishing] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [toolbarFormat, setToolbarFormat] = useState({ bold: false, italic: false, heading: false });
  const [clusterPhotos, setClusterPhotos] = useState<ClusterPhoto[]>([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftJobId, setDraftJobId] = useState<string | null>(null);
  const initialized = useRef(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({
        inline: false,
        HTMLAttributes: { style: 'max-width:100%;border-radius:6px;margin:8px 0;' },
      }),
      Placeholder.configure({ placeholder: '여기에 본문을 작성하거나 AI 초안을 편집하세요...' }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        style: [
          `font-family:${FONT_UI}`, 'font-size:12px', `color:${INK}`,
          'line-height:1.65', 'outline:none', 'min-height:140px', 'padding:0',
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

  // 진입: blogId 있으면 GET, 없으면 roomId로 새 블로그 생성 (여행 이름 사용)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let b: Blog;
        if (blogIdParam) {
          b = await getBlog(blogIdParam);
        } else if (roomIdParam) {
          // 여행 이름: "도시, N월" 형식 우선, 없으면 room API 조회
          let blogTitle = formatTripTitle(flow.cityName, flow.travelDates, flow.tripName);
          if (!blogTitle || blogTitle === '새 여행') {
            try {
              const room = await getRoom(roomIdParam);
              blogTitle = room.title || blogTitle;
            } catch { /* 무시 */ }
          }
          b = await createBlog({ roomId: roomIdParam, title: blogTitle || '새 여행 블로그', content: '' });
        } else {
          b = await getBlog('blog-1');
        }
        if (cancelled) return;

        // sessionStorage 임시저장 복원
        try {
          const saved = sessionStorage.getItem(`yh_draft_${b.id}`);
          if (saved) {
            const parsed = JSON.parse(saved) as { title?: string; content?: string };
            if (parsed.title) b = { ...b, title: parsed.title };
            if (parsed.content) b = { ...b, content: parsed.content };
          }
        } catch { /* ignore */ }

        setBlog(b);
        setTitle(b.title);
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(b.content || '');
        }
        setTimeout(() => { initialized.current = true; setSave('saved'); }, 0);
      } catch { /* 빈 상태 */ }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogIdParam, roomIdParam, editor]);

  // 클러스터 사진 불러오기 — 폴더에 속한 사진만 피커에 표시
  useEffect(() => {
    const rid = roomIdParam || blog?.roomId;
    if (!rid) return;
    let cancelled = false;
    (async () => {
      try {
        const clusters = await fetchClusters(rid);
        const photoArrays = await Promise.all(
          clusters.map((c) => fetchClusterPhotos(c.id, rid).catch(() => [] as ClusterPhoto[])),
        );
        if (cancelled) return;
        const seen = new Set<string>();
        const all: ClusterPhoto[] = [];
        for (const arr of photoArrays) {
          for (const p of arr) {
            if (!seen.has(p.id)) { seen.add(p.id); all.push(p); }
          }
        }
        setClusterPhotos(all);
      } catch { /* 조용히 실패 */ }
    })();
    return () => { cancelled = true; };
  }, [roomIdParam, blog?.roomId]);

  // 블로그 로드 후 내용 비어 있고 생성 중인 job이 있으면 폴링 시작
  useEffect(() => {
    if (!blog || blog.content) return;
    const jobId = flow.jobId;
    if (!jobId) return;
    setDraftJobId(jobId);
    setGeneratingDraft(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog?.id]);

  // AI 초안 폴링: blog content가 채워질 때까지 5초 간격 GET
  useEffect(() => {
    if (!draftJobId || !blog) return;
    const poll = async () => {
      try {
        const updated = await getBlog(blog.id);
        if (updated.content && updated.content !== blog.content) {
          setBlog(updated);
          if (editor && !editor.isDestroyed) editor.commands.setContent(updated.content);
          setGeneratingDraft(false);
          setDraftJobId(null);
          return;
        }
      } catch { /* 계속 폴링 */ }
      pollRef.current = setTimeout(poll, 5000);
    };
    pollRef.current = setTimeout(poll, 3000);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftJobId]);

  const debouncedSave = useDebouncedCallback(async (next: { title?: string; content?: string }) => {
    if (!blog) return;
    setSave('saving');
    try {
      const updated = await patchBlog(blog.id, next);
      setBlog(updated);
      setSave('saved');
    } catch { setSave('error'); }
  }, 1200);

  useEffect(() => {
    if (!initialized.current || !blog) return;
    setSave('dirty');
    debouncedSave({ title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const onPublish = async () => {
    if (!blog || publishing) return;
    setPublishing(true);
    try {
      if (blog.visibility !== 'ROOM') await patchBlog(blog.id, { visibility: 'ROOM' });
      await publishBlog(blog.id);
      router.push('/');
    } finally { setPublishing(false); }
  };

  const onSaveNow = () => {
    if (blog) {
      try {
        sessionStorage.setItem(`yh_draft_${blog.id}`, JSON.stringify({
          title, content: editor?.getHTML() ?? blog.content,
        }));
      } catch { /* ignore */ }
    }
    router.push('/');
  };

  const onCancel = () => router.push('/');

  const onRemovePhoto = async (photoId: string) => {
    if (!blog) return;
    const next = blog.photos.filter((p) => p.photoId !== photoId).map((p) => p.photoId);
    const updated = await patchBlog(blog.id, { photoIds: next });
    setBlog(updated);
  };

  const onAddPhotos = async (ids: string[]) => {
    if (!blog) return;
    const existing = blog.photos.map((p) => p.photoId);
    const merged = Array.from(new Set([...existing, ...ids]));
    const updated = await patchBlog(blog.id, { photoIds: merged });
    setBlog(updated);
    setPhotoPickerOpen(false);
  };

  // AI 초안 생성 버튼
  const onGenerateDraft = async () => {
    if (!blog || generatingDraft) return;
    const rid = roomIdParam || blog.roomId;
    if (!rid) return;
    setGeneratingDraft(true);
    try {
      const { jobId } = await generateBlogDraft(rid, {
        photoIds: clusterPhotos.map((p) => p.id),
      });
      setDraftJobId(jobId);
    } catch { setGeneratingDraft(false); }
  };

  const onBold = useCallback(() => { editor?.chain().focus().toggleBold().run(); }, [editor]);
  const onItalic = useCallback(() => { editor?.chain().focus().toggleItalic().run(); }, [editor]);
  const onHeading = useCallback(() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); }, [editor]);
  const onBulletList = useCallback(() => { editor?.chain().focus().toggleBulletList().run(); }, [editor]);
  const onBlockquote = useCallback(() => { editor?.chain().focus().toggleBlockquote().run(); }, [editor]);
  const onPickImage = () => setPhotoPickerOpen(true);

  useEffect(() => {
    if (save !== 'saved') return;
    const t = setTimeout(() => setSave('idle'), 2000);
    return () => clearTimeout(t);
  }, [save]);

  const showSaveIndicator = save === 'saved' || save === 'saving' || save === 'error';
  const saveLabel = save === 'saving' ? '저장 중...' : save === 'error' ? '저장 실패' : '저장됨';
  const saveColor = save === 'error' ? TERRA : SAGE;

  const heroPhoto = blog?.photos?.[0];
  const heroSrc = heroPhoto
    ? (() => {
        const cp = clusterPhotos.find((p) => p.id === heroPhoto.photoId);
        return cp?.thumbnailUrl || cp?.url || heroPhoto.thumbnailUrl || undefined;
      })()
    : undefined;
  const restPhotos = (blog?.photos ?? []).slice(1);

  const pickerCandidates = useMemo(() => {
    const used = new Set(blog?.photos.map((p) => p.photoId) ?? []);
    return clusterPhotos.filter((p) => !used.has(p.id));
  }, [blog?.photos, clusterPhotos]);

  return (
    <Screen scrollable>
      <style>{tiptapStyles}</style>

      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 44, background: PAPER, borderBottom: `1px solid ${INK_FAINT}`,
        padding: '7px 14px 11px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={onCancel} style={{ fontSize: 16, cursor: 'pointer', padding: '4px 8px 4px 0' }}>←</span>
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
          {publishing ? '발행 중...' : '작성 완료'}
        </Btn>
      </div>

      {/* 본문 */}
      <div style={{ padding: '12px 16px 140px' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: FONT_HAND, fontSize: 24, fontWeight: 600,
            lineHeight: 1.15, marginBottom: 4, color: INK,
            border: 'none', outline: 'none', background: 'transparent', padding: 0,
          }}
        />
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, marginBottom: 12 }}>
          {blog
            ? `${new Date(blog.createdAt).toLocaleDateString()} · 사진 ${blog.photos.length} · ${blog.publishedAt ? '발행됨' : 'AI 초안 ✦'}`
            : '로딩 중…'}
        </div>

        {/* 대표 사진 */}
        {blog && blog.photos.length > 0 ? (
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <PhotoTile w="100%" h={140} label={heroPhoto?.photoId?.slice(-1) ?? 'A'} src={heroSrc} />
            <span
              onClick={() => onRemovePhoto(blog.photos[0].photoId)}
              style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.55)', color: 'white',
                borderRadius: '50%', width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, cursor: 'pointer',
              }}
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
          {flow.cityName || '여행지'}
        </div>

        {/* AI 초안 생성 중 안내 */}
        {generatingDraft && (
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(195,120,80,0.06)', border: `1px dashed ${TERRA}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <div>
              <div style={{ fontFamily: FONT_HAND, fontSize: 13, color: TERRA }}>AI가 초안을 작성하고 있어요</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: INK_SOFT, marginTop: 2 }}>
                완료되면 자동으로 본문에 채워집니다
              </div>
            </div>
          </div>
        )}

        {/* Tiptap 에디터 */}
        <EditorContent editor={editor} />

        {/* 나머지 사진 그리드 */}
        {restPhotos.length > 0 && (
          <>
            <SectionTitle hint={`${restPhotos.length}장`} style={{ marginTop: 12 }}>사진</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
              {restPhotos.map((p) => {
                const cp = clusterPhotos.find((c) => c.id === p.photoId);
                const src = cp?.thumbnailUrl || cp?.url || p.thumbnailUrl || undefined;
                return (
                  <div key={p.photoId} style={{ position: 'relative' }}>
                    <PhotoTile w="100%" h={70} label={p.photoId.slice(-1)} src={src} />
                    <span
                      onClick={() => onRemovePhoto(p.photoId)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.55)', color: 'white',
                        borderRadius: '50%', width: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, cursor: 'pointer',
                      }}
                    >×</span>
                  </div>
                );
              })}
              <div
                onClick={onPickImage}
                style={{
                  height: 70, borderRadius: 4,
                  border: `1.2px dashed ${INK_FAINT}`, background: PAPER_2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_UI, fontSize: 14, color: INK_SOFT, cursor: 'pointer',
                }}
              >+</div>
            </div>
          </>
        )}
      </div>

      {/* 사진 피커 */}
      {photoPickerOpen && (
        <PhotoPicker
          candidates={pickerCandidates}
          onPick={onAddPhotos}
          onClose={() => setPhotoPickerOpen(false)}
        />
      )}

      {/* 하단 바 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        background: PAPER, borderTop: `1px solid ${INK_FAINT}`, zIndex: 20,
      }}>
        {/* 임시저장 / 작성취소 */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px 0' }}>
          <button
            onClick={onSaveNow}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${SAGE}`, background: 'transparent',
              fontFamily: FONT_MONO, fontSize: 10, color: SAGE,
            }}
          >임시저장</button>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${INK_FAINT}`, background: 'transparent',
              fontFamily: FONT_MONO, fontSize: 10, color: INK_SOFT,
            }}
          >작성 취소</button>
        </div>

        {/* 서식 툴바 */}
        <div style={{
          height: 44, display: 'flex', alignItems: 'center',
          padding: '0 8px', fontFamily: FONT_MONO, fontSize: 11, color: INK_SOFT,
        }}>
          <ToolbarBtn label="B" active={toolbarFormat.bold} onClick={onBold} style={{ fontWeight: 700 }} />
          <ToolbarBtn label="I" active={toolbarFormat.italic} onClick={onItalic} style={{ fontStyle: 'italic' }} />
          <ToolbarBtn label="H" active={toolbarFormat.heading} onClick={onHeading} style={{ fontWeight: 700 }} />
          <ToolbarBtn label="—" active={false} onClick={onBulletList} title="목록" />
          <ToolbarBtn label="❝" active={false} onClick={onBlockquote} title="인용" />
          <div style={{ width: 1, height: 20, background: INK_FAINT, margin: '0 2px' }} />
          <ToolbarBtn label="🖼" active={false} onClick={onPickImage} title="사진 추가" />
          <div style={{ width: 1, height: 20, background: INK_FAINT, margin: '0 2px' }} />
          <ToolbarBtn
            label={generatingDraft ? '✦…' : '✦'}
            active={generatingDraft}
            onClick={onGenerateDraft}
            title="AI 초안 생성"
            style={{ color: TERRA, opacity: generatingDraft ? 0.6 : 1 }}
          />
        </div>
      </div>
    </Screen>
  );
}

function ToolbarBtn({ label, active, onClick, title, style }: {
  label: string; active: boolean; onClick: () => void; title?: string; style?: React.CSSProperties;
}) {
  return (
    <span
      onClick={onClick} title={title}
      style={{
        cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
        background: active ? PAPER_2 : 'transparent',
        color: active ? INK : INK_SOFT,
        fontFamily: FONT_MONO, fontSize: 13, transition: 'background 120ms',
        WebkitTapHighlightColor: 'transparent', ...style,
      }}
    >{label}</span>
  );
}

interface PhotoPickerProps {
  candidates: Array<{ id: string; thumbnailUrl?: string | null; url?: string }>;
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
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>
            {candidates.length > 0 ? `${candidates.length}장` : '사진 없음'}
          </span>
          <span onClick={onClose} style={{ fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT, cursor: 'pointer' }}>취소</span>
        </div>
        {candidates.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontFamily: FONT_MONO, fontSize: 9, color: INK_SOFT }}>
            업로드된 사진이 없어요
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12 }}>
            {candidates.map((p) => (
              <div key={p.id} onClick={() => toggle(p.id)} style={{ cursor: 'pointer' }}>
                <PhotoTile
                  w="100%" h={70}
                  label={p.id.slice(-1)}
                  src={p.thumbnailUrl || p.url || undefined}
                  picked={selected.includes(p.id)}
                />
              </div>
            ))}
          </div>
        )}
        <Btn
          primary full
          onClick={() => selected.length > 0 && onPick(selected)}
          style={{ opacity: selected.length > 0 ? 1 : 0.55 }}
        >
          {selected.length > 0 ? `${selected.length}장 추가` : '사진을 골라주세요'}
        </Btn>
      </div>
    </div>
  );
}

const tiptapStyles = `
  .tiptap-editor { word-break: keep-all; overflow-wrap: break-word; }
  .tiptap-editor:focus { outline: none; }
  .tiptap-editor p { margin: 0 0 0.6em 0; }
  .tiptap-editor h2 { font-family: ${FONT_HAND}; font-size: 18px; font-weight: 600; margin: 1em 0 0.4em 0; color: ${INK}; }
  .tiptap-editor h3 { font-family: ${FONT_HAND}; font-size: 15px; font-weight: 600; margin: 0.8em 0 0.3em 0; color: ${INK}; }
  .tiptap-editor strong { font-weight: 600; }
  .tiptap-editor em { font-style: italic; }
  .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.2em; margin: 0.4em 0; }
  .tiptap-editor li { margin: 0.15em 0; }
  .tiptap-editor blockquote { border-left: 3px solid ${SAGE}; margin: 0.6em 0; padding: 4px 0 4px 12px; color: ${INK_SOFT}; font-style: italic; }
  .tiptap-editor hr { border: none; border-top: 1px solid ${INK_FAINT}; margin: 1em 0; }
  .tiptap-editor img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
  .tiptap-editor .is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: ${INK_FAINT}; pointer-events: none; height: 0; font-family: ${FONT_UI}; font-size: 12px; }
  .tiptap-editor code { font-family: ${FONT_MONO}; font-size: 11px; background: ${PAPER_2}; padding: 1px 4px; border-radius: 3px; }
  .tiptap-editor pre { background: ${PAPER_2}; border-radius: 6px; padding: 10px 12px; margin: 0.6em 0; overflow-x: auto; }
  .tiptap-editor pre code { background: none; padding: 0; }
`;
