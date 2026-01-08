import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function AdminSetup() {
  const { getToken } = useAuth();
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('https://app.andromedalib.com/auth/callback');
  const [appDomain, setAppDomain] = useState('app.andromedalib.com');
  const [showSecret, setShowSecret] = useState(false);
  
  // States
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Determine dynamic redirect URI for development
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        setRedirectUri(`${origin}/api/auth/meta/callback`);
        setAppDomain(window.location.host);
    }

    // Load existing config
    getToken().then(token => {
        fetch('/api/admin/meta/config', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if(data.appId) {
                    setAppId(data.appId);
                    setConnectionStatus('connected'); // Assume connected if ID exists, user can re-test
                }
            });
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
        const token = await getToken();
        const res = await fetch('/api/admin/meta/config', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId, appSecret })
        });
        if (res.ok) {
            setStatusMessage('Configuration saved successfully.');
            setConnectionStatus('connected');
        } else {
            throw new Error('Failed to save');
        }
    } catch (e) {
        setStatusMessage('Error saving configuration.');
    } finally {
        setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setConnectionStatus('disconnected'); // Reset status during test
    try {
        const token = await getToken();
        const res = await fetch('/api/admin/meta/test', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            setConnectionStatus('connected');
            setStatusMessage(data.message);
        } else {
            setConnectionStatus('error');
            setStatusMessage(data.message || 'Validation failed');
        }
    } catch (e) {
        setConnectionStatus('error');
        setStatusMessage('Network error during test');
    } finally {
        setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a small toast here
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Status Banner */}
        {connectionStatus === 'disconnected' && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 mt-0.5">warning</span>
                <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400">Not Connected</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
                        Your Meta App is not yet connected to Andromeda Lab. Please configure the credentials below to enable ad management features.
                    </p>
                </div>
            </div>
        )}
        
        {connectionStatus === 'error' && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 dark:text-red-500 mt-0.5">error</span>
                <div>
                    <h3 className="text-sm font-bold text-red-900 dark:text-red-400">Connection Failed</h3>
                    <p className="text-sm text-red-700 dark:text-red-500/80 mt-1">{statusMessage}</p>
                </div>
            </div>
        )}

        {connectionStatus === 'connected' && (
             <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 p-4 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                     <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1">
                         <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[20px]">check</span>
                     </div>
                    <div>
                        <h3 className="text-sm font-bold text-green-900 dark:text-green-400">Connection Successful</h3>
                        <p className="text-sm text-green-700 dark:text-green-500/80">Valid credentials. System is ready.</p>
                    </div>
                </div>
            </div>
        )}

        {/* Main Configuration Card */}
        <div className="rounded-xl border border-slate-200 dark:border-[#344465] bg-surface-light dark:bg-surface-dark shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-[#344465]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">App Credentials</h3>
                <p className="text-sm text-slate-500 dark:text-[#93a5c8] mt-1">
                    Enter the App ID and App Secret from your <a className="text-primary hover:underline" href="https://developers.facebook.com" target="_blank" rel="noreferrer">Meta Developer Portal</a>.
                </p>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
                {/* Credentials Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meta App ID</span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 material-symbols-outlined text-[20px]">tag</span>
                            <input 
                                value={appId}
                                onChange={e => setAppId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-[#344465] bg-white dark:bg-[#111722] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#93a5c8]/50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                                placeholder="e.g. 123456789012345" 
                                type="text"
                            />
                        </div>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meta App Secret</span>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 material-symbols-outlined text-[20px]">lock</span>
                            <input 
                                value={appSecret}
                                onChange={e => setAppSecret(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 dark:border-[#344465] bg-white dark:bg-[#111722] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#93a5c8]/50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                                type={showSecret ? "text" : "password"} 
                                placeholder={appSecret ? '' : "••••••••••••••••••••"}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">{showSecret ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </label>
                </div>

                <div className="h-px bg-slate-200 dark:bg-[#344465] my-2"></div>

                {/* Callback Configuration */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Callback Configuration</h4>
                        <p className="text-xs text-slate-500 dark:text-[#93a5c8] mt-1">
                            Copy these values and paste them into your Meta App settings under "Facebook Login" product settings.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Valid OAuth Redirect URI</span>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#344465] bg-slate-50 dark:bg-[#111722]/50 text-slate-600 dark:text-slate-400 text-sm font-mono cursor-not-allowed select-all outline-none" 
                                        readOnly 
                                        type="text" 
                                        value={redirectUri}
                                    />
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(redirectUri)}
                                    className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-[#243047] text-slate-700 dark:text-white hover:bg-primary hover:text-white dark:hover:bg-primary transition-all gap-2 min-w-[100px] group active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                    <span className="text-sm font-semibold">Copy</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">App Domain</span>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#344465] bg-slate-50 dark:bg-[#111722]/50 text-slate-600 dark:text-slate-400 text-sm font-mono cursor-not-allowed select-all outline-none" 
                                        readOnly 
                                        type="text" 
                                        value={appDomain}
                                    />
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(appDomain)}
                                    className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-[#243047] text-slate-700 dark:text-white hover:bg-primary hover:text-white dark:hover:bg-primary transition-all gap-2 min-w-[100px] group active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                    <span className="text-sm font-semibold">Copy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-[#344465] bg-slate-50 dark:bg-[#1a2232] rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-[#93a5c8]">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    <span className="text-sm">Changes are not saved until tested.</span>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Test Button */}
                    <button 
                        onClick={handleTest}
                        disabled={testing || !appId || !appSecret}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-500/20 ${testing || !appId || !appSecret ? 'bg-primary/50 cursor-not-allowed text-white/50' : 'bg-primary text-white hover:bg-blue-600 active:bg-blue-700'}`}
                    >
                        {testing ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">cable</span>}
                        {testing ? 'Testing...' : 'Test Integration'}
                    </button>
                    
                    {/* Save Button */}
                    <button 
                        onClick={handleSave}
                        disabled={loading || connectionStatus !== 'connected'}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border font-bold text-sm transition-all ${loading || connectionStatus !== 'connected' ? 'bg-slate-200 dark:bg-[#243047]/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border-transparent' : 'bg-white dark:bg-[#243047] text-slate-700 dark:text-white border-slate-300 dark:border-[#344465] hover:bg-slate-50 dark:hover:bg-[#2f3e5b]'}`}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}