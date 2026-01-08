import { kv, KEYS } from '../../_lib/kv';
import { getUser, sendError } from '../../_lib/auth';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  try {
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const { workspaceId } = req.query;
    if (!workspaceId) return sendError(res, 400, 'missing_workspace', 'Workspace ID necessário');

    // Verifica acesso
    const ws = await kv.get<any>(KEYS.WORKSPACE(workspaceId));
    if (!ws || ws.ownerId !== user.userId) return sendError(res, 403, 'forbidden', 'Acesso negado ao workspace');

    // Carrega config do App
    const metaConfig = await kv.get<any>(KEYS.META_CONFIG);
    if (!metaConfig) return sendError(res, 500, 'config_missing', 'Meta App não configurado pelo admin');

    // Gera Anti-CSRF state
    const state = crypto.randomUUID();
    await kv.set(KEYS.AUTH_STATE(state), { workspaceId, nonce: Date.now() }, { ex: 600 });

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;
    
    const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaConfig.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=ads_management,ads_read,business_management`;

    return res.status(200).json({ url: metaAuthUrl });
  } catch (e: any) {
    return sendError(res, 500, 'server_error', e.message);
  }
}