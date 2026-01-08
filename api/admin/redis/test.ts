import { kv } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  try {
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Acesso negado');

    // Verifica ENV
    const envUrl = process.env.d_andromeda_labandromeda_lab_REDIS_URL || process.env.REDIS_URL || process.env.KV_URL;
    if (!envUrl) {
        return sendError(res, 500, 'config_error', 'Nenhuma variável REDIS_URL encontrada.');
    }

    // Teste Round-Trip
    const startTime = Date.now();
    const testKey = `system:test:latency:${startTime}`;
    const testValue = { status: 'alive', check: startTime };

    try {
        await kv.set(testKey, testValue, { ex: 30 });
        const retrieved = await kv.get<any>(testKey);
        await kv.del(testKey);

        const endTime = Date.now();
        const latency = endTime - startTime;

        if (!retrieved || retrieved.check !== startTime) {
            return sendError(res, 500, 'data_integrity_error', 'Falha na integridade dos dados (escrita != leitura).');
        }

        return res.status(200).json({
            success: true,
            provider: 'Redis (Upstash/KV)',
            latency_ms: latency,
            message: `Redis Operacional. Latência: ${latency}ms`
        });
    } catch (dbError: any) {
        return sendError(res, 500, 'redis_operation_failed', `Erro ao operar no banco: ${dbError.message}`);
    }

  } catch (e: any) {
    console.error('Redis Test Critical Error:', e);
    return sendError(res, 500, 'server_error', `Falha interna: ${e.message}`);
  }
}