import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './productShell.css';
import './ichorOrbResponsive.css';
import App from './liber333.jsx';
import ProductShell from './ProductShell.jsx';
import LandingIchorPortal from './LandingIchorPortal.jsx';
import { applyInitialDeepLink } from './deepLinkBridge.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProductShell>
      <App />
      <LandingIchorPortal />
    </ProductShell>
  </React.StrictMode>,
);

applyInitialDeepLink();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Liber 333 service worker registration failed:', error);
    });
  });
}
