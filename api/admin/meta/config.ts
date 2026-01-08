import { kv, KEYS } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';
import { encrypt } from '../../_lib/crypto';

export default async function handler(req: any, res: any) {
  try {
    // Debug Logs para Vercel
    console.log('[DEBUG] Handler Started');
    
    // Verifica ENVs de forma segura (Agora verificando POSTGRES_URL)
    const hasSecret = !!process.env.SESSION_SECRET;
    const hasDb = !!(process.env.POSTGRES_URL || process.env.NILEDB_URL);
    
    console.log(`[DEBUG] Config Check - Secret: ${hasSecret}, DB: ${hasDb}`);

    if (!hasSecret || !hasDb) {
      return sendError(res, 500, 'server_configuration_error', 'Faltam variáveis de ambiente (SESSION_SECRET ou POSTGRES_URL).');
    }

    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Acesso negado');

    if (req.method === 'GET') {
      const config = await kv.get<any>(KEYS.META_CONFIG);
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const baseUrl = `${protocol}://${host}`;
      
      return res.status(200).json({
        appId: config?.appId || '',
        redirectUri: `${baseUrl}/api/auth/meta/callback`
      });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return sendError(res, 400, 'invalid_json', 'Request body inválido');
        }
      }
      body = body || {};

      const { appId, appSecret } = body;
      
      if (!appId) {
        return sendError(res, 400, 'missing_fields', 'App ID é obrigatório');
      }

      const currentConfig = await kv.get<any>(KEYS.META_CONFIG) || {};

      const newConfig = {
        appId,
        appSecret: appSecret ? encrypt(appSecret) : currentConfig.appSecret
      };

      if (!newConfig.appSecret) {
         return sendError(res, 400, 'missing_secret', 'App Secret é obrigatório na configuração inicial');
      }

      await kv.set(KEYS.META_CONFIG, newConfig);

      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
  } catch (e: any) {
    console.error('Config API Crash:', e);
    return sendError(res, 500, 'server_error', `Erro interno: ${e.message}`);
  }
}