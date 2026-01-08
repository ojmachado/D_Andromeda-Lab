import { kv, KEYS } from '../../_lib/kv';
import { getUser, errorResponse } from '../../_lib/auth';
import { encrypt } from '../../_lib/crypto';
import { MetaConfig } from '../../../shared/types';

export default async function handler(req: Request) {
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorized', 'Login requerido');
  // TODO: Adicionar verificação de role ADMIN aqui

  if (req.method === 'GET') {
    const config = await kv.get<any>(KEYS.META_CONFIG);
    const origin = new URL(req.url).origin;
    // Fallback para localhost se origin for null (casos raros em serverless)
    const baseUrl = origin && origin !== 'null' ? origin : 'https://seu-app.vercel.app';
    
    const response: Partial<MetaConfig> = {
      appId: config?.appId || '',
      redirectUri: `${baseUrl}/api/auth/meta/callback`
    };
    return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    const { appId, appSecret } = await req.json();
    if (!appId || !appSecret) return errorResponse(400, 'missing_fields', 'App ID e Secret são obrigatórios');

    await kv.set(KEYS.META_CONFIG, {
      appId,
      appSecret: encrypt(appSecret) // Criptografa antes de salvar
    });

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }
}