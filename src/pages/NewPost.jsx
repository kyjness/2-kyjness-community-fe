// 게시글 작성 페이지: useNewPost 훅 + NewPost 하위 컴포넌트 조합.
import { Header } from '../components/Header.jsx';
import { useNewPost } from '../hooks/useNewPost.js';
import {
  NewPostTitleField,
  NewPostContentBlock,
  NewPostImageAttachment,
} from '../components/NewPost';

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
