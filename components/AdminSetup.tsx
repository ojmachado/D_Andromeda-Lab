import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function AdminSetup() {
  const { getToken } = useAuth();
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('Carregando...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar config existente (parcial)
    getToken().then(token => {
        fetch('/api/admin/meta/config', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if(data.appId) setAppId(data.appId);
                if(data.redirectUri) setRedirectUri(data.redirectUri);
            });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const token = await getToken();
        await fetch('/api/admin/meta/config', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId, appSecret })
        });
        alert('Configurações salvas!');
    } catch (e) {
        alert('Erro ao salvar');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Configuração do Meta App</h2>
        
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-8 text-sm text-blue-200">
            <p className="font-bold mb-2">Instruções:</p>
            <ol className="list-decimal list-inside space-y-1">
                <li>Acesse developers.facebook.com e crie um App do tipo "Business".</li>
                <li>Em "Facebook Login for Business", adicione a Redirect URI abaixo.</li>
                <li>Copie o App ID e App Secret e cole nos campos abaixo.</li>
            </ol>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Redirect URI (Callback)</label>
                <div className="flex gap-2">
                    <code className="flex-1 bg-background p-3 rounded border border-border font-mono text-sm overflow-x-auto">{redirectUri}</code>
                    <button onClick={() => navigator.clipboard.writeText(redirectUri)} className="bg-border px-3 rounded hover:bg-gray-700">Copiar</button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">App ID</label>
                    <input value={appId} onChange={e => setAppId(e.target.value)} type="text" className="w-full bg-background border border-border rounded p-3 text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">App Secret</label>
                    <input value={appSecret} onChange={e => setAppSecret(e.target.value)} type="password" placeholder="••••••••••••" className="w-full bg-background border border-border rounded p-3 text-white" />
                </div>
                <button disabled={loading} className="w-full bg-primary py-3 rounded-lg font-bold text-white hover:bg-blue-600 transition">
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </form>
        </div>
    </div>
  );
}