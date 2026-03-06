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
    author_profile_image: getProfileImageUrl(currentUser, author, isMine, DEFAULT_PROFILE_IMAGE),
    author_representative_dog: author?.representativeDog ?? author?.representative_dog ?? null,
    created_at: postData?.createdAt ?? '',
    files: postData?.files ?? (postData?.file ? [postData.file] : []),
    likes: postData?.likeCount ?? 0,
    views: postData?.viewCount ?? 0,
    commentCount: postData?.commentCount ?? 0,
    isMine,
  };
}

function normalizeComment(c, currentUser) {
  const author = c?.author ?? null;
  const isMine = !!(currentUser && (author?.id === currentUser.userId || author?.userId === currentUser.userId));
  return {
    id: c?.id,
    author_nickname: author?.nickname ?? '',
    author_profile_image: getProfileImageUrl(currentUser, author, isMine, DEFAULT_PROFILE_IMAGE),
    author_representative_dog: author?.representativeDog ?? author?.representative_dog ?? null,
    created_at: c?.createdAt ?? '',
    content: c?.content ?? '',
    isMine,
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
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ postDeleteOpen: false, commentDeleteId: null });
  const [commentForm, setCommentForm] = useState({ content: '', submitting: false });
  const [commentEdit, setCommentEdit] = useState({ editingId: null, content: '' });

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
        const res = await api.get(
          `/posts/${postId}/comments?page=${page}&size=${COMMENT_PAGE_SIZE}`
        );
        const payload = res?.data ?? res;
        const list =
          payload?.list ?? payload?.comments ?? (Array.isArray(payload) ? payload : []);
        const arr = Array.isArray(list) ? list : [];
        setComments(arr.map((c) => normalizeComment(c, user)));
        setCommentTotalPages(payload?.totalPages ?? res?.totalPages ?? 1);
        setCommentTotalCount(payload?.totalCount ?? res?.totalCount ?? arr.length);
        setCommentPage(page);
      } catch (err) {
        setMessage(
          getApiErrorMessage(err?.code ?? err?.message, '댓글 목록을 불러오지 못했습니다.')
        );
      }
    },
    [postId, user]
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
    loadComments(commentPage);
  }, [postId, commentPage, loadComments]);

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
    try {
      const res = await api.post(`/posts/${postId}/likes`);
      if (res?.code === 'ALREADY_LIKED') {
        await api.delete(`/posts/${postId}/likes`);
        setPost((p) => (p ? { ...p, likes: Math.max(0, (p.likes ?? 0) - 1) } : p));
      } else {
        setPost((p) => (p ? { ...p, likes: (p.likes ?? 0) + 1 } : p));
      }
    } catch (err) {
      setMessage(
        getApiErrorMessage(err?.code ?? err?.message, '좋아요 처리에 실패했습니다.')
      );
    } finally {
      isLikingRef.current = false;
    }
  }, [postId, user, navigate]);

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
    loadPost,
    loadComments,
    handleLike,
    handleCommentSubmit,
    handleCommentDelete,
    handleCommentEdit,
    handlePostDelete,
    uniqueFiles,
  };
}
