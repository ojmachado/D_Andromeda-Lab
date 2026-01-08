import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CircleCheck, Circle, ArrowRight, Loader2, ChartBar } from 'lucide-react';
import { MetaBusiness, MetaAdAccount, MetaInsight } from '../shared/types';

export default function Wizard() {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // Step State (1-5)
  const [step, setStep] = useState(parseInt(searchParams.get('step') || '1'));
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [businesses, setBusinesses] = useState<MetaBusiness[]>([]);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [insights, setInsights] = useState<MetaInsight[] | null>(null);
  
  // Selection State
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Sync step from URL
  useEffect(() => {
    const urlStep = parseInt(searchParams.get('step') || '1');
    setStep(urlStep);
  }, [searchParams]);

  // Actions
  const connectMeta = async () => {
    setLoading(true);
    try {
        const token = await getToken();
        const res = await fetch(`/api/auth/meta/start?workspaceId=${workspaceId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url; // Redirect to Meta
    } catch (e) {
        alert('Erro ao iniciar conexão');
    }
  };

  const loadBusinesses = async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch(`/api/w/meta/rpc?action=businesses&workspaceId=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setBusinesses(data.data || []);
    setLoading(false);
  };

  const loadAdAccounts = async (bizId?: string) => {
    setLoading(true);
    const token = await getToken();
    const url = `/api/w/meta/rpc?action=adaccounts&workspaceId=${workspaceId}${bizId ? `&businessId=${bizId}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAdAccounts(data.data || []);
    setLoading(false);
  };

  const saveSelection = async () => {
    if(!selectedAccount) return;
    setLoading(true);
    const account = adAccounts.find(a => a.id === selectedAccount);
    const token = await getToken();
    
    await fetch(`/api/w/meta/rpc?action=select&workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessId: selectedBusiness,
            adAccountId: selectedAccount,
            currency: account?.currency,
            timezone: account?.timezone_name
        })
    });
    setLoading(false);
    navigate(`/w/${workspaceId}/setup?step=4`);
  };

  const runTest = async () => {
    setLoading(true);
    const token = await getToken();
    // Teste dos últimos 7 dias
    const today = new Date();
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
    
    const since = lastWeek.toISOString().split('T')[0];
    const until = today.toISOString().split('T')[0];
    
    const res = await fetch(`/api/w/meta/rpc?action=insights&workspaceId=${workspaceId}&adAccountId=${selectedAccount}&since=${since}&until=${until}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setInsights(data.data || []);
    setLoading(false);
  };

  // Effects based on step
  useEffect(() => {
    if (step === 2) loadBusinesses();
    if (step === 3) loadAdAccounts(selectedBusiness); // Load accounts immediately if no business selected, or wait
  }, [step]);

  // Render Helpers
  const StepIcon = ({ s, label }: { s: number, label: string }) => {
    const active = step === s;
    const done = step > s;
    return (
        <div className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${active ? 'border-primary bg-surface text-primary' : done ? 'border-primary bg-primary text-white' : 'border-gray-700 bg-surface text-gray-700'}`}>
                {done ? <CircleCheck size={20} /> : <span className="font-bold">{s}</span>}
            </div>
            <span className={`text-xs font-medium ${active || done ? 'text-white' : 'text-gray-600'}`}>{label}</span>
        </div>
    )
  };

  return (
    <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="relative flex justify-between mb-12 px-10">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-800 -z-0"></div>
            <div className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
            <StepIcon s={1} label="Conectar" />
            <StepIcon s={2} label="Business" />
            <StepIcon s={3} label="Conta" />
            <StepIcon s={4} label="Teste" />
            <StepIcon s={5} label="Conclusão" />
        </div>

        {/* Content */}
        <div className="bg-surface border border-border rounded-2xl p-8 min-h-[400px]">
            {loading && <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}

            {step === 1 && (
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 5.0 3.66 9.12 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.12 22 17 22 12c0-5.52-4.48-10-10-10z"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Conecte sua conta Meta</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">Precisamos de permissão para ler suas campanhas e insights. Seus dados são criptografados com segurança nível militar.</p>
                    <button onClick={connectMeta} className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105">
                        Continuar com Facebook
                    </button>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Selecione o Business Manager (Opcional)</h2>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                        {businesses.map(biz => (
                            <div key={biz.id} onClick={() => setSelectedBusiness(biz.id)} 
                                className={`p-4 rounded-lg border cursor-pointer flex items-center justify-between ${selectedBusiness === biz.id ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500'}`}>
                                <span className="font-medium">{biz.name}</span>
                                <span className="text-xs text-gray-500">ID: {biz.id}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3">
                         <button onClick={() => { setSelectedBusiness(''); navigate(`/w/${workspaceId}/setup?step=3`); }} className="text-gray-400 hover:text-white px-4">Pular</button>
                         <button onClick={() => { loadAdAccounts(selectedBusiness); navigate(`/w/${workspaceId}/setup?step=3`); }} disabled={!selectedBusiness} className="bg-primary px-6 py-2 rounded-lg text-white disabled:opacity-50">Próximo</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Selecione a Conta de Anúncios</h2>
                    <div className="grid grid-cols-1 gap-3 mb-6 max-h-[300px] overflow-y-auto">
                        {adAccounts.map(acc => (
                            <div key={acc.id} onClick={() => setSelectedAccount(acc.id)} 
                                className={`p-4 rounded-lg border cursor-pointer flex flex-col ${selectedAccount === acc.id ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500'}`}>
                                <span className="font-medium">{acc.name}</span>
                                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                                    <span>ID: {acc.id}</span>
                                    <span>{acc.currency}</span>
                                    <span>{acc.timezone_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                         <button onClick={saveSelection} disabled={!selectedAccount} className="bg-primary px-6 py-2 rounded-lg text-white disabled:opacity-50">Confirmar Seleção</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-6">Teste de Conexão</h2>
                    {!insights ? (
                        <button onClick={runTest} className="bg-secondary hover:bg-indigo-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 mx-auto">
                            <ChartBar /> Rodar Diagnóstico
                        </button>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg mb-6 inline-flex items-center gap-2 text-green-400">
                                <CircleCheck size={20} /> Sucesso! Recuperamos {insights.length} dias de dados.
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-8 text-left">
                                <div className="bg-background p-4 rounded border border-border">
                                    <p className="text-gray-500 text-xs uppercase">Spend</p>
                                    <p className="text-xl font-bold text-white">{insights[0]?.spend || 0}</p>
                                </div>
                                <div className="bg-background p-4 rounded border border-border">
                                    <p className="text-gray-500 text-xs uppercase">Impressions</p>
                                    <p className="text-xl font-bold text-white">{insights[0]?.impressions || 0}</p>
                                </div>
                                <div className="bg-background p-4 rounded border border-border">
                                    <p className="text-gray-500 text-xs uppercase">Clicks</p>
                                    <p className="text-xl font-bold text-white">{insights[0]?.clicks || 0}</p>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/w/${workspaceId}/setup?step=5`)} className="bg-primary px-8 py-2 rounded-lg text-white">Finalizar</button>
                        </div>
                    )}
                </div>
            )}

            {step === 5 && (
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CircleCheck className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Tudo pronto!</h2>
                    <p className="text-gray-400 mb-8">O Andromeda Lab está sincronizado com sua conta.</p>
                    <button onClick={() => navigate(`/w/${workspaceId}/dashboard`)} className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded-lg flex items-center gap-2 mx-auto">
                        Ir para Dashboard <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}