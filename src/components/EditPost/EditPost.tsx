// 게시글 수정 페이지: usePostStore, CSS Modules, 이미지 revoke.
import { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memo } from 'react';
import { Header } from '../Header.jsx';
import { usePostStore } from '../../store/usePostStore';
import type { ExistingImageItem, NewImageItem } from '../../api/api-types.js';
import { safeImageUrl } from '../../utils/index.js';
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
    <div className="post-image-preview-item" data-type={type} data-index={index}>
      <img src={src} alt={type === 'existing' ? '이미지' : '새 이미지'} />
      <button type="button" className="post-image-remove" aria-label="제거" onClick={handleRemove}>
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
    loading,
    formError,
    titleError,
    contentError,
    submitting,
    existingUrls,
    newImages,
    setTitle,
    setContent,
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
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('post_detail_skip_view', String(postId));
        }
        alert('게시글이 수정되었습니다!');
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
      <main className="main">
        <div className="post-list-container post-new-container">
          <div className="form-container">
            <h2 className="form-title">게시글 수정</h2>
            <form
              id="edit-post-form"
              className="form edit-post-form"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="edit-post-title" className="form-label">
                  제목*
                </label>
                <input
                  type="text"
                  id="edit-post-title"
                  name="title"
                  className="form-input"
                  placeholder="제목을 입력하세요. (최대 26글자)"
                  maxLength={26}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  aria-invalid={!!titleError}
                  aria-describedby={titleError ? 'edit-post-title-error' : undefined}
                />
                {titleError && (
                  <span className="helper-text" id="edit-post-title-error" role="alert">
                    * {titleError}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="edit-post-content" className="form-label">
                  내용*
                </label>
                <textarea
                  ref={textareaRef}
                  id="edit-post-content"
                  name="content"
                  className="form-input form-textarea"
                  placeholder="내용을 입력하세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={loading}
                  aria-invalid={!!contentError}
                  aria-describedby={contentError ? 'edit-post-content-error' : undefined}
                />
                <div
                  className={`post-image-preview ${totalCount > 0 ? 'has-images' : ''}`}
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
                  <span className="helper-text" id="edit-post-content-error" role="alert">
                    * {contentError}
                  </span>
                )}
              </div>
              <div className="form-group">
                <span className="form-label">이미지 (최대 {MAX_IMAGES}장)</span>
                <div className="file-input-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="edit-file-input"
                    accept="image/jpeg,image/png"
                    multiple
                    className="file-input-hidden"
                    aria-hidden
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="file-input-button"
                    id="edit-file-trigger"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || totalCount >= MAX_IMAGES}
                  >
                    파일 선택
                  </button>
                  <span className="file-input-text">
                    {totalCount > 0 ? `총 ${totalCount}장` : '파일을 선택해주세요.'}
                  </span>
                </div>
              </div>
              {formError && (
                <span className="helper-text form-error-common" id="form-error" role="alert">
                  * {formError}
                </span>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                id="edit-submit-btn"
                disabled={loading || submitting}
              >
                {submitting ? '수정 중...' : '수정하기'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </Header>
  );
}
