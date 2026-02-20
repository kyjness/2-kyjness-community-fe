// 앱 진입점 (스플래시는 웹사이트 최초 진입 시에만, 새로고침/다른 페이지에서 돌아와도 재생 안 함)

import { restoreUser } from './state.js';
import { initRouter } from './router.js';
import { SPLASH_ITEMS } from './config.js';

const SPLASH_SHOWN_KEY = 'splashShown';

// 앱 초기화
function initApp() {
  restoreUser();
  initRouter();
  window.addEventListener('error', () => {});
  window.addEventListener('unhandledrejection', () => {});
}

// 스플래시 제거 후 앱 시작 (최초 1회만 스플래시 재생했음을 기록)
function finishSplash() {
  try {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, '1');
  } catch (_) {}
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hide');
    splash.addEventListener('transitionend', () => {
      splash.remove();
    }, { once: true });
  }
  initApp();
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 스플래시 한 프레임 표시 (로티만)
function showSplashFrame(stage, item) {
  stage.innerHTML = '';
  if (typeof window.lottie === 'undefined') return;

  const frame = document.createElement('div');
  frame.className = 'splash-frame';
  const container = document.createElement('div');
  container.className = 'splash-content';
  frame.appendChild(container);
  stage.appendChild(frame);

  try {
    window.lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: item.path,
    });
  } catch (_) {}
}

// SPLASH_ITEMS 순서대로 재생 후 앱 전환
async function runSplashSequence() {
  const stage = document.getElementById('splash-stage');
  if (!stage || !SPLASH_ITEMS || SPLASH_ITEMS.length === 0) {
    finishSplash();
    return;
  }
  for (const item of SPLASH_ITEMS) {
    showSplashFrame(stage, item);
    await delay(item.duration ?? 1000);
  }
  finishSplash();
}

document.addEventListener('DOMContentLoaded', () => {
  // 웹사이트 최초 진입 시에만 스플래시(로티) 재생. 새로고침·회원정보수정/비밀번호수정 후 복귀 시에는 스킵
  if (sessionStorage.getItem(SPLASH_SHOWN_KEY)) {
    const splash = document.getElementById('splash');
    if (splash) splash.remove();
    initApp();
  } else {
    runSplashSequence();
  }
});
