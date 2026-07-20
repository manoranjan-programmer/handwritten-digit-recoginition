/**
 * main.jsx
 * --------
 * React 19 application entry point.
 *
 * Responsibilities:
 *  • Import global CSS (Tailwind + custom tokens)
 *  • Mount the root React tree into #root via createRoot (React 19 API)
 *  • Wrap the app in BrowserRouter so any page can use React Router hooks
 *
 * StrictMode is intentionally kept in development to surface potential
 * issues early; it has no effect on production builds.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.jsx';

// Grab the DOM node defined in index.html
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    '[main.jsx] Could not find #root element. Check index.html.'
  );
}

createRoot(container).render(
  <StrictMode>
    {/* BrowserRouter provides history/location context to the whole tree */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
