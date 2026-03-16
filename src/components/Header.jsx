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
            {HEADER_TITLE}
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
        <div className="header-divider" />
      </header>
      {children}
    </>
  );
}
