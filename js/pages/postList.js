/**
 * 게시글 목록 조회 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderPostCard } from '../components/postCard.js';
import { DEV_MODE } from '../constants.js';

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

        <button class="btn btn-submit" id="btn-submit">
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

  // 첫 페이지가 아니면 로딩 인디케이터 표시
  if (currentPage > 1 && loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  try {
    // API 호출 (페이지네이션 파라미터 추가)
    const response = await api.get(`/posts?page=${currentPage}&size=${PAGE_SIZE}`);

    // API 응답 구조: { code: "POSTS_RETRIEVED", data: [...] } 또는 배열
    const postsData = response.data || response;
    const posts = Array.isArray(postsData) ? postsData : [];

    // 더 이상 불러올 게시글이 없으면
    if (posts.length === 0) {
      hasMore = false;
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      // 첫 페이지에서 게시글이 없을 때만
      if (currentPage === 1) {
        // 개발 모드에서만: 게시물이 없으면 더미 데이터로 상세 페이지 테스트
        if (DEV_MODE) {
          const testPostId = 1;
          console.log('게시물이 없어서 테스트 게시물 상세 페이지로 이동합니다...');
          navigateTo(`/posts/${testPostId}`);
          return;
        }
        listContainer.innerHTML = `
          <p class="post-list-message">게시글이 없습니다.</p>`;
      }
      isLoading = false;
      return;
    }

    // 게시글이 있으면 버튼 오른쪽으로 (첫 페이지일 때만)
    if (currentPage === 1 && posts.length > 0) {
      const createBtn = document.getElementById('btn-submit');
      if (createBtn) {
        createBtn.classList.add('right');
      }
    }

    // postCard 컴포넌트 사용
    const postsHTML = posts.map(post => renderPostCard(post)).join('');

    // 첫 페이지면 교체, 아니면 추가
    if (currentPage === 1) {
      listContainer.innerHTML = postsHTML;
    } else {
      listContainer.insertAdjacentHTML('beforeend', postsHTML);
    }

    // 다음 페이지로
    currentPage++;

    // 불러온 게시글이 페이지 크기보다 작으면 더 이상 없음
    if (posts.length < PAGE_SIZE) {
      hasMore = false;
    }
  } catch (e) {
    console.error('게시글 조회 실패:', e);
    if (currentPage === 1) {
      listContainer.innerHTML = `
        <p class="post-list-message">게시글을 불러올 수 없습니다.</p>`;
    }
  } finally {
    isLoading = false;
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
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

/**
 * 스크롤 이벤트 리스너 등록 (무한 스크롤)
 */
function attachScrollListener() {
  window.addEventListener('scroll', () => {
    // 스크롤이 페이지 하단 근처에 도달했는지 확인
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 하단 200px 전에 도달하면 다음 페이지 로드
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadPostList();
    }
  });
}
