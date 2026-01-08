import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Search, 
  Check, 
  Zap, 
  CheckCircle2,
  Facebook,
  Lock,
  Eye,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  RefreshCcw,
  Rocket,
  ReceiptText,
  BadgeCheck,
  Settings,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { MetaBusiness, MetaAdAccount, MetaInsight } from '../shared/types';

export default function Wizard() {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // Step State (1-5)
  const [step, setStep] = useState(parseInt(searchParams.get('step') || '1'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [businesses, setBusinesses] = useState<MetaBusiness[]>([]);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [insights, setInsights] = useState<MetaInsight[] | null>(null);
  
  // Selection State
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync step from URL
  useEffect(() => {
    const urlStep = parseInt(searchParams.get('step') || '1');
    setStep(urlStep);
    setSearchTerm('');
    setError(null); // Clear errors on step change
  }, [searchParams]);

  // Actions
  const connectMeta = async () => {
    setLoading(true);
    setError(null);
    try {
        const token = await getToken();
        const res = await fetch(`/api/auth/meta/start?workspaceId=${workspaceId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url; 
        } else {
            throw new Error(data.message || 'Falha ao obter URL de autenticação');
        }
    } catch (e: any) {
        setError(e.message || 'Erro ao iniciar conexão');
        setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
        const token = await getToken();
        const res = await fetch(`/api/w/meta/rpc?action=businesses&workspaceId=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao carregar negócios');
        setBusinesses(data.data || []);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const loadAdAccounts = async (bizId?: string) => {
    setLoading(true);
    setError(null);
    try {
        const token = await getToken();
        const url = `/api/w/meta/rpc?action=adaccounts&workspaceId=${workspaceId}${bizId ? `&businessId=${bizId}` : ''}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao carregar contas de anúncio');
        setAdAccounts(data.data || []);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const saveSelection = async () => {
    if(!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
        const account = adAccounts.find(a => a.id === selectedAccount);
        const token = await getToken();
        
        const res = await fetch(`/api/w/meta/rpc?action=select&workspaceId=${workspaceId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                businessId: selectedBusiness,
                adAccountId: selectedAccount,
                currency: account?.currency,
                timezone: account?.timezone_name
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Erro ao salvar seleção');
        }

        navigate(`/w/${workspaceId}/setup?step=4`);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const runTest = async () => {
    setLoading(true);
    setError(null); // Limpa erros anteriores
    setInsights(null); // Reseta insights
    try {
        const token = await getToken();
        const today = new Date();
        const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
        
        const since = lastWeek.toISOString().split('T')[0];
        const until = today.toISOString().split('T')[0];
        
        const res = await fetch(`/api/w/meta/rpc?action=insights&workspaceId=${workspaceId}&adAccountId=${selectedAccount}&since=${since}&until=${until}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Tratamento robusto de resposta não-JSON (ex: erro de infraestrutura)
        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            throw new Error(`Erro do Servidor (${res.status}): ${text.slice(0, 100)}`);
        }

        if (!res.ok) {
            // Usa a mensagem específica retornada pela API do Meta via Backend
            throw new Error(data.message || data.error || 'Falha na comunicação com a API do Meta');
        }
        
        setInsights(data.data || []);
    } catch (e: any) {
        // Exibe a mensagem de erro específica para o usuário
        setError(e.message || 'Erro desconhecido ao testar insights.');
    } finally {
        setLoading(false);
    }
  };

  // Effects based on step
  useEffect(() => {
    if (step === 2) loadBusinesses();
    if (step === 3) loadAdAccounts(selectedBusiness);
  }, [step]);

  // Filters
  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.id.includes(searchTerm)
  );

  const filteredAdAccounts = adAccounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.id.includes(searchTerm)
  );

  const selectedAccountData = adAccounts.find(a => a.id === selectedAccount);

  // Helper for Stepper
  const steps = [
      { id: 1, label: 'Conexão' },
      { id: 2, label: 'Negócio' },
      { id: 3, label: 'Conta' },
      { id: 4, label: 'Insights' },
      { id: 5, label: 'Conclusão' }
  ];

  return (
    <div className="max-w-[960px] mx-auto flex flex-col gap-8">
        
        {/* Global Node Stepper */}
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between w-full px-4">
                {/* Connecting Lines */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 dark:bg-[#1a2332] -z-10"></div>
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-500"
                    style={{ width: `${((step - 1) / 4) * 100}%` }}
                ></div>

                {steps.map((s) => {
                    const isActive = s.id === step;
                    const isCompleted = s.id < step;
                    return (
                        <div key={s.id} className="flex flex-col items-center gap-2 bg-background-light dark:bg-background-dark px-2">
                            <div 
                                className={`size-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all 
                                ${isCompleted ? 'bg-primary border-primary text-white' : 
                                  isActive ? 'bg-background-dark border-primary text-primary shadow-[0_0_0_4px_rgba(23,84,207,0.2)]' : 
                                  'bg-surface-light dark:bg-[#1a2332] border-slate-300 dark:border-[#2a364d] text-slate-500'}`}
                            >
                                {isCompleted ? <Check size={16} /> : s.id}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${isActive || isCompleted ? 'text-primary' : 'text-slate-500'}`}>
                                {s.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Dynamic Content Area (No Card Wrapper on Step 5 for Layout flexibility) */}
        {step !== 5 ? (
            <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl shadow-xl flex flex-col relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-20 flex items-center justify-center rounded-xl backdrop-blur-sm">
                        <Loader2 className="animate-spin text-primary w-10 h-10" />
                    </div>
                )}
                
                {/* Global Error Banner inside Card */}
                {error && (
                    <div className="absolute top-0 left-0 w-full p-4 z-10">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-900 dark:text-red-300">Erro na operação</h4>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
                                <XCircle size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center p-8">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                            <Facebook className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Conectar Conta Meta</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                            Precisamos de permissão para ler suas campanhas e insights. Seus dados são criptografados com segurança.
                        </p>
                        <button onClick={connectMeta} className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 flex items-center gap-2">
                            Continuar com Facebook
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-6 sm:p-10 flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Selecione uma conta Meta Business
                            </h1>
                            <p className="text-slate-500 dark:text-gray-400 text-base leading-relaxed max-w-2xl">
                                Escolha o Gerenciador de Negócios que deseja associar a este workspace. Isso conecta suas contas de anúncios e pixels.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={20} />
                                </div>
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-border rounded-lg bg-slate-50 dark:bg-[#111722] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="Buscar negócios por nome ou ID"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-h-[300px]">
                            {filteredBusinesses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                                    <Search size={32} className="mb-2 opacity-50" />
                                    <p>Nenhum negócio encontrado.</p>
                                </div>
                            ) : (
                                filteredBusinesses.map(biz => {
                                    const isSelected = selectedBusiness === biz.id;
                                    return (
                                        <label 
                                            key={biz.id}
                                            onClick={() => setSelectedBusiness(biz.id)}
                                            className={`group relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-border bg-white dark:bg-[#111722] hover:border-primary/50'}`}
                                        >
                                            <div className="mt-1">
                                                <div className={`h-5 w-5 rounded-full border-2 relative flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-500'}`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-slate-900 dark:text-white font-semibold truncate">{biz.name}</p>
                                                    {isSelected && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Selecionado</span>}
                                                </div>
                                                <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">ID: {biz.id}</p>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-4 border-t border-slate-200 dark:border-border gap-4">
                            <button 
                                onClick={() => navigate(`/w/${workspaceId}/setup?step=1`)}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-slate-600 dark:text-gray-300 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111722] transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} /> Voltar
                            </button>
                            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => navigate(`/w/${workspaceId}/setup?step=3`)}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-medium transition-colors text-sm"
                                >
                                    Pular por enquanto
                                </button>
                                <button 
                                    onClick={() => { loadAdAccounts(selectedBusiness); navigate(`/w/${workspaceId}/setup?step=3`); }}
                                    disabled={!selectedBusiness}
                                    className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selecionar e Continuar <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-6 sm:p-10 flex flex-col gap-6">
                        <div className="flex flex-col gap-2 mb-2">
                            <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-slate-900 dark:text-white">Vincular Conta de Anúncios</h1>
                            <p className="text-slate-500 dark:text-gray-400 text-base font-normal leading-normal">
                                Selecione a conta de anúncios do Meta que você deseja gerenciar neste workspace.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-white">Buscar Conta</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-gray-400">
                                    <Search size={20} />
                                </div>
                                <input 
                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-[#111722] border border-gray-200 dark:border-border rounded-lg text-slate-900 dark:text-white placeholder:text-gray-400 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                                    placeholder="Buscar por nome ou ID da conta (ex: 882910...)" 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 mb-2">
                            {filteredAdAccounts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Nenhuma conta de anúncios encontrada.
                                </div>
                            ) : (
                                filteredAdAccounts.map(acc => {
                                     const isSelected = selectedAccount === acc.id;
                                     return (
                                        <label key={acc.id} onClick={() => setSelectedAccount(acc.id)} className={`group relative flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all ${isSelected ? 'border-2 border-primary bg-primary/5' : 'border-gray-200 dark:border-border bg-gray-50 dark:bg-[#111722] hover:bg-gray-100 dark:hover:bg-[#1a2232]'}`}>
                                            <div className="flex h-5 w-5 items-center justify-center">
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-gray-400 dark:border-gray-600'}`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                                </div>
                                            </div>
                                            <div className="flex grow flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-slate-900 dark:text-white text-base font-bold leading-normal">{acc.name}</p>
                                                    <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">Ativa</span>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal font-mono">ID: {acc.id}</p>
                                            </div>
                                        </label>
                                     );
                                })
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-border mt-auto">
                             <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-gray-400">Moeda da Conta</label>
                                <div className="relative">
                                    <div className="w-full h-12 pl-4 pr-10 flex items-center bg-gray-100 dark:bg-[#111722] border border-gray-200 dark:border-border rounded-lg text-slate-500 dark:text-gray-400 font-mono text-sm">
                                        {selectedAccountData ? selectedAccountData.currency : 'Selecione uma conta'}
                                    </div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Lock size={16} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-gray-400">Fuso Horário</label>
                                <div className="relative">
                                    <div className="w-full h-12 pl-4 pr-10 flex items-center bg-gray-100 dark:bg-[#111722] border border-gray-200 dark:border-border rounded-lg text-slate-500 dark:text-gray-400 font-mono text-sm">
                                        {selectedAccountData ? selectedAccountData.timezone_name : 'Selecione uma conta'}
                                    </div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Lock size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6">
                            <button onClick={() => navigate(`/w/${workspaceId}/setup?step=2`)} className="px-6 py-3 rounded-lg text-slate-700 dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-[#1a2232] transition-colors flex items-center gap-2">
                                 <ArrowLeft size={20} /> Voltar
                            </button>
                            <div className="flex items-center gap-4">
                                <button onClick={saveSelection} disabled={!selectedAccount} className="px-8 py-3 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50">
                                    Continuar <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <>
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-border flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="max-w-xl">
                                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-white">Teste de Integração</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-base">
                                    Vamos verificar se conseguimos extrair métricas da sua conta Meta Ads. Clique no botão abaixo para buscar uma amostra de dados reais.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Ready to Test</span>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-[#0B0E14]/30 flex flex-col items-center justify-center gap-6 flex-1 relative">
                            {/* Specific error display for step 4 */}
                            {error && (
                                <div className="w-full max-w-2xl mb-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <XCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-900 dark:text-red-300">Falha na conexão com Meta API</h4>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                                        <button 
                                            onClick={() => setError(null)}
                                            className="text-xs font-medium text-red-600 dark:text-red-400 underline mt-2 hover:text-red-800"
                                        >
                                            Dispensar erro
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!insights ? (
                                <button 
                                    onClick={runTest} 
                                    className="group relative flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-8 rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                                >
                                    <Zap className="group-hover:animate-pulse" />
                                    <span>Testar Insights Agora</span>
                                </button>
                            ) : (
                                <div className="w-full animate-fade-in-up">
                                    {/* Success Banner */}
                                    <div className="rounded-lg border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 p-4 mb-6 flex items-start gap-4">
                                        <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-2 rounded-full shrink-0">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">Conexão Estabelecida com Sucesso!</h4>
                                            <p className="text-sm text-green-700 dark:text-green-400/80">
                                                Conseguimos conectar com a conta e recuperamos os dados dos últimos 7 dias.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-white dark:bg-background-dark border border-gray-100 dark:border-border shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Eye className="text-slate-400" size={16} />
                                                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Impressões</span>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(insights[0]?.impressions || 0)}
                                                </span>
                                                <span className="text-xs text-green-500 font-medium mb-1 flex items-center">
                                                    <TrendingUp size={14} className="mr-0.5" /> +12%
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 rounded-lg bg-white dark:bg-background-dark border border-gray-100 dark:border-border shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MousePointerClick className="text-slate-400" size={16} />
                                                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Cliques</span>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR').format(insights[0]?.clicks || 0)}
                                                </span>
                                                <span className="text-xs text-green-500 font-medium mb-1 flex items-center">
                                                     <TrendingUp size={14} className="mr-0.5" /> +5%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-lg bg-white dark:bg-background-dark border border-gray-100 dark:border-border shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DollarSign className="text-slate-400" size={16} />
                                                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Gasto</span>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights[0]?.spend || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex justify-center">
                                        <button 
                                            onClick={runTest}
                                            className="text-xs text-slate-500 hover:text-white underline underline-offset-2 flex items-center gap-1 transition-colors"
                                        >
                                            <RefreshCcw size={14} /> Testar novamente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 md:p-8 border-t border-gray-100 dark:border-border flex items-center justify-between">
                            <button 
                                onClick={() => navigate(`/w/${workspaceId}/setup?step=3`)} 
                                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft size={16} /> Voltar
                            </button>
                            <button 
                                onClick={() => navigate(`/w/${workspaceId}/setup?step=5`)}
                                disabled={!insights}
                                className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continuar <ArrowRight size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        ) : (
            // Step 5 Special Layout
            <div className="w-full max-w-2xl bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden mx-auto animate-fade-in-up">
                {/* Hero */}
                <div className="flex flex-col items-center pt-12 pb-8 px-8 text-center bg-gradient-to-b from-primary/5 to-transparent">
                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative shadow-[0_0_40px_-10px_rgba(23,84,207,0.5)]">
                        <Rocket className="text-primary animate-pulse" size={40} />
                        <div className="absolute -top-1 -right-2 text-yellow-400 animate-bounce delay-75">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                        </div>
                    </div>
                    <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
                        Sistemas prontos!
                    </h1>
                    <p className="text-slate-600 dark:text-gray-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                        Seu workspace foi inicializado com sucesso. Conectamos sua conta Meta Ads e configuramos as permissões.
                    </p>
                </div>

                {/* Summary */}
                <div className="px-8 pb-8">
                    <div className="bg-slate-50 dark:bg-[#111722] rounded-xl border border-slate-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold mb-4 flex items-center gap-2">
                            <ReceiptText size={18} /> Resumo da Configuração
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 items-center pb-4 border-b border-slate-200 dark:border-gray-800 last:border-0 last:pb-0">
                                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Conta de Anúncios</p>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck size={18} className="text-blue-500" />
                                    <p className="text-slate-900 dark:text-white text-base font-semibold">
                                        {selectedAccountData ? selectedAccountData.name : selectedAccount || 'Conta Principal'} 
                                        <span className="text-slate-400 font-normal ml-1">
                                            (ID: {selectedAccountData ? selectedAccountData.id : selectedAccount || '...'})
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 items-center pb-4 border-b border-slate-200 dark:border-gray-800 last:border-0 last:pb-0">
                                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Função Atribuída</p>
                                <div className="flex items-start">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        Admin
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 items-center">
                                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Status</p>
                                <p className="text-slate-900 dark:text-white text-base font-medium">Sincronização Ativa</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                            <button onClick={() => navigate(`/w/${workspaceId}/dashboard`)} className="group relative w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-3 bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-0.5">
                            <span>Ir para Dashboard</span>
                            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={20} />
                        </button>
                        <button onClick={() => setStep(3)} className="text-sm text-slate-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1 mt-2">
                            <Settings size={16} /> Revisar configurações
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}