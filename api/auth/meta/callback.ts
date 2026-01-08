import { kv, KEYS } from '../../_lib/kv';
import { decrypt, encrypt } from '../../_lib/crypto';
import { getLongLivedToken } from '../../_lib/meta';

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Redireciona para frontend com erro se falhar
  const frontendUrl = url.origin; // Assume frontend na mesma origem ou ajustar conforme env
  
  if (error || !code || !state) {
    return Response.redirect(`${frontendUrl}/#/workspaces?error=oauth_failed`);
  }

  // Valida State (Anti-CSRF)
  const storedState = await kv.get<any>(KEYS.AUTH_STATE(state));
  if (!storedState) {
    return Response.redirect(`${frontendUrl}/#/workspaces?error=invalid_state`);
  }

  const { workspaceId } = storedState;
  
  // Limpa o state
  await kv.del(KEYS.AUTH_STATE(state));

  try {
    const metaConfig = await kv.get<any>(KEYS.META_CONFIG);
    const appSecret = decrypt(metaConfig.appSecret);

    // Troca code por token (long lived)
    const redirectUri = `${url.origin}/api/auth/meta/callback`;
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaConfig.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    // Salva token criptografado no workspace
    const ws = await kv.get<any>(KEYS.WORKSPACE(workspaceId));
    if (ws) {
      ws.meta = {
        ...ws.meta,
        status: 'connected', // Conectado, mas ainda precisa selecionar conta
        accessToken: encrypt(tokenData.access_token)
      };
      await kv.set(KEYS.WORKSPACE(workspaceId), ws);
    }

    // Redireciona para o passo 2 do Wizard (Business)
    return Response.redirect(`${frontendUrl}/#/w/${workspaceId}/setup?step=2`);

  } catch (err) {
    console.error(err);
    return Response.redirect(`${frontendUrl}/#/workspaces?error=token_exchange_failed`);
  }
}