import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard against libraries trying to overwrite window.fetch in environments where it is read-only
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  try {
    Object.defineProperty(window, 'fetch', {
      get() { return originalFetch; },
      set(v) { 
        if (v !== originalFetch) {
          console.warn('Attempted to overwrite fetch with', v);
        }
      },
      configurable: true
    });
  } catch (e) {
    // If we can't redefine it, it might already be protected or non-configurable
    console.debug('Fetch protection skipped:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
