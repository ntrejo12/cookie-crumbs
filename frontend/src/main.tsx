import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import '@neondatabase/neon-js/ui/css';
import './index.css'
import App from './App.tsx'
import { neon } from './lib/neon';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NeonAuthUIProvider emailOTP authClient={neon.auth}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </NeonAuthUIProvider>
  </StrictMode>,
)
