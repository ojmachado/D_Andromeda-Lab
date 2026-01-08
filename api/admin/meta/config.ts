import { kv, KEYS } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';
import { encrypt } from '../../_lib/crypto';

export default async function handler(req: any, res: any) {
  try {
    // Debug Logs (Aparecem no Vercel Logs)
    console.log('[DEBUG] Checking Env Vars...');
    const hasSecret = !!process.env.SESSION_SECRET;
    const hasRedis = !!process.env.d_andromeda_labandromeda_lab_REDIS_URL;
    console.log(`[DEBUG] SESSION_SECRET: ${hasSecret}, REDIS_URL_VAR: ${hasRedis}`);

    // Pré-verificação de sanidade do ambiente
    if (!hasSecret || !hasRedis) {
      console.error('[ERROR] Missing Environment Variables');
      return sendError(res, 500, 'server_configuration_error', 'Faltam variáveis de ambiente (SESSION_SECRET ou d_andromeda_labandromeda_lab_REDIS_URL) no painel da Vercel.');
    }

    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Acesso negado');

    if (req.method === 'GET') {
      const config = await kv.get<any>(KEYS.META_CONFIG);
      // Constrói URL baseada no host da requisição para facilitar dev/prod
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const baseUrl = `${protocol}://${host}`;
      
      return res.status(200).json({
        appId: config?.appId || '',
        // Não retornamos appSecret por segurança
        redirectUri: `${baseUrl}/api/auth/meta/callback`
      });
    }

    if (req.method === 'POST') {
      // Garante que o body seja um objeto, mesmo se vier como string (comum em serverless/proxies)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return sendError(res, 400, 'invalid_json', 'Request body is not valid JSON');
        }
      }
      body = body || {};

      const { appId, appSecret } = body;
      
      // Validação básica
      if (!appId) {
        return sendError(res, 400, 'missing_fields', 'App ID é obrigatório');
      }

      // Recupera config atual para não sobrescrever o secret se não for enviado
      const currentConfig = await kv.get<any>(KEYS.META_CONFIG) || {};

      const newConfig = {
        appId,
        // Mantemos a lógica: se vier string vazia, atualiza; se vier undefined/null, mantém atual
        appSecret: appSecret ? encrypt(appSecret) : currentConfig.appSecret
      };

      if (!newConfig.appSecret) {
         return sendError(res, 400, 'missing_secret', 'App Secret é obrigatório na primeira configuração');
      }

      await kv.set(KEYS.META_CONFIG, newConfig);

      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
  } catch (e: any) {
    console.error('Config API Error:', e);
    // Se for erro de config do servidor, retornamos amigavelmente
    if (e.message.includes('SESSION_SECRET') || e.message.includes('d_andromeda_labandromeda_lab_REDIS_URL')) {
        return sendError(res, 500, 'config_error', e.message);
    }
    return sendError(res, 500, 'server_error', e.message);
  }
}