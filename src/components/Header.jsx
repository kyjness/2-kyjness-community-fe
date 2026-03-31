// 공통 헤더: 제목, 뒤로가기, 프로필 드롭다운(로그아웃·회원정보/비밀번호 수정).

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { safeImageUrl } from '../utils/index.js';
import { DEFAULT_PROFILE_IMAGE, HEADER_TITLE } from '../config.js';

export function Header({ children, showBackButton = false, backHref = '/posts', showProfile = true }) {
  const { user, isLoggedIn, clearUser } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownOpenRef = useRef(dropdownOpen);
  dropdownOpenRef.current = dropdownOpen;

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownOpenRef.current &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    clearUser();
    navigate('/login');
  };

  const profileImage = safeImageUrl(user?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE;

  const handleProfileImgError = (e) => {
    if (e?.target?.src !== DEFAULT_PROFILE_IMAGE) e.target.src = DEFAULT_PROFILE_IMAGE;
  };

  return (
    <>
      <header className="header">
        {showBackButton && (
          <button
            type="button"
            className="btn-back"
            id="header-back-btn"
            aria-label="뒤로 가기"
            onClick={() => navigate(backHref)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="header-title">
          <Link to="/posts" id="header-title-link">
            <span className="header-title__brand">
              <svg
                className="header-title__logo"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M7.2 10.1c1 0 1.8-.95 1.8-2.12S8.2 5.86 7.2 5.86 5.4 6.8 5.4 7.98 6.2 10.1 7.2 10.1Zm9.6 0c1 0 1.8-.95 1.8-2.12s-.8-2.12-1.8-2.12-1.8.95-1.8 2.12.8 2.12 1.8 2.12ZM11.1 8.9c.95 0 1.7-.88 1.7-1.97S12.05 5 11.1 5 9.4 5.88 9.4 6.93s.75 1.97 1.7 1.97Zm1.8 0c.95 0 1.7-.88 1.7-1.97S13.85 5 12.9 5s-1.7.88-1.7 1.97.75 1.97 1.7 1.97Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M12 11.2c-3 0-5.6 2.05-5.6 4.6 0 1.7 1.5 3.1 3.4 3.1.95 0 1.65-.2 2.2-.55.55.35 1.25.55 2.2.55 1.9 0 3.4-1.4 3.4-3.1 0-2.55-2.6-4.6-5.6-4.6Z"
                  fill="currentColor"
                />
              </svg>
              <span className="header-title__text">{HEADER_TITLE}</span>
            </span>
          </Link>
        </h1>
        {showProfile && isLoggedIn && (
          <div ref={dropdownRef}>
            <div
              className="header-profile-wrapper"
              id="header-profile-btn"
              role="button"
              tabIndex={0}
              onClick={() => setDropdownOpen((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDropdownOpen((v) => !v);
                }
              }}
            >
              <div className="profile-avatar">
                <img src={profileImage} alt="프로필" className="profile-avatar-img" onError={handleProfileImgError} />
              </div>
            </div>
            <div className={`profile-dropdown ${dropdownOpen ? 'visible' : ''}`} id="profile-dropdown">
              <button type="button" onClick={() => { setDropdownOpen(false); navigate('/mypage'); }}>
                마이페이지
              </button>
              {user?.role === 'ADMIN' && (
                <button type="button" onClick={() => { setDropdownOpen(false); navigate('/admin/dashboard'); }}>
                  관리자 페이지
                </button>
              )}
              <button type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        )}
        {showProfile && !isLoggedIn && (
          <button
            type="button"
            className="header-login-btn"
            onClick={() => navigate('/login')}
          >
            로그인
          </button>
        )}
        <div className="header-divider" />
      </header>
      {children}
    </>
  );
}
