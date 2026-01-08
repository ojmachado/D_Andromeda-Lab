import { kv, KEYS } from './_lib/kv';
import { getUser, errorResponse } from './_lib/auth';
import { Workspace } from '../shared/types';
import crypto from 'crypto';

export default async function handler(req: Request) {
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorized', 'Usuário não autenticado');

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

  return errorResponse(405, 'method_not_allowed', 'Método não permitido');
}