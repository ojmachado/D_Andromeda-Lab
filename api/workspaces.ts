import { kv, KEYS } from './_lib/kv';
import { getUser, isMasterAdmin, errorResponse } from './_lib/auth';
import { Workspace } from '../shared/types';
import crypto from 'crypto';

export default async function handler(req: Request) {
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorized', 'Usuário não autenticado');

  try {
    if (req.method === 'GET') {
      // Listar Workspaces
      const workspaceIds = await kv.lrange(KEYS.USER_WORKSPACES(user.userId), 0, -1);
      const workspaces = [];
      
      for (const id of workspaceIds) {
        const ws = await kv.get<Workspace>(KEYS.WORKSPACE(id));
        if (ws) workspaces.push(ws);
      }
      
      return new Response(JSON.stringify(workspaces), { headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      // Criar Workspace
      const body = await req.json();
      if (!body.name) return errorResponse(400, 'validation_error', 'Nome é obrigatório');

      const id = crypto.randomUUID();
      const newWorkspace: Workspace = {
        id,
        name: body.name,
        ownerId: user.userId,
        createdAt: Date.now(),
        meta: { status: 'disconnected' }
      };

      // Transaction: Salvar WS e adicionar à lista do usuário
      await kv.set(KEYS.WORKSPACE(id), newWorkspace);
      await kv.lpush(KEYS.USER_WORKSPACES(user.userId), id);

      return new Response(JSON.stringify(newWorkspace), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      // Regra de Negócio: O Usuário Master não pode ser excluído (nem seus dados vitais)
      const isMaster = await isMasterAdmin(user.userId);
      if (isMaster) {
        return errorResponse(403, 'forbidden', 'PROTEÇÃO DE SISTEMA: O Master User e seus workspaces não podem ser excluídos.');
      }

      const url = new URL(req.url);
      const workspaceId = url.searchParams.get('id');

      if (!workspaceId) return errorResponse(400, 'missing_id', 'ID do workspace necessário');

      // Verifica propriedade
      const ws = await kv.get<Workspace>(KEYS.WORKSPACE(workspaceId));
      if (!ws || ws.ownerId !== user.userId) return errorResponse(403, 'forbidden', 'Acesso negado');

      // Remove do KV
      await kv.del(KEYS.WORKSPACE(workspaceId));
      
      // Nota: Em um sistema real, removeríamos também da lista USER_WORKSPACES usando lrem,
      // mas o ioredis/KV simplificado requer manipulação de lista. 
      // Para este MVP, deixamos o registro na lista mas o get retornará null e será filtrado no GET.
      
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    // Retorna JSON estruturado em vez de crashar, permitindo que o frontend exiba a mensagem
    return errorResponse(500, 'server_error', 'Erro interno ao processar requisição. Verifique logs/conexão Redis.', { originalError: error.message });
  }

  return errorResponse(405, 'method_not_allowed', 'Método não permitido');
}