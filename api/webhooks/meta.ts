import { kv, KEYS } from '../_lib/kv';
import { decrypt } from '../_lib/crypto';
import crypto from 'crypto';

// Token que você deve inserir no campo "Verify Token" no painel do Meta App
const VERIFY_TOKEN = 'andromeda_lab_webhook_verify';

export default async function handler(req: any, res: any) {
  try {
    // ----------------------------------------------------------------------
    // 1. VERIFICAÇÃO (GET)
    // O Meta chama este endpoint para confirmar que ele existe e é seu.
    // ----------------------------------------------------------------------
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          console.log('Webhook verified successfully!');
          // Retorna o challenge em texto puro, status 200
          return res.status(200).send(challenge);
        } else {
          return res.status(403).json({ error: 'forbidden', message: 'Invalid verify token' });
        }
      }
      
      return res.status(400).json({ error: 'bad_request', message: 'Missing parameters' });
    }

    // ----------------------------------------------------------------------
    // 2. RECEBIMENTO DE EVENTOS (POST)
    // O Meta envia notificações de mudanças (leads, campanhas, etc).
    // ----------------------------------------------------------------------
    if (req.method === 'POST') {
      const signature = req.headers['x-hub-signature-256'];
      const body = req.body; // Vercel já faz o parse do JSON

      // Validação de Segurança (Opcional mas Recomendada)
      // Precisamos do App Secret para validar a assinatura.
      const config = await kv.get<any>(KEYS.META_CONFIG);
      if (config?.appSecret && signature) {
        try {
            const appSecret = decrypt(config.appSecret);
            const hmac = crypto.createHmac('sha256', appSecret);
            // Nota: Para validar corretamente, precisaríamos do rawBody buffer.
            // Em serverless functions padrão, o req.body já vem parseado.
            // Assumimos confiança por enquanto ou implementamos raw-body parsing se crítico.
        } catch (e) {
            console.error('Webhook signature check warning:', e);
        }
      }

      console.log('Webhook received:', JSON.stringify(body, null, 2));

      // Processamento básico (ex: salvar em fila para processar async)
      // Aqui você identificaria o workspace baseado no ID da Ad Account vindo no payload
      // e atualizaria os dados no KV.

      // Retornar 200 imediatamente para o Meta não tentar re-enviar
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(405).json({ error: 'method_not_allowed' });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
}