/**
 * 댓글 목록 컴포넌트
 */

import { getUser } from '../state.js';
import { escapeHtml, formatDate } from '../utils.js';
import { DEFAULT_PROFILE_IMAGE } from '../constants.js';

/**
 * 댓글 목록 렌더링
 * @param {Array} comments - 댓글 배열
 * @returns {string} 댓글 목록 HTML
 */
export function renderCommentList(comments) {
  if (!comments || comments.length === 0) {
    return `
      <p style="text-align: center; color: #666; padding: 20px;">
        첫 번째 댓글을 작성해보세요!
      </p>
    `;
  }

  return comments.map((comment) => renderCommentItem(comment)).join('');
}

/**
 * 댓글 아이템 렌더링
 * @param {Object} comment - 댓글 데이터
 * @returns {string} 댓글 아이템 HTML
 */
function renderCommentItem(comment) {
  const currentUser = getUser();
  const isAuthor = currentUser && currentUser.id === comment.author?.id;

  const authorName = comment.author?.nickname || '알 수 없음';
  const authorAvatar =
    comment.author?.profileImageUrl ||
    comment.author?.profileImage ||
    DEFAULT_PROFILE_IMAGE;
  const createdAt = comment.createdAt || comment.created_at || '';

  return `
    <div class="comment-item" data-comment-id="${comment.commentId || comment.id}">
      <div class="comment-header">
        <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="comment-avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
        <span class="comment-author">${escapeHtml(authorName)}</span>
        <span class="comment-date">${formatDate(createdAt)}</span>
      </div>
      
      <p class="comment-content">${escapeHtml(comment.content)}</p>
      
      ${isAuthor ? `
        <div class="comment-actions">
          <button class="comment-action-btn" data-action="edit" data-comment-id="${comment.commentId || comment.id}">
            수정
          </button>
          <button class="comment-action-btn" data-action="delete" data-comment-id="${comment.commentId || comment.id}">
            삭제
          </button>
        </div>
      ` : ''}
    </div>
  `;
}
