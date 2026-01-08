import { kv, KEYS } from '../../_lib/kv';
import { getUser, errorResponse } from '../../_lib/auth';
import { decrypt } from '../../_lib/crypto';
import crypto from 'crypto';

export default async function handler(req: Request) {
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorized', 'Login requerido');

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse(400, 'missing_workspace', 'Workspace ID necessário');

  // Verifica acesso
  const ws = await kv.get<any>(KEYS.WORKSPACE(workspaceId));
  if (!ws || ws.ownerId !== user.userId) return errorResponse(403, 'forbidden', 'Acesso negado ao workspace');

  // Carrega config do App
  const metaConfig = await kv.get<any>(KEYS.META_CONFIG);
  if (!metaConfig) return errorResponse(500, 'config_missing', 'Meta App não configurado pelo admin');

  // Gera Anti-CSRF state
  const state = crypto.randomUUID();
  await kv.set(KEYS.AUTH_STATE(state), { workspaceId, nonce: Date.now() }, { ex: 600 }); // TTL 10 min

  const redirectUri = `${url.origin}/api/auth/meta/callback`;
  const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaConfig.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=ads_management,ads_read,business_management`;

  return new Response(JSON.stringify({ url: metaAuthUrl }), { headers: { 'Content-Type': 'application/json' } });
}