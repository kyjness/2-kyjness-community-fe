/**
 * 게시글 상세 조회 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { escapeHtml } from '../utils.js';
import { DEFAULT_PROFILE_IMAGE, DEV_MODE } from '../constants.js';

const LOADING_MSG = '<div style="text-align:center;padding:40px;">게시글을 불러오는 중...</div>';

/** 목록 페이지 예시 게시글과 동일한 ID일 때 사용할 상세 더미 (목록에서 클릭 시 상세 연결용) */
const DUMMY_POST_DETAIL = {
  '1': {
    post: {
      id: '1',
      title: '첫 번째 예시 게시글',
      content: '첫 번째 예시 게시글의 본문 내용입니다. 목록에서 이 카드를 눌렀을 때 보이는 상세 페이지입니다.',
      author_nickname: '예시작성자1',
      author_profile_image: null,
      created_at: new Date().toLocaleString('ko-KR'),
      image_url: null,
      likes: 3,
      views: 15,
      isMine: true,
    },
    comments: [
      { id: 101, author_nickname: '댓글작성자A', author_profile_image: null, created_at: new Date().toLocaleString('ko-KR'), content: '첫 번째 게시글에 대한 댓글입니다.', isMine: true },
      { id: 102, author_nickname: '댓글작성자B', author_profile_image: null, created_at: new Date().toLocaleString('ko-KR'), content: '예시 댓글 하나 더 있어요.', isMine: true },
    ],
  },
  '2': {
    post: {
      id: '2',
      title: '두 번째 예시 게시글',
      content: '두 번째 예시 게시글의 본문입니다. 이 역시 목록의 예시 카드를 눌렀을 때 보이는 상세입니다.',
      author_nickname: '예시작성자2',
      author_profile_image: null,
      created_at: new Date(Date.now() - 86400000).toLocaleString('ko-KR'),
      image_url: null,
      likes: 0,
      views: 5,
      isMine: true,
    },
    comments: [
      { id: 201, author_nickname: '댓글작성자C', author_profile_image: null, created_at: new Date(Date.now() - 3600000).toLocaleString('ko-KR'), content: '두 번째 게시글 댓글입니다.', isMine: true },
    ],
  },
};

/** 라우터 인자 또는 해시(#/posts/123)에서 postId 추출 */
function resolvePostId(param) {
  if (typeof param === 'string' || typeof param === 'number') return String(param);
  if (param && typeof param === 'object') {
    const id = param.id ?? param.postId ?? null;
    return id ? String(id) : null;
  }
  const hash = (window.location.hash || '').slice(1);
  const parts = hash.split('/');
  return parts[1] === 'posts' && parts[2] ? parts[2] : null;
}

/**
 * 게시글 상세 페이지 렌더링
 */
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
    await loadPostDetail(postId);
  } else {
    const card = document.getElementById('post-detail-card');
    if (card)
      card.innerHTML =
        '<p class="post-list-message">유효하지 않은 게시글입니다.</p>';
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
      alert('게시글이 삭제되었습니다.');
      navigateTo('/posts');
    } catch (error) {
      alert(error.message || '게시글 삭제에 실패했습니다.');
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

    try {
      await api.delete(`/posts/${postId}/comments/${currentCommentIdForDelete}`);
      currentCommentIdForDelete = null;
      closeModal(commentDeleteModal);
      await loadPostDetail(postId); // 다시 로드
    } catch (error) {
      alert(error.message || '댓글 삭제에 실패했습니다.');
    }
  });

  commentDeleteModal.addEventListener('click', (e) => {
    if (e.target === commentDeleteModal) {
      currentCommentIdForDelete = null;
      closeModal(commentDeleteModal);
    }
  });
}

/* 모달 열기/닫기 – editProfile.js와 동일 패턴 */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('visible');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('visible');
}

/* =========================
   게시글 상세 데이터 로딩
   ========================= */


async function loadPostDetail(postId) {
  const card = document.getElementById('post-detail-card');
  if (!card) return;
  if (!postId) {
    card.innerHTML =
      '<p class="post-list-message">유효하지 않은 게시글입니다.</p>';
    return;
  }

  card.innerHTML = LOADING_MSG;

  try {
    // 게시글 상세 조회 (백엔드에서 조회수 자동 증가)
    const response = await api.get(`/posts/${postId}`);

    // API 응답 구조: { code: "POST_RETRIEVED", data: {...} }
    const postData = response.data || response;

    // 백엔드 필드명을 프론트엔드 필드명으로 변환
    const normalizedPost = {
      id: postData.postId,
      title: postData.title || '',
      content: postData.content || '',
      author_nickname: postData.author?.nickname || '',
      author_profile_image:
        postData.author?.profileImageUrl ||
        postData.author?.profileImage ||
        DEFAULT_PROFILE_IMAGE,
      created_at: postData.createdAt || '',
      image_url: postData.file?.fileUrl || postData.file?.url || null,
      likes: postData.likeCount || 0,
      views: postData.hits || 0,
      isMine: postData.isMine || false,
    };

    // 댓글 목록 조회
    let comments = [];
    try {
      const commentsResponse = await api.get(`/posts/${postId}/comments`);
      const commentsData = commentsResponse.data || commentsResponse;
      comments = (Array.isArray(commentsData) ? commentsData : []).map(
        (c) => ({
          id: c.commentId,
          author_nickname: c.author?.nickname || '',
          author_profile_image:
            c.author?.profileImageUrl || c.author?.profileImage || null,
          created_at: c.createdAt || '',
          content: c.content || '',
          isMine: c.isMine || false,
        }),
      );
    } catch (commentError) {
      console.warn('댓글 조회 실패:', commentError);
    }

    renderPostDetailCard(normalizedPost, comments, postId);
  } catch (error) {
    console.error('게시글 상세 조회 실패:', error);
    const id = String(postId);
    if (DEV_MODE && DUMMY_POST_DETAIL[id]) {
      const { post, comments } = DUMMY_POST_DETAIL[id];
      renderPostDetailCard(post, comments, id);
      return;
    }
    card.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <p class="post-list-message">게시글을 불러올 수 없습니다.</p>
        <p style="color:#777;font-size:12px;margin-top:8px;">${error.message || '서버 오류가 발생했습니다.'}</p>
        <button type="button" id="post-detail-back-to-list" style="margin-top:16px;padding:8px 16px;background:#aca0eb;color:white;border:none;border-radius:6px;cursor:pointer;">목록으로 돌아가기</button>
      </div>
    `;
    const backBtn = document.getElementById('post-detail-back-to-list');
    if (backBtn) backBtn.addEventListener('click', () => navigateTo('/posts'));
  }
}

/**
 * 실제 DOM 렌더링 (성공이든 더미든 공통). postId로 수정/댓글 등 동작.
 */
function renderPostDetailCard(post, comments, postId) {
  const card = document.getElementById('post-detail-card');
  if (!card) return;

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

      ${
        post.image_url
          ? `
      <div class="post-detail-image-wrapper">
        <img src="${post.image_url}" alt="게시글 이미지" class="post-detail-image" />
      </div>
      `
          : ''
      }

      <p class="post-detail-content">
        ${escapeHtml(post.content || '내용이 없습니다.')}
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
          <span class="post-detail-stat-count">${comments.length}</span>
          <span class="post-detail-stat-label">댓글</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 댓글 입력 -->
      <section class="comment-write-box">
        <form id="comment-form" class="comment-form">
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
    </section>
  `;

  attachPostBodyEvents(postId);
}

/* =========================
   상세 화면 내부 이벤트
   ========================= */

function attachPostBodyEvents(postId) {
  const postEditBtn = document.getElementById('post-edit-btn');
  const postDeleteBtn = document.getElementById('post-delete-btn');
  const postDeleteModal = document.getElementById('post-delete-modal');
  const commentForm = document.getElementById('comment-form');
  const commentList = document.getElementById('comment-list');
  const commentDeleteModal = document.getElementById('comment-delete-modal');
  const likeStatBox = document.getElementById('like-stat-box');

  if (postEditBtn && postId) {
    postEditBtn.addEventListener('click', () =>
      navigateTo(`/posts/${postId}/edit`),
    );
  }

  if (postDeleteBtn) {
    postDeleteBtn.addEventListener('click', () => openModal(postDeleteModal));
  }

  // 좋아요 기능
  if (likeStatBox) {
    likeStatBox.style.cursor = 'pointer';
    likeStatBox.addEventListener('click', async () => {
      const likeCountEl = document.getElementById('like-count');
      if (!likeCountEl) return;
      try {
        // 백엔드 API는 /posts/{post_id}/likes (복수형)
        const response = await api.post(`/posts/${postId}/likes`);
        // 서버에서 반환하는 실제 좋아요 수 사용
        if (response.data && response.data.likeCount !== undefined) {
          likeCountEl.textContent = response.data.likeCount;
        }
      } catch (err) {
        console.error('좋아요 실패:', err);
        // 이미 좋아요를 눌렀다면 취소 시도
        try {
          await api.delete(`/posts/${postId}/likes`);
          // 좋아요 취소 후 게시글 다시 로드하여 정확한 수치 반영
          await loadPostDetail(postId);
        } catch (deleteErr) {
          console.error('좋아요 취소 실패:', deleteErr);
          alert(err.message || '좋아요 처리에 실패했습니다.');
        }
      }
    });
  }

  if (commentForm && postId) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = document.getElementById('comment-content');
      const content = textarea.value.trim();
      if (!content) return;

      const submitBtn = commentForm.querySelector('.btn-submit');
      const orig = submitBtn.textContent;
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = '등록 중...';
        await api.post(`/posts/${postId}/comments`, { content });
        textarea.value = '';
        // 댓글 등록 후 전체 페이지 다시 로드
        await loadPostDetail(postId);
      } catch (err) {
        alert(err.message || '댓글 등록에 실패했습니다.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = orig;
      }
    });
  }

  if (commentList) {
    commentList.addEventListener('click', async (e) => {
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
        
        // 이미 수정 폼이 있는지 확인
        const existingForm = commentItem.querySelector('.comment-edit-form');
        if (existingForm) {
          // 이미 수정 모드면 아무 동작 안 함
          return;
        }
        
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
          const textarea = editForm.querySelector('.comment-edit-textarea');
          const newContent = (textarea?.value ?? '').trim();
          if (!newContent) return;
          try {
            await api.patch(`/posts/${postId}/comments/${commentId}`, { content: newContent });
            await loadPostDetail(postId);
          } catch (err) {
            alert(err.message || '댓글 수정에 실패했습니다.');
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
    });
  }
}
