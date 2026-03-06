// 게시글 상세 페이지: usePostDetail 훅 + PostDetail 하위 컴포넌트 조합.
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePostDetail } from '../hooks/usePostDetail.js';
import {
  PostContent,
  CommentForm,
  CommentList,
  PostDeleteModal,
  CommentDeleteModal,
  PostDetailFallback,
} from '../components/PostDetail';

export function PostDetail() {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    error,
    post,
    comments,
    commentPage,
    commentTotalPages,
    commentTotalCount,
    message,
    modalState,
    setModalState,
    commentForm,
    setCommentForm,
    commentEdit,
    setCommentEdit,
    setCommentPage,
    handleLike,
    handleCommentSubmit,
    handleCommentDelete,
    handleCommentEdit,
    handlePostDelete,
    uniqueFiles,
  } = usePostDetail(postId, user, navigate);

  if (!postId) return <PostDetailFallback variant="invalid" />;
  if (loading && !post) return <PostDetailFallback variant="loading" />;
  if (error && !post) {
    return (
      <PostDetailFallback variant="error" error={error} onBack={() => navigate('/posts')} />
    );
  }

  return (
    <Header showBackButton backHref="/posts">
      <main className="main post-detail-main">
        <div className="post-detail-container">
          <PostContent
            post={post}
            postId={postId}
            message={message}
            uniqueFiles={uniqueFiles}
            commentTotalCount={commentTotalCount}
            onLike={handleLike}
            onEdit={(path) => navigate(path)}
            onDeleteOpen={() => setModalState((prev) => ({ ...prev, postDeleteOpen: true }))}
          >
            <CommentForm
              content={commentForm.content}
              submitting={commentForm.submitting}
              onChangeContent={(v) => setCommentForm((prev) => ({ ...prev, content: v }))}
              onSubmit={handleCommentSubmit}
            />
            <CommentList
              comments={comments}
              commentEdit={commentEdit}
              setCommentEdit={setCommentEdit}
              onEditSave={handleCommentEdit}
              onDeleteOpen={(id) => setModalState((prev) => ({ ...prev, commentDeleteId: id }))}
              commentPage={commentPage}
              commentTotalPages={commentTotalPages}
              setCommentPage={setCommentPage}
            />
          </PostContent>
        </div>
      </main>

      <PostDeleteModal
        open={modalState.postDeleteOpen}
        onClose={() => setModalState((prev) => ({ ...prev, postDeleteOpen: false }))}
        onConfirm={handlePostDelete}
      />
      <CommentDeleteModal
        open={!!modalState.commentDeleteId}
        onClose={() => setModalState((prev) => ({ ...prev, commentDeleteId: null }))}
        onConfirm={() =>
          modalState.commentDeleteId && handleCommentDelete(modalState.commentDeleteId)
        }
      />
    </Header>
  );
}
