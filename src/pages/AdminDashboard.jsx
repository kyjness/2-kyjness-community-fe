// 관리자 전용: 신고된 게시글 목록·블라인드 해제·유저 정지·글 삭제.
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { formatDateTime, getApiErrorMessage } from '../utils/index.js';

const PAGE_SIZE = 20;

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReportedPosts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/admin/reported-posts?page=${pageNum}&size=${PAGE_SIZE}`
      );
      const payload = res?.data ?? {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      const totalCount = payload.total ?? 0;
      setList(items);
      setTotal(Number(totalCount) || 0);
      setPage(pageNum);
    } catch (err) {
      if (err?.status === 403) {
        navigate('/', { replace: true });
        return;
      }
      setError(err?.message ?? '목록을 불러올 수 없습니다.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/', { replace: true });
      return;
    }
    fetchReportedPosts(1);
  }, [user?.role, navigate, fetchReportedPosts]);

  const handleUnblind = async (postId) => {
    if (!window.confirm('이 글의 블라인드를 해제(복구)하시겠습니까?')) return;
    setActionLoading(postId);
    try {
      await api.patch(`/admin/posts/${postId}/unblind`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '복구 처리에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('해당 유저를 정지하시겠습니까? 정지된 유저는 로그인 및 활동이 제한됩니다.')) return;
    setActionLoading(`suspend-${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '유저 정지에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm('해당 유저의 정지를 해제하시겠습니까?')) return;
    setActionLoading(`activate-${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/activate`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '정지 해제에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlindPost = async (postId) => {
    if (!window.confirm('이 글을 블라인드 처리하시겠습니까? 게시글이 비공개 처리됩니다.')) return;
    setActionLoading(`blind-${postId}`);
    try {
      await api.patch(`/admin/posts/${postId}/blind`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '블라인드 처리에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.')) return;
    setActionLoading(`delete-${postId}`);
    try {
      await api.delete(`/admin/posts/${postId}`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '글 삭제에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetReports = async (postId) => {
    if (!window.confirm('이 글의 신고를 초기화하시겠습니까? 해당 신고는 목록에서 사라집니다.')) return;
    setActionLoading(`reset-${postId}`);
    try {
      await api.patch(`/admin/posts/${postId}/reset-reports`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '신고 무시 처리에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblindComment = async (commentId) => {
    if (!window.confirm('이 댓글의 블라인드를 해제하시겠습니까?')) return;
    setActionLoading(`comment-unblind-${commentId}`);
    try {
      await api.patch(`/admin/comments/${commentId}/unblind`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '댓글 블라인드 해제에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlindComment = async (commentId) => {
    if (!window.confirm('이 댓글을 블라인드 처리하시겠습니까?')) return;
    setActionLoading(`comment-blind-${commentId}`);
    try {
      await api.patch(`/admin/comments/${commentId}/blind`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '댓글 블라인드 처리에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCommentReports = async (commentId) => {
    if (!window.confirm('이 댓글의 신고를 초기화하시겠습니까? 해당 신고는 목록에서 사라집니다.')) return;
    setActionLoading(`comment-reset-${commentId}`);
    try {
      await api.patch(`/admin/comments/${commentId}/reset-reports`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '댓글 신고 무시 처리에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.')) return;
    setActionLoading(`comment-delete-${commentId}`);
    try {
      await api.delete(`/admin/posts/${postId}/comments/${commentId}`);
      await fetchReportedPosts(page);
    } catch (err) {
      alert(getApiErrorMessage(err?.code ?? err?.message, '댓글 삭제에 실패했습니다.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (user != null && user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Header showBackButton backHref="/posts">
      <main className="main admin-dashboard-main">
        <div className="admin-dashboard-container" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ marginBottom: 24, textAlign: 'center' }}>관리자 대시보드</h1>
          <p style={{ marginBottom: 16, color: 'var(--color-text-secondary, #666)', textAlign: 'center' }}>
            신고가 누적되었거나 블라인드된 게시글 목록입니다.
          </p>

          {loading ? (
            <p style={{ padding: 40, textAlign: 'center' }}>목록을 불러오는 중...</p>
          ) : error ? (
            <p style={{ color: 'var(--color-error)', padding: 20 }}>{error}</p>
          ) : list.length === 0 ? (
            <p style={{ padding: 40, textAlign: 'center' }}>신고된 내용이 없습니다.</p>
          ) : (
            <>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>신고 유형</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>게시글 제목</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>내용</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>작성자 닉네임</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>신고 횟수</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>신고 사유</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>최근 신고 시각</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>유저 상태</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>노출 상태</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={`${row.targetType ?? 'POST'}-${row.id}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 12 }}>
                        {row.targetType === 'COMMENT' ? '댓글' : '게시글'}
                      </td>
                      <td style={{ padding: 12 }}>
                        <Link
                          to={`/posts/${row.postId ?? row.id}?from=admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-link, #2563eb)', textDecoration: 'underline' }}
                        >
                          {row.title ?? '-'}
                        </Link>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div
                          className="admin-report-reason-cell"
                          title={row.contentPreview ?? ''}
                          style={{ fontSize: 12, maxWidth: 200 }}
                        >
                          {row.contentPreview ?? '-'}
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        {row.author?.nickname ?? `user_${row.userId}`}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>{row.reportCount ?? 0}</td>
                      <td style={{ padding: 12, maxWidth: 180 }}>
                        {(() => {
                          const reasons = row.reportReasons ?? [];
                          if (!reasons.length) return '-';
                          const countByReason = reasons.reduce((acc, r) => {
                            acc[r] = (acc[r] ?? 0) + 1;
                            return acc;
                          }, /** @type {Record<string, number>} */ ({}));
                          const text = Object.entries(countByReason)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([reason, count]) => `${reason}(${count})`)
                            .join(', ');
                          return (
                            <div title={text} className="admin-report-reason-cell" style={{ fontSize: 12 }}>
                              {text}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: 12 }}>
                        {row.lastReportedAt
                          ? formatDateTime(row.lastReportedAt)
                          : '-'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {(row.author?.status ?? row.authorStatus) === 'SUSPENDED' ? (
                          <span className="admin-badge admin-badge--red" title="정지된 유저">정지</span>
                        ) : (
                          <span className="admin-badge admin-badge--gray" title="정상">정상</span>
                        )}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {row.isBlinded ? (
                          <span className="admin-badge admin-badge--orange" title="블라인드">블라인드</span>
                        ) : (
                          <span className="admin-badge admin-badge--gray" title="정상">정상</span>
                        )}
                      </td>
                      <td style={{ padding: 12, width: 140 }}>
                        {row.targetType === 'COMMENT' ? (
                          <details className="admin-action-dropdown">
                            <summary
                              className="admin-action-summary"
                              aria-haspopup="listbox"
                              aria-expanded="false"
                            >
                              관리 메뉴
                            </summary>
                            <div className="admin-action-menu">
                              {row.isBlinded ? (
                                <button
                                  type="button"
                                  className="admin-action-btn admin-action-btn--active"
                                  disabled={actionLoading != null}
                                  onClick={() => handleUnblindComment(row.id)}
                                >
                                  {actionLoading === `comment-unblind-${row.id}` ? '처리 중' : '블라인드 해제'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  disabled={actionLoading != null}
                                  onClick={() => handleBlindComment(row.id)}
                                >
                                  {actionLoading === `comment-blind-${row.id}` ? '처리 중' : '블라인드 처리'}
                                </button>
                              )}
                              {(row.author?.status ?? row.authorStatus) === 'SUSPENDED' ? (
                                <button
                                  type="button"
                                  className="admin-action-btn admin-action-btn--active"
                                  disabled={actionLoading != null}
                                  onClick={() => handleActivateUser(row.userId)}
                                >
                                  {actionLoading === `activate-${row.userId}` ? '처리 중' : '정지 해제'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  disabled={actionLoading != null}
                                  onClick={() => handleSuspendUser(row.userId)}
                                >
                                  {actionLoading === `suspend-${row.userId}` ? '처리 중' : '유저 정지'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="admin-action-btn"
                                disabled={actionLoading != null}
                                onClick={() => handleDeleteComment(row.postId, row.id)}
                              >
                                {actionLoading === `comment-delete-${row.id}` ? '처리 중' : '댓글 삭제'}
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn admin-action-btn--gray"
                                disabled={actionLoading != null}
                                onClick={() => handleResetCommentReports(row.id)}
                              >
                                {actionLoading === `comment-reset-${row.id}` ? '처리 중' : '신고 무시'}
                              </button>
                            </div>
                          </details>
                        ) : (
                          <details className="admin-action-dropdown">
                            <summary
                              className="admin-action-summary"
                              aria-haspopup="listbox"
                              aria-expanded="false"
                            >
                              관리 메뉴
                            </summary>
                            <div className="admin-action-menu">
                              {row.isBlinded ? (
                                <button
                                  type="button"
                                  className="admin-action-btn admin-action-btn--active"
                                  disabled={actionLoading != null}
                                  onClick={() => handleUnblind(row.id)}
                                >
                                  {actionLoading === row.id ? '처리 중' : '블라인드 해제'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  disabled={actionLoading != null}
                                  onClick={() => handleBlindPost(row.id)}
                                >
                                  {actionLoading === `blind-${row.id}` ? '처리 중' : '블라인드 처리'}
                                </button>
                              )}
                              {(row.author?.status ?? row.authorStatus) === 'SUSPENDED' ? (
                                <button
                                  type="button"
                                  className="admin-action-btn admin-action-btn--active"
                                  disabled={actionLoading != null}
                                  onClick={() => handleActivateUser(row.userId)}
                                >
                                  {actionLoading === `activate-${row.userId}` ? '처리 중' : '정지 해제'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  disabled={actionLoading != null}
                                  onClick={() => handleSuspendUser(row.userId)}
                                >
                                  {actionLoading === `suspend-${row.userId}` ? '처리 중' : '유저 정지'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="admin-action-btn"
                                disabled={actionLoading != null}
                                onClick={() => handleDeletePost(row.id)}
                              >
                                {actionLoading === `delete-${row.id}` ? '처리 중' : '글 삭제'}
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn admin-action-btn--gray"
                                disabled={actionLoading != null}
                                onClick={() => handleResetReports(row.id)}
                              >
                                {actionLoading === `reset-${row.id}` ? '처리 중' : '신고 무시'}
                              </button>
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > PAGE_SIZE && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={page <= 1}
                    onClick={() => fetchReportedPosts(page - 1)}
                  >
                    이전
                  </button>
                  <span style={{ alignSelf: 'center' }}>
                    {page} / {Math.ceil(total / PAGE_SIZE) || 1}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    disabled={page * PAGE_SIZE >= total}
                    onClick={() => fetchReportedPosts(page + 1)}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </Header>
  );
}
