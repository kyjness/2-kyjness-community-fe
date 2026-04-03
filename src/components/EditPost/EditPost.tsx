// 게시글 수정 페이지: usePostStore, CSS Modules, 이미지 revoke.
import { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memo } from 'react';
import { Header } from '../Header.jsx';
import { usePostStore } from '../../store/usePostStore';
import type { ExistingImageItem, NewImageItem } from '../../api/api-types.js';
import { safeImageUrl } from '../../utils/index.js';
import { parseHashtagsInput, POST_CATEGORY_OPTIONS } from '../../utils/postMeta.js';
const MAX_IMAGES = 5;

/** 이미지 미리보기 1건 (기존/신규) — 제거 시 onRemove(type, index) */
const ImagePreviewItem = memo(function ImagePreviewItem({
  type,
  item,
  index,
  onRemove,
}: {
  type: 'existing' | 'new';
  item: ExistingImageItem | NewImageItem;
  index: number;
  onRemove: (type: 'existing' | 'new', index: number) => void;
}) {
  const src =
    type === 'existing'
      ? safeImageUrl((item as ExistingImageItem).fileUrl, '') || ''
      : (item as NewImageItem).objectUrl;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(type, index);
  };

  return (
    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[8px] bg-[#eee]" data-type={type} data-index={index}>
      <img src={src} alt={type === 'existing' ? '이미지' : '새 이미지'} className="block h-full w-full object-cover" />
      <button
        type="button"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-0 bg-[rgba(0,0,0,0.6)] p-0 text-[18px] leading-none text-white cursor-pointer transition-[background] duration-150 hover:bg-[rgba(0,0,0,0.85)]"
        aria-label="제거"
        onClick={handleRemove}
      >
        ×
      </button>
    </div>
  );
});

export function EditPost() {
  const { id: postId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    title,
    content,
    categoryId,
    hashtagsInput,
    loading,
    formError,
    titleError,
    contentError,
    submitting,
    existingUrls,
    newImages,
    setTitle,
    setContent,
    setCategoryId,
    setHashtagsInput,
    setFormError,
    loadPost,
    addFiles,
    removeExisting,
    removeNew,
    submit,
    reset,
  } = usePostStore();

  const totalCount = existingUrls.length + newImages.length;
  const backHref = postId ? `/posts/${postId}` : '/posts';

  // postId 변경 시 로드, 언마운트 시 reset(revoke Object URLs)
  useEffect(() => {
    if (!postId) return;
    loadPost(postId);
    return () => {
      reset();
    };
  }, [postId, loadPost, reset]);

  // textarea 자동 높이
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.setProperty('overflow', 'hidden');
    el.style.setProperty('height', '1px');
    const h = Math.max(260, el.scrollHeight);
    el.style.setProperty('height', `${h}px`, 'important');
    el.style.removeProperty('overflow');
  }, [content]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles]
  );

  const handleRemovePreview = useCallback(
    async (type: 'existing' | 'new', index: number) => {
      if (type === 'existing') removeExisting(index);
      else await removeNew(index);
    },
    [removeExisting, removeNew]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!postId || submitting) return;
      setFormError('');
      await submit(postId, () => {
        alert('게시글이 수정되었습니다!');
        try {
          const st = usePostStore.getState();
          sessionStorage.setItem(
            `pt_post_edit_merge_${postId}`,
            JSON.stringify({
              postId,
              title: st.title.trim(),
              content: st.content.trim(),
              categoryId: st.categoryId,
              hashtags: parseHashtagsInput(st.hashtagsInput),
            })
          );
        } catch {
          /* ignore */
        }
        navigate(backHref);
      });
    },
    [postId, submitting, backHref, submit, setFormError, navigate]
  );

  if (!postId) {
    navigate('/posts');
    return null;
  }

  return (
    <Header showBackButton backHref={backHref}>
      <main className="flex flex-1 items-start justify-center bg-[var(--app-bg)] px-[16px] pt-[14px] pb-10">
        <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-col items-center">
          <div className="w-full max-w-[min(860px,92vw)] bg-transparent p-2">
            <h2 className="mb-5 flex items-center justify-center gap-2 text-center font-['Pretendard'] text-[22px] font-extrabold leading-[1] text-[#111827]">
              <span aria-hidden="true">🛠️</span>
              게시글 수정
            </h2>
            <form
              id="edit-post-form"
              className="flex flex-col"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-1 mb-3 last:mb-5">
                <label
                  htmlFor="edit-post-category"
                  className="mb-0 font-['Pretendard'] text-[12px] font-extrabold leading-[12px] text-[#111827]"
                >
                  카테고리
                </label>
                <select
                  id="edit-post-category"
                  name="categoryId"
                  className="w-full h-[38px] rounded-[12px] border border-[rgba(168,85,247,0.18)] bg-white px-3 font-['Pretendard',sans-serif] text-[14px] font-medium leading-[14px] text-[#111827] outline-none transition-shadow focus:border-[rgba(168,85,247,0.35)] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.12)] disabled:opacity-60"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  disabled={loading}
                  aria-label="게시판 카테고리"
                >
                  {POST_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 mb-3 last:mb-5">
                <label
                  htmlFor="edit-post-title"
                  className="mb-0 font-['Pretendard'] text-[12px] font-extrabold leading-[12px] text-[#111827]"
                >
                  제목*
                </label>
                <input
                  type="text"
                  id="edit-post-title"
                  name="title"
                  className="w-full h-[38px] rounded-[12px] border border-[rgba(168,85,247,0.18)] bg-white px-3 font-['Pretendard',sans-serif] text-[14px] font-medium leading-[14px] text-[#111827] outline-none transition-shadow focus:border-[rgba(168,85,247,0.35)] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.12)] placeholder:text-[13px] placeholder:font-medium placeholder:text-[rgba(17,24,39,0.55)]"
                  placeholder="제목을 입력하세요. (최대 26글자)"
                  maxLength={26}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  aria-invalid={!!titleError}
                  aria-describedby={titleError ? 'edit-post-title-error' : undefined}
                />
                {titleError && (
                  <span
                    className="mt-[2px] block min-h-[14px] font-['Pretendard',sans-serif] text-[12px] font-normal leading-[12px] text-[#FF0000]"
                    id="edit-post-title-error"
                    role="alert"
                  >
                    * {titleError}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 mb-3 last:mb-5">
                <label
                  htmlFor="edit-post-content"
                  className="mb-0 font-['Pretendard'] text-[12px] font-extrabold leading-[12px] text-[#111827]"
                >
                  내용*
                </label>
                <textarea
                  ref={textareaRef}
                  id="edit-post-content"
                  name="content"
                  className="w-full min-h-[260px] resize-none rounded-[16px] border border-[rgba(168,85,247,0.16)] bg-white px-3 py-3 font-['Pretendard',sans-serif] text-[14px] font-medium leading-[1.55] text-[#111827] outline-none transition-shadow focus:border-[rgba(168,85,247,0.35)] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.10)] overflow-hidden"
                  placeholder="내용을 입력하세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={loading}
                  aria-invalid={!!contentError}
                  aria-describedby={contentError ? 'edit-post-content-error' : undefined}
                />
                <div
                  className={[
                    totalCount > 0 ? 'flex' : 'hidden',
                    'flex-wrap gap-[10px] mt-3 py-2',
                  ].join(' ')}
                  aria-label="첨부 이미지 미리보기"
                >
                  {existingUrls.map((item, i) => (
                    <ImagePreviewItem
                      key={`ex-${item.imageId}-${i}`}
                      type="existing"
                      item={item}
                      index={i}
                      onRemove={handleRemovePreview}
                    />
                  ))}
                  {newImages.map((item, i) => (
                    <ImagePreviewItem
                      key={`new-${i}`}
                      type="new"
                      item={item}
                      index={i}
                      onRemove={handleRemovePreview}
                    />
                  ))}
                </div>
                {contentError && (
                  <span
                    className="mt-[2px] block min-h-[14px] font-['Pretendard',sans-serif] text-[12px] font-normal leading-[12px] text-[#FF0000]"
                    id="edit-post-content-error"
                    role="alert"
                  >
                    * {contentError}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 mb-3 last:mb-5">
                <span className="mb-0 font-['Pretendard'] text-[12px] font-extrabold leading-[12px] text-[#111827]">
                  이미지 (최대 {MAX_IMAGES}장)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="edit-file-input"
                    accept="image/jpeg,image/png"
                    multiple
                    className="hidden"
                    aria-hidden
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="inline-flex h-[34px] w-[88px] items-center justify-center rounded-[12px] border border-[rgba(168,85,247,0.18)] bg-white font-['Pretendard',sans-serif] text-[12px] font-extrabold text-[rgba(91,33,182,1)] cursor-pointer transition-shadow hover:shadow-[0_0_0_4px_rgba(168,85,247,0.10)] disabled:opacity-50"
                    id="edit-file-trigger"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || totalCount >= MAX_IMAGES}
                  >
                    파일 선택
                  </button>
                  <span className="font-['Pretendard',sans-serif] text-[12px] text-black">
                    {totalCount > 0 ? `총 ${totalCount}장` : '파일을 선택해주세요.'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 mb-3 last:mb-5">
                <label
                  htmlFor="edit-post-hashtags"
                  className="mb-0 font-['Pretendard'] text-[12px] font-extrabold leading-[12px] text-[#111827]"
                >
                  해시태그
                </label>
                <input
                  id="edit-post-hashtags"
                  name="hashtags"
                  type="text"
                  className="w-full h-[38px] rounded-[12px] border border-[rgba(168,85,247,0.18)] bg-white px-3 font-['Pretendard',sans-serif] text-[14px] font-medium leading-[14px] text-[#111827] outline-none transition-shadow focus:border-[rgba(168,85,247,0.35)] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.12)] placeholder:text-[13px] placeholder:font-medium placeholder:text-[rgba(17,24,39,0.55)]"
                  placeholder="예: 강아지, 산책 (최대 6개)"
                  value={hashtagsInput}
                  onChange={(e) => setHashtagsInput(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              {formError && (
                <span
                  className="mt-[2px] block min-h-[14px] font-['Pretendard',sans-serif] text-[12px] font-normal leading-[12px] text-[#FF0000]"
                  id="form-error"
                  role="alert"
                >
                  * {formError}
                </span>
              )}
              <button
                type="submit"
                className="inline-flex h-[33px] w-full max-w-[360px] self-center items-center justify-center rounded-[4px] border-0 bg-[var(--primary)] px-5 text-[13px] font-bold leading-[13px] text-white no-underline transition-all duration-200 hover:bg-[var(--primary-hover)] active:bg-[var(--primary-hover)] disabled:opacity-50 cursor-pointer"
                id="edit-submit-btn"
                disabled={loading || submitting}
              >
                수정하기
              </button>
            </form>
          </div>
        </div>
      </main>
    </Header>
  );
}
