/**
 * 게시글 목록 조회 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { getUser, clearUser } from '../state.js';

/**
 * 게시글 목록 렌더링
 */
export async function renderPostList() {
  const root = document.getElementById('app-root');
  const user = getUser(); // 로그인한 사용자 정보

  root.innerHTML = `
    <header class="header">
      <h1 class="header-title">
        <span id="header-title-link">아무 말 대잔치</span>
      </h1>

      <!-- 🔥 헤더 오른쪽 프로필 -->
      <div class="header-profile-wrapper" id="header-profile-btn">
        <div class="profile-avatar">
          <img 
            src="${user?.profileImage || './imt.png'}" 
            class="profile-avatar-img"
          />
        </div>
      </div>

      <!-- 🔥 드롭다운 -->
      <div class="profile-dropdown" id="profile-dropdown">
        <button id="go-mypage">회원정보수정</button>
        <button id="go-password">비밀번호수정</button>
        <button id="logout-btn">로그아웃</button>
      </div>

      <div class="header-divider"></div>
    </header>

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

  loadPostList();
  attachPostListEvents();
}

/**
 * 게시글 목록 불러오기
 */
async function loadPostList() {
  const container = document.querySelector('.post-list-container');
  const listContainer = document.getElementById('post-card-list');

  try {
    // 실제 API 호출
    // const response = await api.get('/posts');
    const response = {
      data: [
        {
          postId: 1,
          title: '게시글 1',
          createdAt: '2026-01-26',
          likeCount: 10,
          commentCount: 5,
          hits: 100,
          author: {
            nickname: '작성자1',
            profileImageUrl: 'https://example.com/profile.jpg'
          }
        }
      ]
    };
    
    // API 응답 구조: { code: "POSTS_RETRIEVED", data: [...] }
    const postsData = response.data || response;
    const posts = Array.isArray(postsData) ? postsData : [];

    // 🔥 게시글이 있으면 버튼 오른쪽으로
    if (posts.length > 0) {
      const createBtn = document.getElementById('btn-submit');
      createBtn.classList.add('right');
    }

    if (!posts || posts.length === 0) {
      listContainer.innerHTML = `
        <p class="post-list-message">게시글이 없습니다.</p>`;
      return;
    }

    listContainer.innerHTML = posts
      .map(
        (post) => {
          // 백엔드 필드명을 프론트엔드 필드명으로 변환
          const postId = post.postId || post.id;
          const title = post.title || '';
          const createdAt = post.createdAt || post.created_at || '';
          const authorNickname = post.author?.nickname || '';
          const authorProfileImage = post.author?.profileImageUrl || null;
          const likeCount = post.likeCount || 0;
          const commentCount = post.commentCount || 0;
          const hits = post.hits || 0;
          
          return `
        <div class="post-card" data-id="${postId}">
          <div class="post-card-header">
            <span class="post-card-title">${title}</span>
            <span class="post-card-date">${createdAt}</span>
          </div>

          <div class="post-card-stats">
            <span>좋아요 ${likeCount}</span>
            <span>댓글 ${commentCount}</span>
            <span>조회수 ${hits}</span>
          </div>

          <div class="post-card-divider"></div>

          <div class="post-card-author">
            <div class="post-card-author-img">
              <img src="${authorProfileImage || './imt.png'}" alt="작성자 프로필" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
            </div>
            <span class="post-card-author-name">${authorNickname}</span>
          </div>
        </div>
      `;
        }
      )
      .join('');
  } catch (e) {
    console.error('게시글 조회 실패:', e);
    listContainer.innerHTML = `
      <p class="post-list-message">게시글을 불러올 수 없습니다.</p>`;
  }
}

/**
 * 게시글 목록 + 헤더 이벤트 등록
 */
function attachPostListEvents() {
  const createBtn = document.getElementById('btn-submit');
  const listContainer = document.getElementById('post-card-list');
  const profileBtn = document.getElementById('header-profile-btn');
  const dropdown = document.getElementById('profile-dropdown');

  /** 게시글 작성 페이지 이동 */
  createBtn.addEventListener('click', () => {
    navigateTo('/posts/new');
  });

  /** 게시물 상세 이동 */
  listContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return;

    const postId = card.dataset.id;
    navigateTo(`/posts/${postId}`);
  });

  /** 프로필 버튼 클릭 → 드롭다운 on/off */
  profileBtn.addEventListener('click', () => {
    dropdown.classList.toggle('visible');
  });

  /** 회원정보 수정 */
  document.getElementById('go-mypage').addEventListener('click', () => {
    navigateTo('/profile/edit');
  });

  /** 비밀번호 수정 */
  document.getElementById('go-password').addEventListener('click', () => {
    navigateTo('/profile/password');
  });

  /** 로그아웃 */
  document.getElementById('logout-btn').addEventListener('click', () => {
    clearUser();
    navigateTo('/login');
  });

  /** 화면 아무데나 클릭하면 드롭다운 닫힘 */
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('visible');
    }
  });
  
  // 헤더 제목 클릭 → 게시글 목록으로 이동 (현재 페이지이지만 새로고침 효과)
  const headerTitle = document.getElementById('header-title-link');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      navigateTo('/posts');
    });
  }
}
