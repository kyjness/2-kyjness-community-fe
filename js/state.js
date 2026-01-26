/**
 * 전역 상태 관리
 * 로그인 유저 정보, 토큰 등을 관리합니다
 */

// 전역 상태 객체
const state = {
  user: null, // 로그인한 사용자 정보 { id, email, nickname, profileImageUrl }
  isLoggedIn: false, // 로그인 여부
};

/**
 * 현재 로그인 상태를 반환합니다
 */
export function isLoggedIn() {
  return state.isLoggedIn;
}

/**
 * 현재 로그인한 사용자 정보를 반환합니다
 */
export function getUser() {
  return state.user;
}

/**
 * 사용자 정보를 설정하고 로그인 상태로 변경합니다
 * @param {Object} userData - 사용자 정보
 */
export function setUser(userData) {
  state.user = userData;
  state.isLoggedIn = true;

  // 로컬 스토리지에 저장 (새로고침 시에도 유지)
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
}

/**
 * 로그아웃 처리 - 사용자 정보를 제거합니다
 */
export function clearUser() {
  state.user = null;
  state.isLoggedIn = false;

  // 로컬 스토리지에서 제거
  localStorage.removeItem('user');
}

/**
 * 로컬 스토리지에서 사용자 정보를 복원합니다
 * 페이지 새로고침 시 로그인 상태 유지를 위해 사용
 */
export function restoreUser() {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      state.user = userData;
      state.isLoggedIn = true;
      return userData;
    } catch (e) {
      console.error('사용자 정보 복원 실패:', e);
      clearUser();
    }
  }
  return null;
}

/**
 * 사용자 정보를 업데이트합니다 (프로필 수정 시 사용)
 * @param {Object} updates - 업데이트할 필드들
 */
export function updateUser(updates) {
  if (state.user) {
    state.user = { ...state.user, ...updates };
    localStorage.setItem('user', JSON.stringify(state.user));
  }
}
