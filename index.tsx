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

if (!clerkPubKey) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const rootElement = document.getElementById('root');

if (rootElement) {
  if (!clerkPubKey) {
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #0B0E14; color: white; font-family: sans-serif;">
        <h2 style="color: #EF4444; margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold;">Configuration Missing</h2>
        <p><code>VITE_CLERK_PUBLISHABLE_KEY</code> is not defined.</p>
        <p style="color: #94A3B8; margin-top: 0.5rem;">Check your environment variables.</p>
      </div>
    `;
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