import { kv } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';

export default async function handler(req: any, res: any) {
  // Apenas aceita POST ou GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  try {
    // 1. Verificação de Segurança (Apenas Master Admin)
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Apenas Master Admin pode executar diagnósticos de infraestrutura');

    // 2. Verifica se a ENV está visível para o processo Node
    const envUrl = process.env.d_andromeda_labandromeda_lab_REDIS_URL;
    if (!envUrl) {
        return sendError(res, 500, 'config_error', 'A variável de ambiente d_andromeda_labandromeda_lab_REDIS_URL não está definida.');
    }

    // 3. Teste de Round-Trip (Escrita -> Leitura -> Delete)
    const startTime = Date.now();
    const testKey = `system:test:latency:${startTime}`;
    const testValue = { status: 'alive', check: startTime };

    // Tenta Escrever
    await kv.set(testKey, testValue, { ex: 30 }); // TTL curto de 30s

    // Tenta Ler
    const retrieved = await kv.get<any>(testKey);

    // Tenta Deletar
    await kv.del(testKey);

    const endTime = Date.now();
    const latency = endTime - startTime;

    // 4. Validação de Integridade
    if (!retrieved || retrieved.check !== startTime) {
        return sendError(res, 500, 'data_integrity_error', 'O valor lido do Redis não corresponde ao valor escrito.', { written: testValue, read: retrieved });
    }

    return res.status(200).json({
      success: true,
      provider: 'Redis (Upstash/KV)',
      latency_ms: latency,
      message: `Redis Operacional. Latência: ${latency}ms`
    });

  } catch (e: any) {
    console.error('Redis Test Error:', e);
    return sendError(res, 500, 'redis_connection_failed', `Falha ao conectar ou operar no Redis: ${e.message}`, { stack: e.stack });
  }
}