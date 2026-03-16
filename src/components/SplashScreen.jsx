// 스플래시: Lottie 순차 재생 후 .splash.hide 전환, onDone 콜백.
import { useState, useRef, useEffect } from 'react';
import { SPLASH_ITEMS } from '../config.js';

const SPLASH_SHOWN_KEY = 'splashShown';

export function SplashScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);

  const items = SPLASH_ITEMS ?? [];
  const isComplete = index >= items.length;

  useEffect(() => {
    if (isComplete || !items.length) return;
    const item = items[index];
    const container = containerRef.current;
    if (!container) return;
    if (typeof window.lottie !== 'undefined') {
      try {
        animRef.current = window.lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: item.path,
        });
      } catch (_) {}
    }
    const t = setTimeout(() => setIndex((i) => i + 1), item.duration ?? 1000);
    return () => {
      clearTimeout(t);
      if (animRef.current) {
        try {
          animRef.current.destroy();
        } catch (_) {}
        animRef.current = null;
      }
    };
  }, [index, isComplete, items]);

  useEffect(() => {
    if (!isComplete || !items.length) return;
    try {
      sessionStorage.setItem(SPLASH_SHOWN_KEY, '1');
    } catch (_) {}
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      onDone?.();
      return;
    }
    wrapper.classList.add('hide');
    const handleTransitionEnd = () => onDone?.();
    wrapper.addEventListener('transitionend', handleTransitionEnd, { once: true });
    return () => wrapper.removeEventListener('transitionend', handleTransitionEnd);
  }, [isComplete, items.length, onDone]);

  useEffect(() => {
    if (!items.length) onDone?.();
  }, [items.length, onDone]);

  if (!items.length) return null;

  return (
    <div ref={wrapperRef} className="splash" aria-hidden="true">
      <div className="splash-stage">
        {!isComplete && (
          <div className="splash-frame">
            <div ref={containerRef} className="splash-content" />
          </div>
        )}
      </div>
    </div>
  );
}
