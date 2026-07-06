import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n'; // initialise i18next (effet de bord)
import './index.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);