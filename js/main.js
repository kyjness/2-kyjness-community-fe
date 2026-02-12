/**
 * 앱 진입점 (Entry Point)
 * 스플래시: constants.SPLASH_ITEMS 순차 재생(각 항목 duration ms) 후 앱 초기화
 */

import { restoreUser } from './state.js';
import { initRouter } from './router.js';
import { SPLASH_ITEMS } from '../constants.js';

/**
 * 앱 초기화
 */
function initApp() {
  restoreUser();
  initRouter();
  window.addEventListener('error', (event) => {
    console.error('전역 에러:', event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 에러:', event.reason);
  });
}

/**
 * 스플래시 제거 후 앱 시작
 */
function finishSplash() {
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

/**
 * 스플래시 한 프레임 표시 (로티만)
 */
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
  } catch (e) {
    console.warn('Lottie 로드 실패:', e);
  }
}

/**
 * SPLASH_ITEMS 순서대로 각 duration씩 보였다가 넘김. 겹치지 않음.
 * 다 보여준 뒤 앱으로 전환.
 */
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
  runSplashSequence();
});
