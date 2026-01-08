import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Workspace } from '../shared/types';
import { Loader2, Plus, ArrowRight, Trash2, ShieldCheck } from 'lucide-react';

export default function WorkspacesList() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Verifica se é o Master User no frontend para controle de UI
  const isMaster = user?.emailAddresses.some(
    e => e.emailAddress.toLowerCase() === 'ojmachadomkt@gmail.com'
  );

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Falha ao carregar workspaces');
      const data = await res.json();
      setWorkspaces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro desconhecido ao criar workspace');
      }
      
      if (!data.id) {
        throw new Error('Resposta inválida do servidor: ID do workspace ausente');
      }

      navigate(`/w/${data.id}/setup`);
    } catch (e: any) {
      console.error('Create error:', e);
      alert(`Erro: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Previne navegação ao clicar no botão
    if (!confirm('Tem certeza? Esta ação é irreversível.')) return;

    try {
      const token = await getToken();
      const res = await fetch(`/api/workspaces?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Exibe o erro vindo da API (ex: Proteção do Master User)
        alert(`Erro: ${data.message || 'Não foi possível excluir'}`);
        return;
      }

      // Atualiza lista local
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      alert('Erro de conexão ao tentar excluir.');
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Seus Workspaces</h2>
          {isMaster && (
            <span className="bg-primary/20 text-primary border border-primary/30 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> Master Account Protected
            </span>
          )}
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <Plus size={18} /> Novo Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <h3 className="text-gray-400 text-lg">Nenhum workspace encontrado.</h3>
            <button onClick={() => setShowModal(true)} className="text-primary mt-2 hover:underline">Crie o primeiro agora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <div key={ws.id} onClick={() => navigate(ws.meta.status === 'configured' ? `/w/${ws.id}/dashboard` : `/w/${ws.id}/setup`)} 
                 className="bg-surface border border-border p-6 rounded-xl hover:border-primary cursor-pointer transition group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition"></div>
                
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-white mb-2">{ws.name}</h3>
                    {/* Só exibe botão de excluir se NÃO for Master User */}
                    {!isMaster && (
                      <button 
                        onClick={(e) => handleDelete(e, ws.id)}
                        className="text-gray-600 hover:text-red-500 p-1 rounded transition z-20"
                        title="Excluir Workspace"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${ws.meta.status === 'configured' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {ws.meta.status === 'configured' ? 'Ativo' : 'Configuração Pendente'}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <ArrowRight className="text-gray-600 group-hover:text-primary transition" />
                </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-surface border border-border p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Criar Novo Workspace</h3>
            <input 
              autoFocus
              type="text" 
              placeholder="Nome do cliente (ex: Coca-Cola)" 
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary mb-6"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={creating || !newName} className="bg-primary px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50">
                    {creating ? 'Criando...' : 'Criar Workspace'}
                </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}