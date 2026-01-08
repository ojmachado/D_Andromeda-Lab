import { kv, KEYS } from '../../_lib/kv';
import { decrypt, encrypt } from '../../_lib/crypto';

export default async function handler(req: any, res: any) {
  const { code, state, error } = req.query;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['host'];
  const frontendUrl = `${protocol}://${host}`;

  if (error || !code || !state) {
    return res.redirect(`${frontendUrl}/#/workspaces?error=oauth_failed`);
  }

  // Valida State (Anti-CSRF)
  const storedState = await kv.get<any>(KEYS.AUTH_STATE(state));
  if (!storedState) {
    return res.redirect(`${frontendUrl}/#/workspaces?error=invalid_state`);
  }

  const { workspaceId } = storedState;
  await kv.del(KEYS.AUTH_STATE(state));

  try {
    const metaConfig = await kv.get<any>(KEYS.META_CONFIG);
    const appSecret = decrypt(metaConfig.appSecret);

    const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaConfig.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    // Salva token criptografado
    const ws = await kv.get<any>(KEYS.WORKSPACE(workspaceId));
    if (ws) {
      ws.meta = {
        ...ws.meta,
        status: 'connected',
        accessToken: encrypt(tokenData.access_token)
      };
      await kv.set(KEYS.WORKSPACE(workspaceId), ws);
    }

    return res.redirect(`${frontendUrl}/#/w/${workspaceId}/setup?step=2`);
  } catch (err) {
    console.error('Callback Error:', err);
    return res.redirect(`${frontendUrl}/#/workspaces?error=token_exchange_failed`);
  }
}