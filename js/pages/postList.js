/**
 * 게시글 목록 조회 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderPostCard } from '../components/postCard.js';

/**
 * 게시글 목록 렌더링
 */
export async function renderPostList() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader()}

    <main class="main">
      <div class="post-list-container">
        
        <p class="post-list-greeting">
          안녕하세요,<br />
          아무 말 대잔치 <strong>게시판</strong> 입니다.
        </p>

        <button class="btn btn-submit" id="btn-submit">
          게시글 작성
        </button>

        <div class="post-card-list" id="post-card-list"></div>

      </div>
    </main>
  `;

  initHeaderEvents();
  await loadPostList();
  attachPostListEvents();
}

/**
 * 게시글 목록 불러오기
 */
async function loadPostList() {
  const listContainer = document.getElementById('post-card-list');

  try {
    // API 호출
    const response = await api.get('/posts');

    // API 응답 구조: { code: "POSTS_RETRIEVED", data: [...] } 또는 배열
    const postsData = response.data || response;
    const posts = Array.isArray(postsData) ? postsData : [];

    // 게시글이 있으면 버튼 오른쪽으로
    if (posts.length > 0) {
      const createBtn = document.getElementById('btn-submit');
      if (createBtn) {
        createBtn.classList.add('right');
      }
    }

    if (!posts || posts.length === 0) {
      listContainer.innerHTML = `
        <p class="post-list-message">게시글이 없습니다.</p>`;
      return;
    }

    // postCard 컴포넌트 사용
    listContainer.innerHTML = posts
      .map((post) => renderPostCard(post))
      .join('');
  } catch (e) {
    console.error('게시글 조회 실패:', e);
    listContainer.innerHTML = `
      <p class="post-list-message">게시글을 불러올 수 없습니다.</p>`;
  }
}

/**
 * 게시글 목록 이벤트 등록
 */
function attachPostListEvents() {
  const createBtn = document.getElementById('btn-submit');
  const listContainer = document.getElementById('post-card-list');

  /** 게시글 작성 페이지 이동 */
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      navigateTo('/posts/new');
    });
  }

  /** 게시물 상세 이동 */
  if (listContainer) {
    listContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.post-card');
      if (!card) return;

      const postId = card.dataset.id;
      if (postId) {
        navigateTo(`/posts/${postId}`);
      }
    });
  }
}
