import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

// Helper seguro para obter variáveis de ambiente em diferentes ambientes (Vite, etc)
const getEnvVar = (key: string): string | undefined => {
  try {
    // Tenta acessar via import.meta.env (Padrão Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    
    // Fallback para process.env (Node/Legacy)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn('Error reading env var', key, e);
  }
  return undefined;
};

const clerkPubKey = getEnvVar('VITE_CLERK_PUBLISHABLE_KEY');

const rootElement = document.getElementById('root');

if (rootElement) {
  if (!clerkPubKey) {
    console.error('Environment Error: VITE_CLERK_PUBLISHABLE_KEY is missing');
    ReactDOM.createRoot(rootElement).render(
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#0B0E14', 
        color: '#E2E8F0',
        fontFamily: 'sans-serif',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ color: '#EF4444', fontSize: '1.5rem', marginBottom: '1rem' }}>Configuration Error</h1>
          <p>Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable.</p>
          <p style={{ marginTop: '0.5rem', color: '#94A3B8' }}>Check your <code>.env</code> file.</p>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem', textAlign: 'left', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <p><strong>Troubleshooting:</strong></p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Ensure <code>.env</code> exists in project root.</li>
              <li>Restart the development server (<code>npm run dev</code>).</li>
              <li>If seeing this in production, verify Environment Variables in dashboard.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ClerkProvider publishableKey={clerkPubKey}>
          <App />
        </ClerkProvider>
      </React.StrictMode>
    );
  }
}