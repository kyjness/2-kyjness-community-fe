// 강아지 미등록 유저 배너: 노출 시 회원정보 수정 유도, X 클릭 시 7일간 숨김.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BANNER_DISMISSED_KEY = 'dogProfileBannerDismissed';
const DISMISS_DAYS = 7;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

function isDismissedWithinPeriod() {
  try {
    const raw = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (raw == null) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_MS;
  } catch {
    return false;
  }
}

export function DogProfileBanner({ user }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(isDismissedWithinPeriod);

  const hasNoDogs = user && (!user.dogs || user.dogs.length === 0);
  const hasDogs = user && Array.isArray(user.dogs) && user.dogs.length > 0;
  const show = hasNoDogs && !dismissed;

  // 강아지 없을 때만: 마운트/유저 로드 시 localStorage 기준으로 다시 계산 (다른 탭·새로고침 대응)
  useEffect(() => {
    if (hasNoDogs) {
      setDismissed(isDismissedWithinPeriod());
    }
  }, [hasNoDogs]);

  // 강아지를 실제로 등록한 경우에만 배너 숨김 상태 초기화 (user가 null이면 초기화하지 않음)
  useEffect(() => {
    if (hasDogs) {
      try {
        localStorage.removeItem(BANNER_DISMISSED_KEY);
      } catch (_) {}
      setDismissed(false);
    }
  }, [hasDogs]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now()));
    } catch (_) {}
    setDismissed(true);
  };

  if (!show) return null;

  return (
    <div
      className="dog-profile-banner"
      role="button"
      tabIndex={0}
      onClick={() => navigate('/profile/edit')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/profile/edit');
        }
      }}
    >
      <span className="dog-profile-banner-text">아직 우리 아이를 등록하지 않으셨나요? 🐶 등록하러 가기</span>
      <button
        type="button"
        className="dog-profile-banner-close"
        aria-label="배너 닫기"
        onClick={handleDismiss}
      >
        ×
      </button>
    </div>
  );
}
