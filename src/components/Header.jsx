// 공통 헤더: 제목, 뒤로가기, 프로필 드롭다운(로그아웃·회원정보/비밀번호 수정).

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { safeImageUrl } from '../utils/index.js';
import { DEFAULT_PROFILE_IMAGE, HEADER_TITLE } from '../config.js';
import { NotificationBell } from './Notification/NotificationBell.jsx';

/** @see former mypage.css — 헤더 우측(알림+프로필+드롭다운) */
const HEADER_ACTIONS_CLASS =
  'absolute right-[25%] top-1/2 z-[160] flex -translate-y-1/2 flex-row items-center gap-[10px] max-md:right-4';

const HEADER_PROFILE_CLASS =
  'relative right-auto top-auto h-[42px] w-[42px] shrink-0 translate-y-0 cursor-pointer';

const PROFILE_DROPDOWN_CLASS =
  "absolute right-0 top-[52px] z-[200] flex w-[100px] flex-col border border-[#DDD] bg-[#D9D9D9] p-0 max-md:right-4";

const PROFILE_DROPDOWN_BTN_CLASS =
  "h-8 border-0 bg-[#D9D9D9] px-[10px] py-[6px] text-center font-['Pretendard'] text-[12px] text-black hover:bg-[#BDBDBD] cursor-pointer";

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
      <header className="relative z-[150] w-full bg-white pt-[18px] shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
        {showBackButton && (
          <button
            type="button"
            className="absolute left-[25%] top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[8px] border-0 bg-transparent p-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
            id="header-back-btn"
            aria-label="뒤로 가기"
            onClick={() => navigate(backHref)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-[22px] w-[22px] text-[#1C1B1F]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="mb-5 cursor-default text-center font-['Pretendard',sans-serif] text-[20px] font-normal leading-[100%] text-black">
          <Link
            to="/posts"
            id="header-title-link"
            className="inline-block cursor-pointer text-black no-underline hover:text-black"
          >
            <span className="inline-flex items-center gap-2">
              <svg
                className="text-[#111827] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]"
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
              <span>{HEADER_TITLE}</span>
            </span>
          </Link>
        </h1>
        {showProfile && isLoggedIn && (
          <div className={HEADER_ACTIONS_CLASS} ref={dropdownRef}>
            <NotificationBell />
            <div
              className={HEADER_PROFILE_CLASS}
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
              <div className="h-[42px] w-[42px] overflow-hidden rounded-full">
                <img
                  src={profileImage}
                  alt="프로필"
                  className="h-full w-full object-cover"
                  onError={handleProfileImgError}
                />
              </div>
            </div>
            <div
              className={`${PROFILE_DROPDOWN_CLASS} ${dropdownOpen ? 'flex' : 'hidden'}`}
              id="profile-dropdown"
            >
              <button
                type="button"
                className={PROFILE_DROPDOWN_BTN_CLASS}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/mypage');
                }}
              >
                마이페이지
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  className={PROFILE_DROPDOWN_BTN_CLASS}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/admin/dashboard');
                  }}
                >
                  관리자 페이지
                </button>
              )}
              <button type="button" className={PROFILE_DROPDOWN_BTN_CLASS} onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        )}
        {showProfile && !isLoggedIn && (
          <button
            type="button"
            className="absolute right-[25%] top-1/2 inline-block -translate-y-1/2 rounded-[20px] border-0 bg-[var(--primary)] px-5 py-[6px] font-['Pretendard',sans-serif] text-[12px] font-bold leading-[12px] text-white cursor-pointer hover:bg-[var(--primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(0,0,0,0.65)] focus-visible:outline-offset-2 focus-visible:rounded-[8px] max-md:right-4"
            onClick={() => navigate('/login')}
          >
            로그인
          </button>
        )}
      </header>
      {children}
    </>
  );
}
