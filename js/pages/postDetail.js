/**
 * 게시글 상세 조회 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { DEFAULT_PROFILE_IMAGE } from '../constants.js';

/** 해시(#/posts/123)에서 postId 추출 */
function getPostIdFromHash() {
  const hash = window.location.hash.slice(1) || '';
  const parts = hash.split('/');
  if (parts[1] === 'posts' && parts[2]) return parts[2];
  return null;
}

/**
 * 게시글 상세 페이지 렌더링
 * router에서 postId를 인자로 주든, hash에서 파싱하든 둘 다 커버
 */
export async function renderPostDetail(param) {
  const root = document.getElementById('app-root');

  let postId = null;
  if (typeof param === 'string' || typeof param === 'number') {
    postId = String(param);
  } else if (param && typeof param === 'object') {
    postId = param.id ?? param.postId ?? null;
    if (postId) postId = String(postId);
  }
  if (!postId) postId = getPostIdFromHash();

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
      await api.delete(`/comments/${currentCommentIdForDelete}`);
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

// 개발 모드: API 실패 시 더미 데이터 표시 여부 (배포 시 false로 변경)
const DEV_MODE_DUMMY = false;

async function loadPostDetail(postId) {
  const card = document.getElementById('post-detail-card');
  if (!card) return;
  if (!postId) {
    card.innerHTML =
      '<p class="post-list-message">유효하지 않은 게시글입니다.</p>';
    return;
  }

  card.innerHTML =
    '<div style="text-align:center;padding:40px;">게시글을 불러오는 중...</div>';

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

    // 개발 모드에서는 더미 데이터 표시
    if (DEV_MODE_DUMMY) {
      console.warn('개발 모드: 더미 데이터를 표시합니다.');
      const dummyPost = {
        id: postId,
        title: `게시글 제목 ${postId}`,
        author_nickname: '작성자',
        author_profile_image: null,
        created_at: new Date().toLocaleString('ko-KR'),
        image_url: null,
        content:
          '게시글 내용입니다. API 서버가 실행되지 않아 더미 데이터를 표시하고 있습니다. 이 내용은 실제 게시글 내용이 표시되어야 하는 부분입니다.',
        likes: 0,
        views: 1,
        isMine: true,
      };
      const dummyComments = [
        {
          id: 1,
          author_nickname: '댓글 작성자 1',
          author_profile_image: null,
          created_at: new Date().toLocaleString('ko-KR'),
          content:
            '첫 번째 댓글입니다. 댓글 기능이 잘 작동하는지 확인할 수 있습니다.',
          isMine: true,
        },
        {
          id: 2,
          author_nickname: '댓글 작성자 2',
          author_profile_image: null,
          created_at: new Date().toLocaleString('ko-KR'),
          content:
            '두 번째 댓글입니다. 수정과 삭제 버튼이 보이는 댓글입니다.',
          isMine: true,
        },
      ];
      renderPostDetailCard(dummyPost, dummyComments, postId);
    } else {
      card.innerHTML = `
        <div style="text-align:center;padding:40px;">
          <p class="post-list-message">게시글을 불러올 수 없습니다.</p>
          <p style="color:#777;font-size:12px;margin-top:8px;">${error.message || '서버 오류가 발생했습니다.'}</p>
          <button onclick="window.location.hash='#/posts'" style="margin-top:16px;padding:8px 16px;background:#aca0eb;color:white;border:none;border-radius:6px;cursor:pointer;">목록으로 돌아가기</button>
        </div>
      `;
    }
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
      <h2 class="post-detail-title">${post.title}</h2>

      <div class="post-detail-meta">
        <div class="post-detail-meta-left">
          <div class="post-detail-author-img">
            <img src="${post.author_profile_image || DEFAULT_PROFILE_IMAGE}" alt="작성자 프로필" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
          </div>
          <div class="post-detail-meta-text">
            <span class="post-detail-author-name">
              ${post.author_nickname ?? '작성자'}
            </span>
            <span class="post-detail-date">
              ${post.created_at ?? ''}
            </span>
          </div>
        </div>

        <div class="post-detail-meta-actions">
          ${
            post.isMine
              ? `
          <button type="button" class="post-detail-action-btn" id="post-edit-btn">
            수정
          </button>
          <button type="button" class="post-detail-action-btn" id="post-delete-btn">
            삭제
          </button>
          `
              : ''
          }
        </div>
      </div>

      <div class="post-detail-divider"></div>

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
        ${post.content || '내용이 없습니다.'}
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

      <div class="comment-divider"></div>

      <!-- 댓글 입력 -->
      <section class="comment-write-box">
        <form id="comment-form" class="comment-form">
          <textarea
            id="comment-content"
            class="form-input comment-textarea"
            placeholder="댓글을 남겨주세요!"
          ></textarea>
          <div class="comment-write-box-divider"></div>
          <button type="submit" class="btn btn-submit">
            댓글 등록
          </button>
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
                  <span class="comment-author-name">${c.author_nickname}</span>
                  <span class="comment-date">${c.created_at}</span>
                </div>
                ${
                  c.isMine
                    ? `
                <div class="comment-header-actions">
                  <button type="button" class="comment-action-btn comment-edit-btn" data-comment-id="${c.id}">
                    수정
                  </button>
                  <button
                    type="button"
                    class="comment-action-btn comment-delete-btn"
                    data-comment-id="${c.id}"
                  >
                    삭제
                  </button>
                </div>
                `
                    : ''
                }
              </div>
              ${
                c.isEditing
                  ? `
              <form class="comment-edit-form" data-comment-id="${c.id}">
                <textarea class="comment-edit-textarea" style="width:100%;min-height:60px;padding:8px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;resize:none;">${c.content}</textarea>
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button type="submit" class="comment-action-btn" style="border:1px solid var(--primary);">저장</button>
                  <button type="button" class="comment-action-btn comment-edit-cancel-btn" data-comment-id="${c.id}" style="border:1px solid var(--primary);">취소</button>
                </div>
              </form>
              `
                  : `<p class="comment-content">${c.content}</p>`
              }
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
        const contentEl = commentItem.querySelector('.comment-content');
        if (!contentEl) return;
        const content = contentEl.textContent.trim();
        contentEl.style.display = 'none';
        const editForm = document.createElement('form');
        editForm.className = 'comment-edit-form';
        editForm.dataset.commentId = commentId;
        editForm.innerHTML = `
          <textarea class="comment-edit-textarea" style="width:100%;min-height:60px;padding:8px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;resize:none;">${content}</textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button type="submit" class="comment-action-btn" style="border:1px solid var(--primary);">저장</button>
            <button type="button" class="comment-action-btn comment-edit-cancel-btn" data-comment-id="${commentId}" style="border:1px solid var(--primary);">취소</button>
          </div>
        `;
        contentEl.parentNode.insertBefore(editForm, contentEl.nextSibling);
        editForm.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const textarea = editForm.querySelector('.comment-edit-textarea');
          const newContent = textarea.value.trim();
          if (!newContent) return;
          try {
            await api.put(`/comments/${commentId}`, { content: newContent });
            await loadPostDetail(postId);
          } catch (err) {
            alert(err.message || '댓글 수정에 실패했습니다.');
          }
        });
        editForm
          .querySelector('.comment-edit-cancel-btn')
          .addEventListener('click', () => {
            editForm.remove();
            contentEl.style.display = 'block';
          });
        return;
      }

      const cancelBtn = e.target.closest('.comment-edit-cancel-btn');
      if (cancelBtn) {
        const form = cancelBtn.closest('.comment-edit-form');
        const commentItem = form?.closest('.comment-item');
        if (commentItem) {
          const contentEl = commentItem.querySelector('.comment-content');
          if (contentEl) contentEl.style.display = 'block';
          form?.remove();
        }
      }
    });
  }
}
