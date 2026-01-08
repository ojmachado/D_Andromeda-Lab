import { kv, KEYS } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';
import { encrypt } from '../../_lib/crypto';

export default async function handler(req: any, res: any) {
  try {
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
        webhookUrl: config?.webhookUrl || '',
        redirectUri: `${baseUrl}/api/auth/meta/callback`
      });
    }

    if (req.method === 'POST') {
      const { appId, appSecret, webhookUrl } = req.body || {};
      
      // Validação básica
      if (!appId) {
        return sendError(res, 400, 'missing_fields', 'App ID é obrigatório');
      }

      // Recupera config atual para não sobrescrever o secret se não for enviado
      const currentConfig = await kv.get<any>(KEYS.META_CONFIG) || {};

      const newConfig = {
        appId,
        webhookUrl: webhookUrl || currentConfig.webhookUrl,
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
    return sendError(res, 500, 'server_error', e.message);
  }
}