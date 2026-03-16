// 게시글 상세 페이지: usePostDetail 훅 + PostDetail 하위 컴포넌트 조합.
import { useEffect } from 'react';
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
  ReportModal,
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
    commentSort,
    setCommentSort,
    message,
    modalState,
    setModalState,
    commentForm,
    setCommentForm,
    commentEdit,
    setCommentEdit,
    setCommentPage,
    replyToCommentId,
    setReplyToCommentId,
    replyForm,
    setReplyForm,
    handleLike,
    handleCommentLike,
    handleCommentSubmit,
    handleReplySubmit,
    handleCommentDelete,
    handleCommentEdit,
    handlePostDelete,
    uniqueFiles,
    handleBlockUser,
    toastMessage,
    setToastMessage,
  } = usePostDetail(postId, user, navigate);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleReportSuccess = () => {
    setToastMessage('신고가 접수되었습니다.');
    setModalState((prev) => ({
      ...prev,
      reportOpen: false,
      reportTargetType: null,
      reportTargetId: null,
    }));
  };

  if (!postId) return <PostDetailFallback variant="invalid" />;
  if (loading && !post) return <PostDetailFallback variant="loading" />;
  if (error && !post) {
    return (
      <PostDetailFallback variant="error" error={error} onBack={() => navigate('/posts')} />
    );
  }

  return (
    <Header showBackButton backHref="/posts">
      <main className="main main-top">
        {toastMessage && (
          <div
            role="status"
            className="report-toast"
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 20px',
              background: 'var(--color-bg-elevated, #333)',
              color: 'var(--color-text-inverse, #fff)',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 9999,
            }}
          >
            {toastMessage}
          </div>
        )}
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
            onBlockUser={handleBlockUser}
            onReportOpen={() =>
              setModalState((prev) => ({
                ...prev,
                reportOpen: true,
                reportTargetType: 'POST',
                reportTargetId: Number(postId),
              }))
            }
            currentUserId={user?.userId ?? user?.id}
          >
            <CommentForm
              content={commentForm.content}
              submitting={commentForm.submitting}
              onChangeContent={(v) => setCommentForm((prev) => ({ ...prev, content: v }))}
              onSubmit={handleCommentSubmit}
            />
            <CommentList
              comments={comments}
              currentUserId={user?.userId ?? user?.id}
              commentSort={commentSort}
              setCommentSort={setCommentSort}
              commentEdit={commentEdit}
              setCommentEdit={setCommentEdit}
              onEditSave={handleCommentEdit}
              onCommentLike={handleCommentLike}
              onDeleteOpen={(id) => setModalState((prev) => ({ ...prev, commentDeleteId: id }))}
              onBlockUser={handleBlockUser}
              onReportOpen={(targetType, targetId) =>
                setModalState((prev) => ({
                  ...prev,
                  reportOpen: true,
                  reportTargetType: targetType,
                  reportTargetId: targetId,
                }))
              }
              commentPage={commentPage}
              commentTotalPages={commentTotalPages}
              setCommentPage={setCommentPage}
              replyToCommentId={replyToCommentId}
              setReplyToCommentId={setReplyToCommentId}
              replyForm={replyForm}
              setReplyForm={setReplyForm}
              onReplySubmit={handleReplySubmit}
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
      <ReportModal
        open={modalState.reportOpen}
        targetType={modalState.reportTargetType}
        targetId={modalState.reportTargetId}
        onClose={() =>
          setModalState((prev) => ({
            ...prev,
            reportOpen: false,
            reportTargetType: null,
            reportTargetId: null,
          }))
        }
        onSuccess={handleReportSuccess}
      />
    </Header>
  );
}
