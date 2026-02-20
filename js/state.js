// 전역 상태 관리 (로그인 유저 표시용, 인증은 쿠키/세션)

// 전역 상태 객체
const state = {
  user: null, // 로그인한 사용자 정보 { userId, email, nickname, profileImageUrl }
  isLoggedIn: false, // 로그인 여부
};

// 현재 로그인 여부
export function isLoggedIn() {
  return state.isLoggedIn;
}

// 현재 로그인 사용자 정보
export function getUser() {
  return state.user;
}

// 사용자 설정 및 로그인 상태로 변경
export function setUser(userData) {
  state.user = userData;
  state.isLoggedIn = true;

  // 로컬 스토리지에 저장 (새로고침 시에도 유지)
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
}

// 로그아웃 (사용자 정보 제거)
export function clearUser() {
  state.user = null;
  state.isLoggedIn = false;

  // 로컬 스토리지에서 제거
  localStorage.removeItem('user');
}

// 로컬 스토리지에서 사용자 정보 복원 (UI용, 인증은 서버 기준)
export function restoreUser() {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      state.user = userData;
      state.isLoggedIn = true;
      return userData;
    } catch (_) {
      clearUser();
    }
  }
  return null;
}
