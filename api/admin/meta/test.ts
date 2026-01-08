import { kv, KEYS } from '../../_lib/kv';
import { getUser, isMasterAdmin, errorResponse } from '../../_lib/auth';
import { decrypt } from '../../_lib/crypto';

export default async function handler(req: Request) {
  // 1. Verificação de Autenticação e Permissão Admin
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorized', 'Login requerido');

  const isAdmin = await isMasterAdmin(user.userId);
  if (!isAdmin) return errorResponse(403, 'forbidden', 'Acesso negado');

  if (req.method !== 'POST') return errorResponse(405, 'method_not_allowed', 'Method not allowed');

  try {
    // 2. Recuperar configurações salvas
    const config = await kv.get<any>(KEYS.META_CONFIG);
    if (!config?.appId || !config?.appSecret) {
      return errorResponse(400, 'config_missing', 'Salve as configurações antes de testar');
    }

    const appSecret = decrypt(config.appSecret);

    // 3. Testar credenciais gerando um App Access Token
    // Utilizamos client_credentials pois serve especificamente para validar App ID + Secret
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${config.appId}&client_secret=${appSecret}&grant_type=client_credentials`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || 'Erro desconhecido na API do Meta');
    }

    if (!data.access_token) {
        throw new Error('Não foi possível obter o token de acesso. Verifique as credenciais.');
    }

    // Sucesso
    return new Response(JSON.stringify({ success: true, message: 'Integração confirmada! Credenciais válidas.' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return errorResponse(500, 'test_failed', `Falha no teste: ${e.message}`);
  }
}