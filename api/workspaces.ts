import { kv, KEYS } from './_lib/kv';
import { getUser, isMasterAdmin, sendError } from './_lib/auth';
import { Workspace } from '../shared/types';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  try {
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Usuário não autenticado');

    if (req.method === 'GET') {
      // Listar Workspaces
      const workspaceIds = await kv.lrange(KEYS.USER_WORKSPACES(user.userId), 0, -1);
      const workspaces = [];
      
      for (const id of workspaceIds) {
        const ws = await kv.get<Workspace>(KEYS.WORKSPACE(id));
        if (ws) workspaces.push(ws);
      }
      
      return res.status(200).json(workspaces);
    }

    if (req.method === 'POST') {
      // Criar Workspace
      const body = req.body;
      if (!body.name) return sendError(res, 400, 'validation_error', 'Nome é obrigatório');

      const id = crypto.randomUUID();
      const newWorkspace: Workspace = {
        id,
        name: body.name,
        ownerId: user.userId,
        createdAt: Date.now(),
        meta: { status: 'disconnected' }
      };

      await kv.set(KEYS.WORKSPACE(id), newWorkspace);
      await kv.lpush(KEYS.USER_WORKSPACES(user.userId), id);

      return res.status(201).json(newWorkspace);
    }

    if (req.method === 'DELETE') {
      const isMaster = await isMasterAdmin(user.userId);
      if (isMaster) {
        return sendError(res, 403, 'forbidden', 'PROTEÇÃO DE SISTEMA: O Master User não pode excluir workspaces.');
      }

      const { id } = req.query;
      if (!id) return sendError(res, 400, 'missing_id', 'ID necessário');

      const ws = await kv.get<Workspace>(KEYS.WORKSPACE(id));
      if (!ws || ws.ownerId !== user.userId) return sendError(res, 403, 'forbidden', 'Acesso negado');

      await kv.del(KEYS.WORKSPACE(id));
      // Nota: Não estamos removendo da lista para simplificar, o GET filtra nulos.
      
      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'method_not_allowed', 'Método não permitido');
  } catch (error: any) {
    console.error('Workspaces API Error:', error);
    return sendError(res, 500, 'server_error', error.message);
  }
}