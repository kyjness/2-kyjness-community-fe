// 게시글 상세 조회 페이지

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { getUser } from '../state.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { escapeHtml, escapeAttr, resolvePostId, getApiErrorMessage, safeImageUrl, openModal, closeModal, showFieldError, clearErrors } from '../utils.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';

const LOADING_MSG = '<div style="text-align:center;padding:40px;">게시글을 불러오는 중...</div>';
const COMMENT_PAGE_SIZE = 10;

// 게시글 상세 페이지 렌더링
export async function renderPostDetail(param) {
  const root = document.getElementById('app-root');
  const postId = resolvePostId(param);

  root.innerHTML = `
    ${renderHeader({ showBackButton: true })}

    <main class="main post-detail-main">
      <div class="post-detail-container">
        <div id="post-detail-card">
          <!-- 여기 안에 상세 내용이 들어감 -->
        </div>
      </div>
    </main>

    <!-- 게시글 삭제 모달 (editProfile.js와 동일한 공통 모달 스타일 사용) -->
    <div class="modal-overlay" id="post-delete-modal">
      <div class="modal">
        <h3 class="modal-title">게시글을 삭제하시겠습니까?</h3>
        <p class="modal-text">삭제한 내용은 복구 할 수 없습니다.</p>

        <div class="modal-actions">
          <button
            type="button"
            class="modal-btn modal-btn-cancel"
            id="post-delete-cancel"
          >
            취소
          </button>
          <button
            type="button"
            class="modal-btn modal-btn-confirm"
            id="post-delete-confirm"
          >
            확인
          </button>
        </div>
      </div>
    </div>

    <!-- 댓글 삭제 모달 (공통 모달 스타일 재사용) -->
    <div class="modal-overlay" id="comment-delete-modal">
      <div class="modal">
        <h3 class="modal-title">댓글을 삭제하시겠습니까?</h3>
        <p class="modal-text">삭제한 내용은 복구 할 수 없습니다.</p>

        <div class="modal-actions">
          <button
            type="button"
            class="modal-btn modal-btn-cancel"
            id="comment-delete-cancel"
          >
            취소
          </button>
          <button
            type="button"
            class="modal-btn modal-btn-confirm"
            id="comment-delete-confirm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  `;

  initHeaderEvents();
  if (postId) {
    attachModalEvents(postId);
    const isInitialLoadToPost = param?._firstRoutePath === '/posts/:id';
    await loadPostDetail(postId, { recordView: true, skipView: isInitialLoadToPost });
  } else {
    const card = document.getElementById('post-detail-card');
    if (card)
      card.innerHTML =
        '<p class="post-list-message">유효하지 않은 게시글입니다.</p>';
  }
}

/* =========================
   댓글 페이지 전환
   ========================= */

async function loadCommentsPage(postId, page) {
  const commentList = document.getElementById('comment-list');
  const commentPagination = document.getElementById('comment-pagination');
  if (!commentList || !postId) return;

  try {
    const response = await api.get(`/posts/${postId}/comments?page=${page}&size=${COMMENT_PAGE_SIZE}`);
    const commentsData = response.data || response;
    const comments = Array.isArray(commentsData) ? commentsData : [];
    const currentUser = getUser();
    const totalPages = response.totalPages ?? 1;

    const commentsHTML = comments
      .map(
        (c) => {
          const isMine = currentUser && c.author?.userId === currentUser.userId;
          const avatarUrl = isMine && currentUser?.profileImageUrl
            ? (safeImageUrl(currentUser.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE)
            : (safeImageUrl(c.author?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE);
          return `
      <article class="comment-item" data-comment-id="${c.commentId}">
        <div class="comment-avatar">
          <img src="${avatarUrl}" alt="댓글 작성자 프로필" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
        </div>
        <div class="comment-body">
          <div class="comment-header">
            <div class="comment-header-left">
              <span class="comment-author-name">${escapeHtml(c.author?.nickname ?? '')}</span>
              <span class="comment-date">${escapeHtml(String(c.createdAt ?? ''))}</span>
            </div>
            ${isMine
                ? `
            <div class="detail-action-group">
              <button type="button" class="detail-action-btn comment-edit-btn" data-comment-id="${c.commentId}">수정</button>
              <button type="button" class="detail-action-btn comment-delete-btn" data-comment-id="${c.commentId}">삭제</button>
            </div>
            `
                : ''
            }
          </div>
          <p class="comment-content">${escapeHtml(c.content ?? '')}</p>
        </div>
      </article>
    `;
        },
      )
      .join('');

    commentList.innerHTML = commentsHTML;

    // 페이지 버튼 active 갱신
    if (commentPagination) {
      const btns = commentPagination.querySelectorAll('.comment-page-btn');
      btns.forEach((b) => {
        b.classList.toggle('active', parseInt(b.dataset.page, 10) === page);
      });
    }
  } catch (err) {
    console.warn('댓글 페이지 로드 실패:', err);
    showFieldError('post-detail-message', getApiErrorMessage(err?.code || err?.message, '댓글 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'));
  }
}

/* =========================
   모달 공통 이벤트
   ========================= */

let currentCommentIdForDelete = null;

function attachModalEvents(postId) {
  const postDeleteModal = document.getElementById('post-delete-modal');
  const postDeleteCancel = document.getElementById('post-delete-cancel');
  const postDeleteConfirm = document.getElementById('post-delete-confirm');

  const commentDeleteModal = document.getElementById('comment-delete-modal');
  const commentDeleteCancel = document.getElementById('comment-delete-cancel');
  const commentDeleteConfirm = document.getElementById(
    'comment-delete-confirm',
  );

  // 게시글 삭제 모달
  postDeleteCancel.addEventListener('click', () => {
    closeModal(postDeleteModal);
  });

  postDeleteConfirm.addEventListener('click', async () => {
    try {
      await api.delete(`/posts/${postId}`);
      closeModal(postDeleteModal);
      navigateTo('/posts');
    } catch (error) {
      closeModal(postDeleteModal);
      showFieldError('post-detail-message', getApiErrorMessage(error?.code || error?.message, '게시글 삭제에 실패했습니다. 권한을 확인한 뒤 다시 시도해주세요.'));
    }
  });

  postDeleteModal.addEventListener('click', (e) => {
    if (e.target === postDeleteModal) {
      closeModal(postDeleteModal);
    }
  });

  // 댓글 삭제 모달
  commentDeleteCancel.addEventListener('click', () => {
    currentCommentIdForDelete = null;
    closeModal(commentDeleteModal);
  });

  commentDeleteConfirm.addEventListener('click', async () => {
    if (!currentCommentIdForDelete) return;

    const commentIdToRemove = currentCommentIdForDelete;
    try {
      await api.delete(`/posts/${postId}/comments/${commentIdToRemove}`);
      currentCommentIdForDelete = null;
      closeModal(commentDeleteModal);
      // 새로고침 없이 해당 댓글만 DOM에서 제거
      const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentIdToRemove}"]`);
      if (commentItem) commentItem.remove();
      const statBoxes = document.querySelectorAll('.post-detail-stat-box');
      const commentCountEl = statBoxes[2]?.querySelector('.post-detail-stat-count');
      if (commentCountEl) {
        const n = parseInt(commentCountEl.textContent, 10) || 0;
        commentCountEl.textContent = Math.max(0, n - 1);
      }
    } catch (error) {
      showFieldError('post-detail-message', getApiErrorMessage(error?.code || error?.message, '댓글 삭제에 실패했습니다. 본인 댓글인지 확인한 뒤 다시 시도해주세요.'));
    }
  });

  commentDeleteModal.addEventListener('click', (e) => {
    if (e.target === commentDeleteModal) {
      currentCommentIdForDelete = null;
      closeModal(commentDeleteModal);
    }
  });
}

/* =========================
   게시글 상세 데이터 로딩
   ========================= */


/**
 * @param {string|number} postId
 * @param {{ recordView?: boolean }} options - recordView: true면 조회수 증가 (페이지 진입 시), false면 미증가 (댓글 등으로 재조회 시)
 */
async function loadPostDetail(postId, options = {}) {
  const { recordView = false } = options;
  const card = document.getElementById('post-detail-card');
  if (!card) return;
  if (!postId) {
    card.innerHTML =
      '<p class="post-list-message">유효하지 않은 게시글입니다.</p>';
    return;
  }

  card.innerHTML = LOADING_MSG;

  try {
    // 조회수: 링크로 상세 진입 시에만 증가. 수정 후 복귀·새로고침·직접URL은 미증가
    if (recordView) {
      const fromEdit = sessionStorage.getItem('post_detail_skip_view') === String(postId);
      if (fromEdit) sessionStorage.removeItem('post_detail_skip_view');
      if (!options.skipView && !fromEdit) {
        try {
          await api.post(`/posts/${postId}/view`);
        } catch (e) {
          console.warn('조회수 기록 실패:', e);
        }
      }
    }
    // 게시글 상세 조회
    const response = await api.get(`/posts/${postId}`);

    // API 응답 구조: { code: "POST_RETRIEVED", data: {...} }
    const postData = response.data || response;

    // 백엔드 필드명을 프론트엔드 필드명으로 변환. isMine은 백엔드에서 안 내려오므로 로그인 사용자와 작성자 비교
    const currentUser = getUser();
    const isMine = !!(currentUser && postData.author?.userId === currentUser.userId);
    const normalizedPost = {
      id: postData.postId,
      title: postData.title || '',
      content: postData.content || '',
      author_nickname: postData.author?.nickname || '',
      author_profile_image: isMine && currentUser?.profileImageUrl
        ? (safeImageUrl(currentUser.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE)
        : (safeImageUrl(postData.author?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE),
      created_at: postData.createdAt || '',
      files: postData.files || (postData.file ? [postData.file] : []),
      likes: postData.likeCount || 0,
      views: postData.hits || 0,
      commentCount: postData.commentCount ?? 0,
      isMine,
    };

    // 댓글 목록 조회 (10개 단위 페이지네이션)
    let comments = [];
    let commentTotalPages = 1;
    let commentTotalCount = 0;
    try {
      const commentsResponse = await api.get(`/posts/${postId}/comments?page=1&size=${COMMENT_PAGE_SIZE}`);
      const commentsPayload = commentsResponse.data || commentsResponse;
      const commentsList = Array.isArray(commentsPayload) ? commentsPayload : (commentsPayload?.comments ?? []);
      comments = commentsList.map(
        (c) => {
          const commentIsMine = !!(currentUser && c.author?.userId === currentUser.userId);
          return {
            id: c.commentId,
            author_nickname: c.author?.nickname || '',
            author_profile_image: commentIsMine && currentUser?.profileImageUrl
              ? (safeImageUrl(currentUser.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE)
              : (safeImageUrl(c.author?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE),
            created_at: c.createdAt || '',
            content: c.content || '',
            isMine: commentIsMine,
          };
        },
      );
      const payload = commentsResponse.data || commentsResponse;
      commentTotalPages = payload?.totalPages ?? commentsResponse.totalPages ?? 1;
      commentTotalCount = payload?.totalCount ?? commentsResponse.totalCount ?? comments.length;
    } catch (commentError) {
      console.warn('댓글 조회 실패:', commentError);
    }

    renderPostDetailCard(normalizedPost, comments, postId, 1, commentTotalPages, commentTotalCount);
  } catch (error) {
    console.error('게시글 상세 조회 실패:', error);
    card.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <p class="post-list-message">게시글을 불러올 수 없습니다.</p>
        <p style="color:#777;font-size:12px;margin-top:8px;">${escapeHtml(getApiErrorMessage(error?.code || error?.message, '게시글을 불러오지 못했습니다. 삭제되었거나 일시적인 오류일 수 있습니다.'))}</p>
        <button type="button" id="post-detail-back-to-list" style="margin-top:16px;padding:8px 16px;background:#aca0eb;color:white;border:none;border-radius:6px;cursor:pointer;">목록으로 돌아가기</button>
      </div>
    `;
    const backBtn = document.getElementById('post-detail-back-to-list');
    if (backBtn) backBtn.addEventListener('click', () => navigateTo('/posts'));
  }
}

// 게시글 상세/댓글 DOM 렌더링 (수정·댓글·좋아요 이벤트)
function renderPostDetailCard(post, comments, postId, commentCurrentPage = 1, commentTotalPages = 1, commentTotalCount = 0) {
  const card = document.getElementById('post-detail-card');
  if (!card) return;

  const files = post.files || [];
  const fileBlock = files.length > 0
    ? `
      <div class="post-detail-images-wrapper">
        ${files.map((f) => {
          const url = safeImageUrl(f.fileUrl || f.url, '') || '';
          return url ? `<div class="post-detail-image-wrapper"><img src="${escapeAttr(url)}" alt="게시글 이미지" class="post-detail-image" /></div>` : '';
        }).filter(Boolean).join('')}
      </div>
      `
    : '';

  card.innerHTML = `
    <section class="post-detail-card">
      <h2 class="post-detail-title">${escapeHtml(post.title || '')}</h2>

      <div class="post-detail-meta">
        <div class="post-detail-meta-left">
          <div class="post-detail-author-img">
            <img src="${post.author_profile_image || DEFAULT_PROFILE_IMAGE}" alt="작성자 프로필" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
          </div>
          <div class="post-detail-meta-text">
            <span class="post-detail-author-name">
              ${escapeHtml(post.author_nickname ?? '작성자')}
            </span>
            <span class="post-detail-date">
              ${escapeHtml(String(post.created_at ?? ''))}
            </span>
          </div>
        </div>

        <div class="detail-action-group">
          ${
            post.isMine
              ? `
          <button type="button" class="detail-action-btn" id="post-edit-btn">수정</button>
          <button type="button" class="detail-action-btn" id="post-delete-btn">삭제</button>
          `
              : ''
          }
        </div>
      </div>

      <div class="divider"></div>

      ${fileBlock}

      <p class="post-detail-content">
        ${escapeHtml(String(post.content || '내용이 없습니다.').trim())}
      </p>

      <div class="post-detail-stats">
        <div class="post-detail-stat-box" id="like-stat-box">
          <span class="post-detail-stat-count" id="like-count">${post.likes ?? 0}</span>
          <span class="post-detail-stat-label">좋아요수</span>
        </div>
        <div class="post-detail-stat-box">
          <span class="post-detail-stat-count" id="view-count">${post.views ?? 0}</span>
          <span class="post-detail-stat-label">조회수</span>
        </div>
        <div class="post-detail-stat-box">
          <span class="post-detail-stat-count">${post.commentCount ?? commentTotalCount}</span>
          <span class="post-detail-stat-label">댓글</span>
        </div>
      </div>

      <div class="divider"></div>

      <span class="helper-text" id="post-detail-message"></span>

      <!-- 댓글 입력 -->
      <section class="comment-write-box">
        <form id="comment-form" class="comment-form" novalidate>
          <textarea
            id="comment-content"
            class="form-input comment-textarea"
            placeholder="댓글을 남겨주세요!"
          ></textarea>
          <div class="comment-write-box-divider"></div>
          <button type="submit" class="btn btn-submit">댓글 등록</button>
        </form>
      </section>

      <!-- 댓글 리스트 -->
      <section class="comment-list" id="comment-list">
        ${comments
          .map(
            (c) => `
          <article class="comment-item" data-comment-id="${c.id}">
            <div class="comment-avatar">
              <img src="${c.author_profile_image || DEFAULT_PROFILE_IMAGE}" alt="댓글 작성자 프로필" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <div class="comment-header-left">
                  <span class="comment-author-name">${escapeHtml(c.author_nickname ?? '')}</span>
                  <span class="comment-date">${escapeHtml(String(c.created_at ?? ''))}</span>
                </div>
                ${
                  c.isMine
                    ? `
                <div class="detail-action-group">
                  <button type="button" class="detail-action-btn comment-edit-btn" data-comment-id="${c.id}">
                    수정
                  </button>
                  <button
                    type="button"
                    class="detail-action-btn comment-delete-btn"
                    data-comment-id="${c.id}"
                  >
                    삭제
                  </button>
                </div>
                `
                    : ''
                }
              </div>
              <p class="comment-content">${escapeHtml(c.content ?? '')}</p>
            </div>
          </article>
        `,
          )
          .join('')}
      </section>
      ${
        commentTotalPages > 1
          ? `
      <nav class="comment-pagination" id="comment-pagination" aria-label="댓글 페이지">
        <ul class="comment-pagination-list">
          ${Array.from({ length: commentTotalPages }, (_, i) => i + 1)
            .map(
              (p) => `
            <li>
              <button type="button" class="comment-page-btn ${p === commentCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button>
            </li>
          `,
            )
            .join('')}
        </ul>
      </nav>
      `
          : ''
      }
    </section>
  `;

  attachPostBodyEvents(postId, commentTotalPages, commentTotalCount);
}

/* =========================
   상세 화면 내부 이벤트 (핸들러 분리)
   ========================= */

async function onCommentPageClick(e, postId) {
  const btn = e.target.closest('.comment-page-btn');
  if (!btn || btn.classList.contains('active')) return;
  const page = parseInt(btn.dataset.page, 10);
  if (!page) return;
  await loadCommentsPage(postId, page);
}

async function onLikeClick(postId) {
  clearErrors();
  if (!getUser()) {
    showFieldError('post-detail-message', getApiErrorMessage('UNAUTHORIZED', '로그인이 필요합니다.'));
    navigateTo('/login');
    return;
  }
  const likeCountEl = document.getElementById('like-count');
  if (!likeCountEl) return;
  try {
    const response = await api.post(`/posts/${postId}/likes`, undefined);
    if (response.code === 'ALREADY_LIKED') {
      // 이미 좋아요한 상태에서 클릭 → 취소(토글)
      const delResponse = await api.delete(`/posts/${postId}/likes`);
      if (delResponse.data && delResponse.data.likeCount !== undefined) {
        likeCountEl.textContent = delResponse.data.likeCount;
      }
      return;
    }
    if (response.data && response.data.likeCount !== undefined) {
      likeCountEl.textContent = response.data.likeCount;
    }
  } catch (err) {
    console.error('좋아요 처리 실패:', err);
    showFieldError('post-detail-message', getApiErrorMessage(err?.code || err?.message, '좋아요 처리에 실패했습니다. 로그인 상태를 확인한 뒤 다시 시도해주세요.'));
  }
}

async function onCommentFormSubmit(e, postId) {
  e.preventDefault();
  clearErrors();
  if (!getUser()) {
    showFieldError('post-detail-message', getApiErrorMessage('UNAUTHORIZED', '로그인이 필요합니다.'));
    navigateTo('/login');
    return;
  }
  const commentForm = document.getElementById('comment-form');
  const textarea = document.getElementById('comment-content');
  const content = (textarea?.value ?? '').trim();
  if (!content) {
    showFieldError('post-detail-message', '댓글 내용을 입력해주세요.');
    return;
  }

  const submitBtn = commentForm?.querySelector('.btn-submit');
  const orig = submitBtn?.textContent;
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '등록 중...';
    }
    await api.post(`/posts/${postId}/comments`, { content });
    if (textarea) textarea.value = '';
    // 전체 상세 재로드 없이 댓글 목록만 1페이지로 갱신 + 댓글 수 반영
    const statBoxes = document.querySelectorAll('.post-detail-stat-box');
    const commentCountEl = statBoxes[2]?.querySelector('.post-detail-stat-count');
    if (commentCountEl) {
      const n = parseInt(commentCountEl.textContent, 10) || 0;
      commentCountEl.textContent = n + 1;
    }
    await loadCommentsPage(postId, 1);
  } catch (err) {
    showFieldError('post-detail-message', getApiErrorMessage(err?.code || err?.message, '댓글 등록에 실패했습니다. 로그인 상태와 댓글 내용을 확인한 뒤 다시 시도해주세요.'));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  }
}

function onCommentListClick(e, postId, commentDeleteModal) {
  const deleteBtn = e.target.closest('.comment-delete-btn');
  if (deleteBtn) {
    currentCommentIdForDelete = deleteBtn.dataset.commentId;
    openModal(commentDeleteModal);
    return;
  }

  const editBtn = e.target.closest('.comment-edit-btn');
  if (editBtn) {
    const commentId = editBtn.dataset.commentId;
    const commentItem = editBtn.closest('.comment-item');
    if (!commentItem) return;
    const existingForm = commentItem.querySelector('.comment-edit-form');
    if (existingForm) return;

    const contentEl = commentItem.querySelector('.comment-content');
    if (!contentEl) return;
    const content = contentEl.textContent.trim();
    contentEl.style.display = 'none';
    const editForm = document.createElement('form');
    editForm.className = 'comment-edit-form';
    editForm.dataset.commentId = commentId;
    editForm.innerHTML = `
      <textarea class="comment-edit-textarea" aria-label="댓글 수정">${escapeHtml(content)}</textarea>
      <div class="detail-action-group">
        <button type="submit" class="detail-action-btn">저장</button>
        <button type="button" class="detail-action-btn comment-edit-cancel-btn" data-comment-id="${commentId}">취소</button>
      </div>
    `;
    contentEl.parentNode.insertBefore(editForm, contentEl.nextSibling);
    editForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const editTextarea = editForm.querySelector('.comment-edit-textarea');
      const newContent = (editTextarea?.value ?? '').trim();
      if (!newContent) {
        showFieldError('post-detail-message', '댓글 내용을 입력해주세요.');
        return;
      }
      try {
        await api.patch(`/posts/${postId}/comments/${commentId}`, { content: newContent });
        editForm.remove();
        contentEl.textContent = newContent;
        contentEl.style.display = '';
      } catch (err) {
        showFieldError('post-detail-message', getApiErrorMessage(err?.code || err?.message, '댓글 수정에 실패했습니다. 본인 댓글인지와 내용을 확인한 뒤 다시 시도해주세요.'));
      }
    });
    editForm.querySelector('.comment-edit-cancel-btn')?.addEventListener('click', () => {
      editForm.remove();
      contentEl.style.display = '';
    });
    return;
  }

  const cancelBtn = e.target.closest('.comment-edit-cancel-btn');
  if (cancelBtn) {
    const form = cancelBtn.closest('.comment-edit-form');
    const commentItem = form?.closest('.comment-item');
    if (commentItem) {
      const contentEl = commentItem.querySelector('.comment-content');
      if (contentEl) contentEl.style.display = '';
      form?.remove();
    }
  }
}

function attachPostBodyEvents(postId, commentTotalPages = 1, commentTotalCount = 0) {
  const postEditBtn = document.getElementById('post-edit-btn');
  const postDeleteBtn = document.getElementById('post-delete-btn');
  const postDeleteModal = document.getElementById('post-delete-modal');
  const commentForm = document.getElementById('comment-form');
  const commentList = document.getElementById('comment-list');
  const commentDeleteModal = document.getElementById('comment-delete-modal');
  const likeStatBox = document.getElementById('like-stat-box');
  const commentPagination = document.getElementById('comment-pagination');

  if (commentPagination && postId && commentTotalPages > 1) {
    commentPagination.addEventListener('click', (e) => onCommentPageClick(e, postId));
  }

  if (postEditBtn && postId) {
    postEditBtn.addEventListener('click', () => navigateTo(`/posts/${postId}/edit`));
  }

  if (postDeleteBtn && postDeleteModal) {
    postDeleteBtn.addEventListener('click', () => openModal(postDeleteModal));
  }

  if (likeStatBox && postId) {
    likeStatBox.style.cursor = 'pointer';
    likeStatBox.addEventListener('click', () => onLikeClick(postId));
  }

  if (commentForm && postId) {
    commentForm.addEventListener('submit', (e) => onCommentFormSubmit(e, postId));
  }

  if (commentList && postId && commentDeleteModal) {
    commentList.addEventListener('click', (e) => onCommentListClick(e, postId, commentDeleteModal));
  }
}
