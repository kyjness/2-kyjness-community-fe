// 게시글 작성 페이지: useNewPost 훅 + NewPost 하위 컴포넌트 조합.
import { Header } from '../components/Header.jsx';
import { useNewPost } from '../hooks/useNewPost.js';
import {
  NewPostTitleField,
  NewPostContentBlock,
  NewPostImageAttachment,
} from '../components/NewPost';
import { POST_CATEGORY_OPTIONS } from '../utils/postMeta.js';

export function NewPost() {
  const {
    title,
    content,
    titleError,
    contentError,
    formError,
    submitting,
    fileInputRef,
    contentRef,
    newImages,
    totalCount,
    MAX_IMAGES,
    handleFileChange,
    handleRemovePreview,
    handleSubmit,
    handleTitleChange,
    handleContentChange,
    categoryId,
    hashtagsInput,
    handleCategoryChange,
    handleHashtagsChange,
  } = useNewPost();

  return (
    <Header showBackButton backHref="/posts">
      <main className="main">
        <div className="post-list-container post-new-container">
          <div className="form-container">
            <h2 className="form-title">게시글 작성</h2>
            <form
              id="new-post-form"
              className="form new-post-form"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="new-post-category" className="form-label">
                  카테고리
                </label>
                <select
                  id="new-post-category"
                  name="categoryId"
                  className="form-input"
                  value={categoryId}
                  onChange={handleCategoryChange}
                  aria-label="게시판 카테고리"
                >
                  {POST_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <NewPostTitleField
                title={title}
                titleError={titleError}
                onChange={handleTitleChange}
              />
              <NewPostContentBlock
                content={content}
                contentRef={contentRef}
                contentError={contentError}
                onChange={handleContentChange}
                newImages={newImages}
                totalCount={totalCount}
                onRemovePreview={handleRemovePreview}
              />
              <NewPostImageAttachment
                fileInputRef={fileInputRef}
                totalCount={totalCount}
                maxImages={MAX_IMAGES}
                onFileChange={handleFileChange}
              />
              <div className="form-group">
                <label htmlFor="new-post-hashtags" className="form-label">
                  해시태그
                </label>
                <input
                  id="new-post-hashtags"
                  name="hashtags"
                  type="text"
                  className="form-input"
                  placeholder="예: 강아지, 산책"
                  value={hashtagsInput}
                  onChange={handleHashtagsChange}
                  autoComplete="off"
                />
              </div>
              {formError && (
                <span
                  className="helper-text form-error-common"
                  id="new-post-form-error"
                  role="alert"
                >
                  * {formError}
                </span>
              )}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? '작성 중...' : '완료'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </Header>
  );
}
