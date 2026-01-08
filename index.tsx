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
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is missing. Check your environment variables.");
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey || ''}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}