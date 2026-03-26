// 게시글 상세 카드: 제목·메타·이미지·본문·통계·메시지.
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { DEFAULT_PROFILE_IMAGE } from '../../config.js';
import {
  escapeHtml,
  escapeAttr,
  safeImageUrl,
  formatDateTime,
  calculateDogAge,
  formatDogGenderLabel,
} from '../../utils/index.js';
import { getPostCategoryLabel } from '../../utils/postMeta.js';
export function PostContent({
  post,
  postId,
  message,
  uniqueFiles,
  commentTotalCount,
  onLike,
  onEdit,
  onDeleteOpen,
  onBlockUser,
  onReportOpen,
  currentUserId,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!post) return null;

  // 타인 글이면(작성자 탈퇴/파기 포함) 신고 노출. 차단은 로그인 + author_id 존재 시에만.
  const showPostReport = Boolean(!post.isMine);
  const showBlockInPostMenu =
    currentUserId != null &&
    post.author_id != null &&
    post.author_id !== currentUserId &&
    !post.isMine;

  const categoryLabel = getPostCategoryLabel(post?.category_id);
  const tagList = Array.isArray(post?.hashtags) ? post.hashtags : [];

  return (
    <section className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-200"
          title="카테고리"
        >
          {escapeHtml(categoryLabel)}
        </span>
      </div>
      <h2 className="post-detail-title">{escapeHtml(post?.title ?? '')}</h2>
      <div className="post-detail-author">
        <div className="post-detail-author-row">
          <div className="post-detail-author-avatar">
            <img
              src={post?.author_profile_image || DEFAULT_PROFILE_IMAGE}
              alt="작성자 프로필"
              className="w-full h-full object-cover rounded-full block"
            />
          </div>
          <div className="post-detail-author-info">
            <span className="post-detail-author-nickname">
              {escapeHtml(post?.author_nickname ?? '작성자')}
              {post?.author_representative_dog?.name && (
                <span className="post-detail-author-dog-info">
                  {' '}
                  {(() => {
                    const d = post.author_representative_dog;
                    const genderLabel = d.gender ? (
                      <span className={`dog-gender-badge dog-gender--${d.gender}`}>
                        {formatDogGenderLabel(d.gender)}
                      </span>
                    ) : null;
                    const parts = [
                      escapeHtml(d.name),
                      escapeHtml(d.breed || ''),
                      genderLabel,
                      calculateDogAge(d.birthDate),
                    ].filter(Boolean);
                    return parts.map((p, i) => (
                      <span key={i}>
                        {i > 0 && ' / '}
                        {p}
                      </span>
                    ));
                  })()}
                </span>
              )}
            </span>
            <span className="post-detail-author-date">{formatDateTime(post?.created_at)}</span>
          </div>
        </div>
        {(post?.isMine || showPostReport) && (
          <div className="post-detail-author-actions flex items-center gap-2">
            {post?.isMine && (
              <>
                <button
                  type="button"
                  className="min-w-[46px] h-[27px] rounded-md border border-[#aca0eb] bg-white text-xs font-['Pretendard'] cursor-pointer"
                  onClick={() => onEdit(`/posts/${postId}/edit`)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="min-w-[46px] h-[27px] rounded-md border border-[#aca0eb] bg-white text-xs font-['Pretendard'] cursor-pointer"
                  onClick={onDeleteOpen}
                >
                  삭제
                </button>
              </>
            )}
            {showPostReport && (
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-1 border-none rounded-md bg-transparent text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-100"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="메뉴"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal size={18} aria-hidden />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[1]"
                      role="presentation"
                      onClick={() => setMenuOpen(false)}
                    />
                    <ul className="comment-item-menu">
                      {showBlockInPostMenu ? (
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              onBlockUser?.(post.author_id);
                              setMenuOpen(false);
                            }}
                          >
                            차단
                          </button>
                        </li>
                      ) : null}
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            onReportOpen?.();
                            setMenuOpen(false);
                          }}
                        >
                          신고
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="h-px bg-gray-200 my-1 w-full" />
      {uniqueFiles.length > 0 && (
        <div className="post-detail-images flex flex-wrap gap-3 justify-center">
          {uniqueFiles.map((f, i) => {
            const url = safeImageUrl(f.fileUrl, '');
            return url ? (
              <div key={i} className="w-full max-w-[300px] h-[260px] rounded-xl bg-gray-300 overflow-hidden flex items-center justify-center flex-1 min-w-[200px]">
                <img
                  src={escapeAttr(url)}
                  alt="게시글 이미지"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ) : null;
          })}
      </div>
      )}
      <p className="post-detail-body whitespace-pre-line">
        {escapeHtml(String(post?.content || '내용이 없습니다.').trim())}
      </p>
      {tagList.length > 0 ? (
        <div className="mt-3 mb-1 flex flex-wrap gap-2" aria-label="해시태그">
          {tagList.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 ring-1 ring-sky-100"
            >
              #{escapeHtml(String(t))}
            </span>
          ))}
        </div>
      ) : null}
      <div className="post-detail-stats flex justify-center gap-3">
        <div
          className="w-24 h-16 rounded-xl bg-gray-300 flex flex-col items-center justify-center cursor-pointer"
          id="like-stat-box"
          onClick={onLike}
        >
          <span className="text-base font-bold mb-1 text-black">{post?.likes ?? 0}</span>
          <span className="text-xs font-bold text-black">좋아요수</span>
        </div>
        <div className="w-24 h-16 rounded-xl bg-gray-300 flex flex-col items-center justify-center">
          <span className="text-base font-bold mb-1 text-black">{post?.views ?? 0}</span>
          <span className="text-xs font-bold text-black">조회수</span>
        </div>
        <div className="w-24 h-16 rounded-xl bg-gray-300 flex flex-col items-center justify-center">
          <span className="text-base font-bold mb-1 text-black">
            {post?.commentCount ?? commentTotalCount ?? 0}
          </span>
          <span className="text-xs font-bold text-black">댓글</span>
        </div>
      </div>
      <div className="h-px bg-gray-200 my-1 w-full" />
      {message && (
        <span className="helper-text" id="post-detail-message">
          * {message}
        </span>
      )}
      {children}
    </section>
  );
}
