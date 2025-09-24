import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ensureVsCodeApi } from './vscodeApi'

console.log('[MTE][React] bootstrap start');

// VSCode API の型定義
declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
    vscode?: any;
    __mteVscodeApi?: any;
  }
}

// VSCode webview環境の初期化
function initializeVSCodeEnvironment() {
  try {
    console.log('[MTE][React] initializeVSCodeEnvironment', {
      hasAcquire: typeof window.acquireVsCodeApi === 'function',
      hasCached: Boolean(window.vscode),
      hasCachedGlobal: Boolean(window.__mteVscodeApi)
    });
    const api = ensureVsCodeApi();
    if (api) {
      console.log('VSCode API initialized successfully');
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('VSCode API not yet available during initialization');
    }
  } catch (error) {
    console.warn('Failed to initialize VSCode API:', error);
  }
}

// DOM読み込み完了後にアプリを初期化
function initializeApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  initializeVSCodeEnvironment();

  console.log('[MTE][React] rendering App');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// DOM読み込み状態をチェック
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
