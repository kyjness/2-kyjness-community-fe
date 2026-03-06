// 앱 진입점: createRoot로 React 트리 마운트, 스플래시·라우팅은 App에서 처리.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './css/base.css';
import './css/app.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
