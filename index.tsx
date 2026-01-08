import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

const getEnv = (key: string) => {
  // Safely check for import.meta.env
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env && meta.env[key]) {
    return meta.env[key];
  }
  // Fallback to process.env if available
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }
  return undefined;
};

const clerkPubKey = getEnv('VITE_CLERK_PUBLISHABLE_KEY');

const rootElement = document.getElementById('root');

if (rootElement) {
  if (!clerkPubKey) {
    // Render a safe error screen instead of crashing
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
          <p style={{ marginTop: '0.5rem', color: '#94A3B8' }}>Please check your .env file or deployment settings.</p>
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