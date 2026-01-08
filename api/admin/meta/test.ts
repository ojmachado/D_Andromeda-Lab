import { kv, KEYS } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';
import { decrypt } from '../../_lib/crypto';

export default async function handler(req: any, res: any) {
  // Garante método POST
  if (req.method !== 'POST') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  try {
    // 1. Verificação de Autenticação
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    // 2. Verificação de Admin
    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Acesso negado');

    // 3. Recuperar configurações
    const config = await kv.get<any>(KEYS.META_CONFIG);
    if (!config?.appId || !config?.appSecret) {
      return sendError(res, 400, 'config_missing', 'Salve as configurações antes de testar');
    }

    let appSecret;
    try {
      appSecret = decrypt(config.appSecret);
    } catch (e) {
      return sendError(res, 500, 'crypto_error', 'Erro ao descriptografar App Secret. Verifique SESSION_SECRET.');
    }

    // 4. Testar credenciais no Meta (Client Credentials Flow)
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${config.appId}&client_secret=${appSecret}&grant_type=client_credentials`;
    
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (data.error) {
      console.error('Meta API Error:', data.error);
      // Passa o erro completo como details para o frontend exibir (type, code, message)
      return sendError(res, 400, 'meta_api_error', data.error.message, data.error);
    }

    if (!data.access_token) {
      return sendError(res, 500, 'invalid_response', 'Meta não retornou token de acesso.');
    }

    // Sucesso
    return res.status(200).json({
      success: true,
      message: 'Integração confirmada! Credenciais válidas e App autenticado.'
    });

  } catch (e: any) {
    console.error('Test Handler Critical Error:', e);
    return sendError(res, 500, 'server_error', `Falha interna no servidor: ${e.message}`);
  }
}