// 게시글 상세 로직: 로드·조회수·좋아요·댓글 CRUD·모달 상태·normalize.
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '../api/client.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getApiErrorMessage,
  getProfileImageUrl,
  safeImageUrl,
} from '../utils/index.js';

const COMMENT_PAGE_SIZE = 10;

const POST_EDIT_MERGE_KEY = (id) => `pt_post_edit_merge_${id}`;

function updateCommentInTree(comments, commentId, patch) {
  return comments.map((c) => {
    if (c.id === commentId) return { ...c, ...patch };
    if (c.replies?.length) {
      const nextReplies = updateCommentInTree(c.replies, commentId, patch);
      const same =
        nextReplies.length === c.replies.length &&
        nextReplies.every((r, i) => r === c.replies[i]);
      return same ? c : { ...c, replies: nextReplies };
    }
    return c;
  });
}

function normalizePost(postData, currentUser) {
  const author = postData?.author ?? null;
  const isMine = !!(currentUser && (author?.id === currentUser.userId || author?.userId === currentUser.userId));
  const hashtagsRaw = postData?.hashtags;
  const hashtags = Array.isArray(hashtagsRaw)
    ? hashtagsRaw.map((t) => String(t))
    : [];
  const categoryId =
    postData?.categoryId ?? postData?.categoryid ?? postData?.category_id ?? null;

  const versionRaw = postData?.version ?? postData?.Version;
  const versionNum =
    typeof versionRaw === 'number'
      ? versionRaw
      : versionRaw != null && Number.isFinite(Number(versionRaw))
        ? Number(versionRaw)
        : null;
  const isEdited =
    postData?.isEdited === true ||
    postData?.isedited === true ||
    (versionNum !== null && versionNum > 1);

  return {
    id: postData?.id,
    title: postData?.title ?? '',
    content: postData?.content ?? '',
    category_id: categoryId,
    hashtags,
    isEdited,
    author_nickname: author?.nickname ?? '탈퇴한 사용자',
    author_id: author?.id ?? author?.userId ?? null,
    author_profile_image: getProfileImageUrl(currentUser, author, isMine, DEFAULT_PROFILE_IMAGE),
    author_representative_dog: author?.representativeDog ?? null,
    created_at: postData?.createdAt ?? postData?.createdat ?? '',
    files: postData?.files ?? (postData?.file ? [postData.file] : []),
    likes: postData?.likeCount ?? postData?.like_count ?? 0,
    views: postData?.viewCount ?? postData?.view_count ?? 0,
    commentCount: postData?.commentCount ?? postData?.comment_count ?? 0,
    isLiked: postData?.isLiked ?? false,
    isMine,
  };
}

function normalizeComment(c, currentUser) {
  const author = c?.author ?? null;
  const isMine = !!(currentUser && (author?.id === currentUser.userId || author?.userId === currentUser.userId));
  const repDog = author?.representativeDog ?? author?.representative_dog ?? null;
  const replies = Array.isArray(c?.replies) ? c.replies.map((r) => normalizeComment(r, currentUser)) : [];

  const parentId = c?.parentId ?? c?.parent_id ?? null;
  const isDeleted = c?.isDeleted ?? c?.is_deleted ?? false;
  const isEdited = c?.isEdited === true || c?.is_edited === true || c?.isedited === true;
  const likeCount = c?.likeCount ?? c?.like_count ?? 0;
  const isLiked = c?.isLiked ?? c?.is_liked ?? false;
  const createdAt = c?.createdAt ?? c?.created_at ?? '';
  const updatedAt = c?.updatedAt ?? c?.updated_at ?? '';

  return {
    id: c?.id,
    author_nickname: author?.nickname ?? '탈퇴한 사용자',
    author_profile_image: getProfileImageUrl(currentUser, author, isMine, DEFAULT_PROFILE_IMAGE),
    author_representative_dog: repDog,
    author_id: author?.id ?? author?.userId ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    content: c?.content ?? '',
    isMine,
    likeCount,
    isLiked,
    parentId,
    replies,
    isEdited,
    isDeleted,
  };
}

/** ApiResponse 래퍼·페이지 객체 직접 응답 모두 수용 (snake/camel total 필드 호환) */
function unwrapCommentsPagePayload(res) {
  if (!res || typeof res !== 'object') return { items: [], totalCount: 0 };
  const inner = res.data !== undefined ? res.data : res;
  const items = Array.isArray(inner?.items) ? inner.items : [];
  const totalCount = inner?.totalCount ?? inner?.total_count ?? 0;
  return { items, totalCount };
}

/**
 * items가 트리(replies)가 아니라 한 배열에 부모·자식이 섞인(flat) 형태일 때 parentId로 재조립.
 */
function nestFlatCommentsIfNeeded(normalizedRoots) {
  if (!Array.isArray(normalizedRoots) || normalizedRoots.length === 0) return normalizedRoots;
  const anyNestedChild = normalizedRoots.some((c) => Array.isArray(c.replies) && c.replies.length > 0);
  if (anyNestedChild) return normalizedRoots;
  const needsNest = normalizedRoots.some((c) => c.parentId != null);
  if (!needsNest) return normalizedRoots;

  const byId = new Map();
  for (const c of normalizedRoots) {
    byId.set(c.id, { ...c, replies: [] });
  }
  const roots = [];
  for (const c of normalizedRoots) {
    const node = byId.get(c.id);
    if (!node) continue;
    const pid = c.parentId;
    if (pid == null) {
      roots.push(node);
    } else {
      const parent = byId.get(pid);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  return roots;
}

export function usePostDetail(postId, user, navigate) {
  const { isRestored } = useAuth();
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

  const isLikingRef = useRef(false);
  const pendingCommentLikeIdsRef = useRef(new Set());

  // 조회수는 GET /posts/{id} 한 번으로 처리(백엔드가 Redis NX + 증가 시 응답에 viewCount+1 반영).
  // POST /view 를 먼저 호출하면 Redis 키만 소비되고 GET 에서는 증가·낙관적 반영이 스킵되어,
  // slave 읽기 시 화면 조회수가 안 오르는 것처럼 보임.
  const loadPost = useCallback(
    async () => {
      if (!postId) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/posts/${postId}`);
        const data = res?.data ?? null;
        if (data) {
          let merge = null;
          try {
            const raw = sessionStorage.getItem(POST_EDIT_MERGE_KEY(postId));
            if (raw) {
              merge = JSON.parse(raw);
              sessionStorage.removeItem(POST_EDIT_MERGE_KEY(postId));
            }
          } catch {
            /* ignore */
          }
          const normalized = normalizePost(data, user);
          if (merge && merge.postId === postId) {
            setPost({
              ...normalized,
              title: merge.title ?? normalized.title,
              content: merge.content ?? normalized.content,
              category_id: merge.categoryId ?? normalized.category_id,
              hashtags: Array.isArray(merge.hashtags) ? merge.hashtags : normalized.hashtags,
              isEdited: true,
            });
          } else {
            setPost(normalized);
          }
        }
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
        const { items: arr, totalCount } = unwrapCommentsPagePayload(res);
        const mapped = arr.map((c) => normalizeComment(c, user));
        setComments(nestFlatCommentsIfNeeded(mapped));
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

  // localStorage 복원 전에 로드하면 isMine=false로 고정됨 → isRestored 후 로드, user·postId 변경 시 재로드.
  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }
    if (!isRestored) {
      return;
    }
    void loadPost();
  }, [postId, loadPost, isRestored]);

  useEffect(() => {
    if (!postId || !isRestored) return;
    loadComments(1);
  }, [postId, commentSort, loadComments, isRestored]);

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
      const data = res?.data ?? null;
      const likeCount = data?.likeCount;
      const isLiked = data?.isLiked;
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
        await api.post(`/posts/${postId}/comments`, { content, parentId });
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
          updateCommentInTree(prev, commentId, {
            content: newContent.trim(),
            isEdited: true,
          })
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
      if (pendingCommentLikeIdsRef.current.has(commentId)) return;
      if (!user) {
        if (!window.confirm('로그인이 필요한 서비스입니다. 로그인하시겠습니까?')) return;
        sessionStorage.setItem('login_return_path', `/posts/${postId}`);
        navigate('/login');
        return;
      }
      setMessage('');
      pendingCommentLikeIdsRef.current.add(commentId);
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
        if (
          data?.likeCount !== undefined ||
          data?.like_count !== undefined ||
          data?.isLiked !== undefined ||
          data?.is_liked !== undefined
        ) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likeCount: data.likeCount ?? data.like_count ?? c.likeCount,
                    isLiked: data.isLiked ?? data.is_liked ?? c.isLiked,
                  }
                : c
            )
          );
        }
      } catch (err) {
        if (err?.status === 401) {
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
      } finally {
        pendingCommentLikeIdsRef.current.delete(commentId);
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
      const meId = user?.userId ?? user?.id;
      if (!targetUserId || !meId) return;
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
    [user?.userId, user?.id]
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
