import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { PanelProvider } from './contexts/PanelContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <TranslationProvider>
          <PanelProvider>
            <App />
          </PanelProvider>
        </TranslationProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
