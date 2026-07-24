import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './productShell.css';
import './experienceSettings.css';
import './ichorOrbResponsive.css';
import App from './liber333.jsx';
import ProductShell from './ProductShell.jsx';
import { GrimoireNavigationProvider } from './contexts/GrimoireNavigationContext.jsx';
import { initializeExperienceSettingsRuntime } from './features/settings/experienceSettings.js';

initializeExperienceSettingsRuntime();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GrimoireNavigationProvider>
      <ProductShell>
        <App />
      </ProductShell>
    </GrimoireNavigationProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Liber 333 service worker registration failed:', error);
    });
  });
}
