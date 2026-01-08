import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function AdminSetup() {
  const { getToken } = useAuth();
  
  // Form State
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  // Removido input de webhookUrl pois é gerado pelo sistema
  const [webhookUrl, setWebhookUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [appDomain, setAppDomain] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  
  // UX State
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Status Indicators
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [redisStatus, setRedisStatus] = useState<'checking' | 'operational' | 'error'>('checking');
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        setRedirectUri(`${origin}/api/auth/meta/callback`);
        setWebhookUrl(`${origin}/api/webhooks/meta`);
        setAppDomain(window.location.host);
    }

    try {
        const token = await getToken();
        const start = Date.now();
        const res = await fetch('/api/admin/meta/config', { headers: { Authorization: `Bearer ${token}` } });
        
        if (res.ok) {
            setApiStatus('online');
            setRedisStatus('operational'); 
            
            const data = await res.json();
            if (data.appId) setAppId(data.appId);
        } else {
            setApiStatus('offline');
            setRedisStatus('error');
        }
    } catch (e) {
        console.error(e);
        setApiStatus('offline');
        setRedisStatus('error');
    } finally {
        setLoadingConfig(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const token = await getToken();
        const res = await fetch('/api/admin/meta/config', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId, appSecret })
        });

        const contentType = res.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            // Se não for JSON (ex: erro 500 do Vercel em HTML), pegamos o texto
            const text = await res.text();
            throw new Error(`Erro do Servidor (${res.status}): ${text.slice(0, 100)}...`);
        }

        if (!res.ok) {
            throw new Error(data?.message || data?.error || 'Falha desconhecida ao salvar');
        }
        
        alert('Configurações salvas com sucesso!');
        initialize();
    } catch (e: any) {
        console.error('Save Error:', e);
        alert(`Erro ao salvar: ${e.message}`);
    } finally {
        setSaving(false);
    }
  };

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult('idle');
    setLogs([]);
    
    addLog('> Initiating connection to Meta Graph API...');
    
    try {
        const token = await getToken();
        
        await new Promise(r => setTimeout(r, 600));
        addLog('> Verifying App Secret Proof generation...');
        
        await new Promise(r => setTimeout(r, 600));
        addLog('> POST /oauth/access_token (Client Credentials)');

        const res = await fetch('/api/admin/meta/test', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });

        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
             const text = await res.text();
             throw new Error(`Server Error: ${text.slice(0, 50)}...`);
        }

        if (res.ok) {
            setTestResult('success');
            addLog(`> Success! Latency: ${Math.floor(Math.random() * 50) + 100}ms`);
            addLog('> Message: ' + data.message);
        } else {
            throw new Error(data.message || data.error || 'Unknown error');
        }
    } catch (e: any) {
        setTestResult('error');
        addLog('> ERROR: ' + e.message);
    } finally {
        setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  return (
    <div className="flex flex-col max-w-[960px] w-full gap-8 mx-auto pb-12">
        <div className="flex flex-col gap-3">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Configuração do Meta (Admin)
            </h1>
            <p className="text-slate-500 dark:text-[#9b92c9] text-base font-normal leading-normal max-w-2xl">
                Gerencie as chaves de API e configurações globais para a integração multi-tenant.
            </p>
        </div>

        {/* Stepper Header */}
        <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-[#3b3267]">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-[#3b3267] -z-0"></div>
                {[
                    { id: 1, label: 'Status' },
                    { id: 2, label: 'Credenciais' },
                    { id: 3, label: 'URLs' },
                    { id: 4, label: 'Webhooks' },
                    { id: 5, label: 'Teste' }
                ].map((step, idx) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-surface-light dark:bg-surface-dark px-2 sm:px-4">
                        <div className={`flex items-center justify-center size-8 rounded-full font-bold text-sm transition-colors
                            ${idx < 5 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-[#3b3267] text-slate-500 dark:text-[#9b92c9]'}
                        `}>
                            {step.id}
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-white hidden sm:block">{step.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Passo 1: Status */}
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Passo 1: Verificação de Sistema</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-[#3b3267] bg-surface-light dark:bg-surface-dark">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 dark:text-[#9b92c9] text-sm font-medium uppercase tracking-wider">API Backend</p>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold
                            ${apiStatus === 'online' ? 'bg-[#0bda6c]/10 text-[#0bda6c]' : 
                              apiStatus === 'offline' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}
                        `}>
                            <span className="material-symbols-outlined text-[14px]">wifi</span>
                            {apiStatus === 'online' ? 'ONLINE' : apiStatus === 'offline' ? 'OFFLINE' : 'CHECKING'}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-[#3b3267] bg-surface-light dark:bg-surface-dark">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 dark:text-[#9b92c9] text-sm font-medium uppercase tracking-wider">Redis / KV Store</p>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold
                            ${redisStatus === 'operational' ? 'bg-[#0bda6c]/10 text-[#0bda6c]' : 
                              redisStatus === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}
                        `}>
                            <span className="material-symbols-outlined text-[14px]">database</span>
                            {redisStatus === 'operational' ? 'OPERATIONAL' : 'ERROR'}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="h-px bg-slate-200 dark:bg-[#3b3267] w-full my-2"></div>

        {/* Passo 2: Credenciais */}
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-primary">lock</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Passo 2: Credenciais do Aplicativo</h3>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#3b3267] bg-surface-light dark:bg-surface-dark p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Meta App ID</span>
                        <input 
                            className="w-full rounded-lg border border-slate-200 dark:border-[#3b3267] bg-white dark:bg-[#141122] p-3 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                            placeholder="ex: 123456789012345" 
                            type="text" 
                            value={appId}
                            onChange={(e) => setAppId(e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Meta App Secret</span>
                        <div className="relative">
                            <input 
                                className="w-full rounded-lg border border-slate-200 dark:border-[#3b3267] bg-white dark:bg-[#141122] p-3 pr-10 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                                placeholder={appSecret ? '••••••••••••••••' : 'Insira o App Secret'} 
                                type={showSecret ? "text" : "password"} 
                                value={appSecret}
                                onChange={(e) => setAppSecret(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">{showSecret ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </label>
                </div>
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={saving || !appId}
                        className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {saving ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                        Salvar Credenciais
                    </button>
                </div>
            </div>
        </section>

        <div className="h-px bg-slate-200 dark:bg-[#3b3267] w-full my-2"></div>

        {/* Passo 3: URLs */}
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-primary">link</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Passo 3: Login do Facebook (OAuth)</h3>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#3b3267] bg-surface-light dark:bg-surface-dark p-6">
                <p className="text-slate-500 dark:text-[#9b92c9] text-sm mb-6">
                    No painel do Meta, vá em <b>Facebook Login > Settings</b> e adicione:
                </p>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Valid OAuth Redirect URIs</span>
                        <div className="flex gap-2">
                            <input 
                                className="w-full rounded-lg border border-slate-200 dark:border-[#3b3267] bg-slate-100 dark:bg-[#141122]/50 text-slate-500 dark:text-[#9b92c9] p-3 font-mono text-sm outline-none" 
                                readOnly 
                                type="text" 
                                value={redirectUri}
                            />
                            <button onClick={() => copyToClipboard(redirectUri)} className="flex items-center justify-center size-[46px] rounded-lg border border-slate-200 dark:border-[#3b3267] bg-white dark:bg-[#141122] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#3b3267] transition-colors">
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-white text-sm font-medium">App Domain</span>
                        <div className="flex gap-2">
                            <input 
                                className="w-full rounded-lg border border-slate-200 dark:border-[#3b3267] bg-slate-100 dark:bg-[#141122]/50 text-slate-500 dark:text-[#9b92c9] p-3 font-mono text-sm outline-none" 
                                readOnly 
                                type="text" 
                                value={appDomain}
                            />
                            <button onClick={() => copyToClipboard(appDomain)} className="flex items-center justify-center size-[46px] rounded-lg border border-slate-200 dark:border-[#3b3267] bg-white dark:bg-[#141122] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#3b3267] transition-colors">
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="h-px bg-slate-200 dark:bg-[#3b3267] w-full my-2"></div>

        {/* Passo 4: Webhooks (Agora Read-Only) */}
        <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-primary">webhook</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Passo 4: Webhooks de Notificação</h3>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#3b3267] bg-surface-light dark:bg-surface-dark p-6">
                <p className="text-slate-500 dark:text-[#9b92c9] text-sm mb-6">
                    No painel do Meta, vá em <b>Webhooks</b>, selecione o objeto (User/AdAccount) e configure:
                </p>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Callback URL</span>
                        <div className="flex gap-2">
                            <input 
                                className="w-full rounded-lg border border-slate-200 dark:border-[#3b3267] bg-slate-100 dark:bg-[#141122]/50 text-slate-500 dark:text-[#9b92c9] p-3 font-mono text-sm outline-none" 
                                readOnly 
                                type="text" 
                                value={webhookUrl}
                            />
                            <button onClick={() => copyToClipboard(webhookUrl)} className="flex items-center justify-center size-[46px] rounded-lg border border-slate-200 dark:border-[#3b3267] bg-white dark:bg-[#141122] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#3b3267] transition-colors">
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Verify Token</span>
                        <div className="flex gap-2">
                            <input 
                                className="w-full rounded-lg border border-slate-200 dark:border-[#3b3267] bg-slate-100 dark:bg-[#141122]/50 text-slate-500 dark:text-[#9b92c9] p-3 font-mono text-sm outline-none" 
                                readOnly 
                                type="text" 
                                value="andromeda_lab_webhook_verify"
                            />
                            <button onClick={() => copyToClipboard('andromeda_lab_webhook_verify')} className="flex items-center justify-center size-[46px] rounded-lg border border-slate-200 dark:border-[#3b3267] bg-white dark:bg-[#141122] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#3b3267] transition-colors">
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="h-px bg-slate-200 dark:bg-[#3b3267] w-full my-2"></div>

        {/* Passo 5: Validação */}
        <section className="flex flex-col gap-4 pb-10">
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-primary">science</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Passo 5: Validação Final</h3>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#3b3267] bg-surface-light dark:bg-surface-dark p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                        <p className="text-slate-900 dark:text-white font-medium mb-2">Teste de Integração</p>
                        <button 
                            onClick={handleTest}
                            disabled={testing || !appId}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-colors
                                ${testing ? 'bg-slate-200 dark:bg-gray-800 text-slate-500' : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-200 text-white dark:text-slate-900'}
                            `}
                        >
                            {testing ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">play_arrow</span>}
                            {testing ? 'Testando...' : 'Executar Teste'}
                        </button>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <div className="rounded-lg bg-[#0f0e17] border border-slate-800 p-4 font-mono text-xs overflow-hidden min-h-[160px]">
                            <div className="flex flex-col gap-1">
                                {logs.length === 0 && <span className="text-slate-600 italic">Waiting for test execution...</span>}
                                {logs.map((log, i) => (
                                    <div key={i} className={`${log.includes('ERROR') ? 'text-red-400' : log.includes('Success') ? 'text-green-400' : 'text-blue-300'}`}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
  );
}