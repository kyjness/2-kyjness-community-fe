/**
 * 게시글 카드 컴포넌트
 */

import { escapeHtml, formatDate, safeImageUrl } from '../utils.js';
import { DEFAULT_PROFILE_IMAGE } from '../../constants.js';

/**
 * 게시글 카드 렌더링
 * @param {Object} post - 게시글 데이터
 * @returns {string} 게시글 카드 HTML
 */
export function renderPostCard(post) {
  const postId = post.postId || post.id;
  const title = post.title || '제목 없음';
  const likeCount = post.likeCount || 0;
  const commentCount = post.commentCount || 0;
  const hits = post.hits || 0;
  const createdAt = post.createdAt || post.created_at || '';
  const author = post.author || {};

  const authorName = author.nickname || '알 수 없음';
  const authorAvatar = safeImageUrl(author.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE;

  return `
    <div class="post-card" data-id="${postId}">
      <div class="post-card-header">
        <span class="post-card-title">${escapeHtml(title)}</span>
        <span class="post-card-date">${formatDate(createdAt)}</span>
      </div>

      <div class="post-card-stats">
        <span>좋아요 ${likeCount}</span>
        <span>댓글 ${commentCount}</span>
        <span>조회수 ${hits}</span>
      </div>

      <div class="post-card-divider"></div>

      <div class="post-card-author">
        <div class="post-card-author-img">
          <img src="${authorAvatar}" alt="작성자 프로필" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
        </div>
        <span class="post-card-author-name">${escapeHtml(authorName)}</span>
      </div>
    </div>
  `;
}
