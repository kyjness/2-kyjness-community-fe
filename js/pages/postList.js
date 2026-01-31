/**
 * 게시글 목록 조회 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderPostCard } from '../components/postCard.js';
import { DEV_MODE } from '../constants.js';

// 개발 모드: 목록 없음/API 실패 시 더미 게시글 표시 (postDetail과 동일하게)
const DEV_MODE_DUMMY = DEV_MODE;

// 페이지네이션 상태 관리
let currentPage = 1;
let isLoading = false;
let hasMore = true;
const PAGE_SIZE = 10; // 한 번에 불러올 게시글 수

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

        <button class="btn btn-submit" id="btn-submit" style="display: none;" aria-hidden="true">
          게시글 작성
        </button>

        <div class="post-card-list" id="post-card-list"></div>
        <div id="loading-indicator" style="text-align: center; padding: 20px; display: none;">
          게시글을 불러오는 중...
        </div>

      </div>
    </main>
  `;

  // 상태 초기화
  currentPage = 1;
  isLoading = false;
  hasMore = true;

  initHeaderEvents();
  await loadPostList();
  attachPostListEvents();
  attachScrollListener();
}

/**
 * 게시글 목록 불러오기 (페이지네이션 지원)
 */
async function loadPostList() {
  if (isLoading || !hasMore) return;

  const listContainer = document.getElementById('post-card-list');
  const loadingIndicator = document.getElementById('loading-indicator');

  if (!listContainer) return;

  isLoading = true;
  if (currentPage > 1 && loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  let posts = [];
  let fetchFailed = false;
  try {
    const response = await api.get(`/posts?page=${currentPage}&size=${PAGE_SIZE}`);
    const postsData = response.data || response;
    posts = Array.isArray(postsData) ? postsData : [];
  } catch (e) {
    console.error('게시글 조회 실패:', e);
    fetchFailed = true;
  }

  isLoading = false;
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }

  // 첫 페이지인데 목록 비었거나 API 실패 → postDetail처럼 한 군데에서만 처리
  if (currentPage === 1 && (posts.length === 0 || fetchFailed)) {
    hasMore = false;
    const createBtn = document.getElementById('btn-submit');
    if (createBtn) {
      createBtn.style.display = '';
      createBtn.removeAttribute('aria-hidden');
      createBtn.classList.remove('right');
    }
    if (DEV_MODE_DUMMY) {
      console.warn('개발 모드: 더미 게시글 목록을 표시합니다.');
      const dummyPosts = [
        {
          postId: 1,
          title: '첫 번째 예시 게시글',
          likeCount: 3,
          commentCount: 2,
          hits: 15,
          createdAt: new Date().toISOString(),
          author: { nickname: '예시작성자1', profileImageUrl: null },
        },
        {
          postId: 2,
          title: '두 번째 예시 게시글',
          likeCount: 0,
          commentCount: 1,
          hits: 5,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          author: { nickname: '예시작성자2', profileImageUrl: null },
        },
      ];
      const sortedDummy = [...dummyPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      listContainer.innerHTML = sortedDummy.map(post => renderPostCard(post)).join('');
      if (createBtn) createBtn.classList.add('right');
    } else {
      listContainer.innerHTML =
        fetchFailed
          ? `<p class="post-list-message">게시글을 불러올 수 없습니다.</p>`
          : `<p class="post-list-message">게시글이 없습니다.</p>`;
    }
    return;
  }

  if (posts.length > 0) {
    const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const postsHTML = sorted.map(post => renderPostCard(post)).join('');
    if (currentPage === 1) {
      listContainer.innerHTML = postsHTML;
      const createBtn = document.getElementById('btn-submit');
      if (createBtn) {
        createBtn.style.display = '';
        createBtn.removeAttribute('aria-hidden');
        createBtn.classList.add('right');
      }
    } else {
      listContainer.insertAdjacentHTML('beforeend', postsHTML);
    }
    currentPage++;
    if (posts.length < PAGE_SIZE) {
      hasMore = false;
    }
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

/** 무한 스크롤용 스크롤 리스너는 한 번만 등록 (목록 재진입 시 중복 방지) */
let scrollListenerAttached = false;

/**
 * 스크롤 이벤트 리스너 등록 (무한 스크롤)
 */
function attachScrollListener() {
  if (scrollListenerAttached) return;
  scrollListenerAttached = true;
  window.addEventListener('scroll', () => {
    const listContainer = document.getElementById('post-card-list');
    if (!listContainer) return; // 목록 페이지가 아니면 무시
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadPostList();
    }
  });
}
