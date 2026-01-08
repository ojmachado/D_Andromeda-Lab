import { kv, KEYS } from '../../_lib/kv';
import { getUser, sendError } from '../../_lib/auth';
import { decrypt } from '../../_lib/crypto';
import { getBusinesses, getAdAccounts, getInsights } from '../../_lib/meta';

export default async function handler(req: any, res: any) {
  try {
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    // Em Vercel Node, query params ficam em req.query
    const { action, workspaceId, businessId, adAccountId, since, until } = req.query;

    if (!workspaceId) return sendError(res, 400, 'missing_id', 'Workspace ID required');

    const ws = await kv.get<any>(KEYS.WORKSPACE(workspaceId));
    if (!ws || ws.ownerId !== user.userId) return sendError(res, 403, 'forbidden', 'Access denied');

    // Recupera Access Token
    if (!ws.meta?.accessToken) return sendError(res, 400, 'not_connected', 'Meta not connected');
    
    let accessToken;
    try {
      accessToken = decrypt(ws.meta.accessToken);
    } catch (e) {
      return sendError(res, 500, 'crypto_error', 'Invalid stored token');
    }

    if (req.method === 'GET') {
      if (action === 'businesses') {
        const data = await getBusinesses(accessToken);
        return res.status(200).json(data);
      }

      if (action === 'adaccounts') {
        const data = await getAdAccounts(accessToken, businessId);
        return res.status(200).json(data);
      }

      if (action === 'insights') {
        const targetAccountId = adAccountId || ws.meta.adAccountId;
        if (!targetAccountId) return sendError(res, 400, 'missing_account', 'Ad Account ID required');
        
        const data = await getInsights(accessToken, targetAccountId, since, until);
        if (data.error) {
           return sendError(res, 400, 'meta_error', data.error.message, data.error);
        }
        return res.status(200).json(data);
      }
    }

    if (req.method === 'POST' && action === 'select') {
      const body = req.body;
      ws.meta = {
        ...ws.meta,
        status: 'configured',
        businessId: body.businessId,
        adAccountId: body.adAccountId,
        currency: body.currency,
        timezone: body.timezone
      };
      await kv.set(KEYS.WORKSPACE(workspaceId), ws);
      return res.status(200).json({ success: true });
    }

    return sendError(res, 404, 'not_found', 'Endpoint or action not found');

  } catch (err: any) {
    console.error('RPC Error:', err);
    return sendError(res, 500, 'server_error', err.message);
  }
}