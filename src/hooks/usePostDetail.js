// 게시글 상세 로직: 로드·조회수·좋아요·댓글 CRUD·모달 상태·normalize.
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '../api/client.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';
import {
  getApiErrorMessage,
  getProfileImageUrl,
  safeImageUrl,
} from '../utils/index.js';

const COMMENT_PAGE_SIZE = 10;

function normalizePost(postData, currentUser) {
  const author = postData?.author ?? null;
  const isMine = !!(currentUser && (author?.id === currentUser.userId || author?.userId === currentUser.userId));
  return {
    id: postData?.id,
    title: postData?.title ?? '',
    content: postData?.content ?? '',
    author_nickname: author?.nickname ?? '',
    author_id: author?.id ?? author?.userId ?? null,
    author_profile_image: getProfileImageUrl(currentUser, author, isMine, DEFAULT_PROFILE_IMAGE),
    author_representative_dog: author?.representativeDog ?? author?.representative_dog ?? null,
    created_at: postData?.createdAt ?? '',
    files: postData?.files ?? (postData?.file ? [postData.file] : []),
    likes: postData?.likeCount ?? postData?.like_count ?? 0,
    views: postData?.viewCount ?? 0,
    commentCount: postData?.commentCount ?? 0,
    isLiked: postData?.isLiked ?? postData?.is_liked ?? false,
    isMine,
  };
}

function normalizeComment(c, currentUser) {
  const author = c?.author ?? null;
  const isMine = !!(currentUser && (author?.id === currentUser.userId || author?.userId === currentUser.userId));
  const replies = Array.isArray(c?.replies) ? c.replies.map((r) => normalizeComment(r, currentUser)) : [];
  return {
    id: c?.id,
    author_nickname: author?.nickname ?? '',
    author_profile_image: getProfileImageUrl(currentUser, author, isMine, DEFAULT_PROFILE_IMAGE),
    author_representative_dog: author?.representativeDog ?? author?.representative_dog ?? null,
    author_id: author?.id ?? author?.userId ?? null,
    created_at: c?.createdAt ?? c?.created_at ?? '',
    updated_at: c?.updatedAt ?? c?.updated_at ?? '',
    content: c?.content ?? '',
    isMine,
    likeCount: c?.likeCount ?? c?.like_count ?? 0,
    isLiked: c?.isLiked ?? c?.is_liked ?? false,
    parentId: c?.parentId ?? c?.parent_id ?? null,
    replies,
    isEdited: c?.isEdited ?? c?.is_edited ?? false,
    isDeleted: c?.isDeleted ?? c?.is_deleted ?? false,
  };
}

export function usePostDetail(postId, user, navigate) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentTotalCount, setCommentTotalCount] = useState(0);
  const [commentSort, setCommentSort] = useState('latest');
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({
    postDeleteOpen: false,
    commentDeleteId: null,
    reportOpen: false,
    reportTargetType: null,
    reportTargetId: null,
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [commentForm, setCommentForm] = useState({ content: '', submitting: false });
  const [commentEdit, setCommentEdit] = useState({ editingId: null, content: '' });
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyForm, setReplyForm] = useState({ content: '', submitting: false });

  const viewRequestedRef = useRef(null);
  const isLikingRef = useRef(false);

  const loadPost = useCallback(
    async (recordView = true) => {
      if (!postId) return;
      setLoading(true);
      setError('');
      try {
        if (recordView) {
          const fromEdit = sessionStorage.getItem('post_detail_skip_view') === String(postId);
          if (fromEdit) sessionStorage.removeItem('post_detail_skip_view');
          if (!fromEdit && viewRequestedRef.current !== postId) {
            viewRequestedRef.current = postId;
            try {
              await api.post(`/posts/${postId}/view`);
            } catch (_) {}
          }
        }
        const res = await api.get(`/posts/${postId}`);
        const data = res?.data ?? res;
        setPost(normalizePost(data, user));
      } catch (err) {
        setError(getApiErrorMessage(err?.code ?? err?.message, '게시글을 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    },
    [postId, user]
  );

  const loadComments = useCallback(
    async (page = 1) => {
      if (!postId) return;
      setMessage('');
      try {
        const sortParam = commentSort && commentSort !== 'latest' ? `&sort=${encodeURIComponent(commentSort)}` : '';
        const res = await api.get(
          `/posts/${postId}/comments?page=${page}&size=${COMMENT_PAGE_SIZE}${sortParam}`
        );
        const payload = res?.data?.data ?? res?.data ?? {};
        const arr = Array.isArray(payload?.items) ? payload.items : [];
        const totalCount = payload?.total ?? payload?.total_count ?? 0;
        setComments(arr.map((c) => normalizeComment(c, user)));
        setCommentTotalCount(totalCount);
        setCommentTotalPages(Math.max(1, Math.ceil(totalCount / COMMENT_PAGE_SIZE)));
        setCommentPage(1);
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '댓글 목록을 불러오지 못했습니다.')
        );
      }
    },
    [postId, user, commentSort]
  );

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }
    let ignore = false;
    loadPost(true).then(() => {
      if (!ignore) setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    loadComments(1);
  }, [postId, commentSort, loadComments]);

  const handleLike = useCallback(async () => {
    if (!postId) return;
    if (isLikingRef.current) return;
    if (!user) {
      if (!window.confirm('로그인이 필요한 서비스입니다. 로그인하시겠습니까?')) return;
      sessionStorage.setItem('login_return_path', `/posts/${postId}`);
      navigate('/login');
      return;
    }
    setMessage('');
    isLikingRef.current = true;
    const currentlyLiked = post?.isLiked ?? false;
    try {
      const res = currentlyLiked
        ? await api.delete(`/likes/posts/${postId}`)
        : await api.post(`/likes/posts/${postId}`);
      const data = res?.data ?? res;
      const likeCount = data?.likeCount ?? data?.like_count;
      const isLiked = data?.isLiked ?? data?.is_liked;
      if (likeCount !== undefined || isLiked !== undefined) {
        setPost((p) =>
          p
            ? {
                ...p,
                likes: typeof likeCount === 'number' ? likeCount : p.likes,
                isLiked: typeof isLiked === 'boolean' ? isLiked : p.isLiked,
              }
            : p
        );
      }
    } catch (err) {
      setMessage(
        getApiErrorMessage(err?.code ?? err?.message, '좋아요 처리에 실패했습니다.')
      );
    } finally {
      isLikingRef.current = false;
    }
  }, [postId, user, navigate, post]);

  const handleCommentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!postId || !user) {
        if (!window.confirm('로그인이 필요한 서비스입니다. 로그인하시겠습니까?')) return;
        sessionStorage.setItem('login_return_path', `/posts/${postId}`);
        navigate('/login');
        return;
      }
      const content = commentForm.content.trim();
      if (!content) return;
      setMessage('');
      setCommentForm((prev) => ({ ...prev, submitting: true }));
      try {
        await api.post(`/posts/${postId}/comments`, { content });
        setCommentForm((prev) => ({ ...prev, content: '', submitting: false }));
        setPost((p) => (p ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p));
        await loadComments(1);
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '댓글 등록에 실패했습니다.')
        );
        setCommentForm((prev) => ({ ...prev, submitting: false }));
      }
    },
    [postId, user, commentForm.content, navigate, loadComments]
  );

  const handleReplySubmit = useCallback(
    async (e, parentId) => {
      e.preventDefault();
      if (!postId || !user || !parentId) return;
      const content = replyForm.content.trim();
      if (!content) return;
      setMessage('');
      setReplyForm((prev) => ({ ...prev, submitting: true }));
      try {
        await api.post(`/posts/${postId}/comments`, { content, parent_id: parentId });
        setReplyForm((prev) => ({ ...prev, content: '', submitting: false }));
        setReplyToCommentId(null);
        setPost((p) => (p ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p));
        await loadComments(1);
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '답글 등록에 실패했습니다.')
        );
        setReplyForm((prev) => ({ ...prev, submitting: false }));
      }
    },
    [postId, user, replyForm.content, loadComments]
  );

  const handleCommentDelete = useCallback(
    async (commentId) => {
      if (!postId || !commentId) return;
      setMessage('');
      try {
        await api.delete(`/posts/${postId}/comments/${commentId}`);
        setModalState((prev) => ({ ...prev, commentDeleteId: null }));
        setPost((p) => (p ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 0) - 1) } : p));
        await loadComments(commentPage);
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '댓글 삭제에 실패했습니다.')
        );
      }
    },
    [postId, commentPage, loadComments]
  );

  const handleCommentEdit = useCallback(
    async (commentId, newContent) => {
      if (!postId || !commentId || !newContent?.trim()) return;
      setMessage('');
      try {
        await api.patch(`/posts/${postId}/comments/${commentId}`, {
          content: newContent.trim(),
        });
        setCommentEdit({ editingId: null, content: '' });
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, content: newContent.trim() } : c
          )
        );
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '댓글 수정에 실패했습니다.')
        );
      }
    },
    [postId]
  );

  const handleCommentLike = useCallback(
    async (commentId) => {
      if (!postId || !commentId) return;
      if (!user) {
        if (!window.confirm('로그인이 필요한 서비스입니다. 로그인하시겠습니까?')) return;
        sessionStorage.setItem('login_return_path', `/posts/${postId}`);
        navigate('/login');
        return;
      }
      setMessage('');
      const comment = comments.find((c) => c.id === commentId);
      const isCurrentlyLiked = comment?.isLiked ?? false;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const nextLiked = !c.isLiked;
          return {
            ...c,
            isLiked: nextLiked,
            likeCount: Math.max(0, (c.likeCount ?? 0) + (nextLiked ? 1 : -1)),
          };
        })
      );
      try {
        const req = isCurrentlyLiked
          ? api.delete(`/likes/comments/${commentId}`)
          : api.post(`/likes/comments/${commentId}`);
        const res = await req;
        const data = res?.data ?? res;
        if (data?.likeCount !== undefined || data?.isLiked !== undefined) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likeCount: data.likeCount ?? c.likeCount,
                    isLiked: data.isLiked ?? c.isLiked,
                  }
                : c
            )
          );
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          if (!window.confirm('로그인이 필요한 서비스입니다. 로그인하시겠습니까?')) return;
          sessionStorage.setItem('login_return_path', `/posts/${postId}`);
          navigate('/login');
          return;
        }
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              isLiked: c.isLiked ?? false,
              likeCount: Math.max(0, (c.likeCount ?? 0) + (c.isLiked ? -1 : 1)),
            };
          })
        );
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '댓글 좋아요 처리에 실패했습니다.')
        );
      }
    },
    [postId, user, navigate, comments]
  );

  const handlePostDelete = useCallback(async () => {
    if (!postId) return;
    setMessage('');
    try {
      await api.delete(`/posts/${postId}`);
      setModalState((prev) => ({ ...prev, postDeleteOpen: false }));
      navigate('/posts');
    } catch (err) {
      setMessage(
        getApiErrorMessage(err?.code ?? err?.message, '게시글 삭제에 실패했습니다.')
      );
    }
  }, [postId, navigate]);

  const handleBlockUser = useCallback(
    async (targetUserId) => {
      if (!targetUserId || !user?.userId) return;
      if (
        !window.confirm(
          '이 사용자를 차단하시겠습니까? 차단한 사용자의 게시글과 댓글이 보이지 않습니다.'
        )
      ) {
        return;
      }
      setMessage('');
      try {
        await api.post(`/users/${targetUserId}/block`);
        window.location.reload();
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '차단 처리에 실패했습니다.')
        );
      }
    },
    [user?.userId]
  );

  const displayedComments = useMemo(
    () =>
      comments.slice(
        (commentPage - 1) * COMMENT_PAGE_SIZE,
        commentPage * COMMENT_PAGE_SIZE
      ),
    [comments, commentPage]
  );

  const uniqueFiles = useMemo(() => {
    const files = (post?.files ?? []).filter((f) => safeImageUrl(f.fileUrl, ''));
    const seen = new Set();
    return files.filter((f) => {
      const url = safeImageUrl(f.fileUrl, '');
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [post?.files]);

  return {
    loading,
    error,
    post,
    comments: displayedComments,
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
    loadPost,
    loadComments,
    handleLike,
    handleCommentLike,
    handleCommentSubmit,
    handleReplySubmit,
    handleCommentDelete,
    handleCommentEdit,
    handlePostDelete,
    handleBlockUser,
    toastMessage,
    setToastMessage,
    uniqueFiles,
  };
}
