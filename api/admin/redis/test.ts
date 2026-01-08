import { kv } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';

// Endpoint mantido em /api/admin/redis/test para compatibilidade,
// mas executa verificações no PostgreSQL (Nile).
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
    const envUrl = process.env.POSTGRES_URL || process.env.NILEDB_URL;
    if (!envUrl) {
        return sendError(res, 500, 'config_error', 'Variáveis POSTGRES_URL ou NILEDB_URL não encontradas no ambiente.');
    }

    // Teste Round-Trip no Postgres
    const startTime = Date.now();
    const testKey = `system:test:latency:${startTime}`;
    const testValue = { status: 'alive', check: startTime, provider: 'Nile Postgres' };

    try {
        await kv.set(testKey, testValue, { ex: 30 });
        const retrieved = await kv.get<any>(testKey);
        await kv.del(testKey);

        const endTime = Date.now();
        const latency = endTime - startTime;

        if (!retrieved || retrieved.check !== startTime) {
            return sendError(res, 500, 'data_integrity_error', 'Falha na integridade dos dados (valor gravado difere do lido).');
        }

        return res.status(200).json({
            success: true,
            provider: 'PostgreSQL (Nile)',
            latency_ms: latency,
            message: `Banco de Dados Operacional (Nile). Latência: ${latency}ms`
        });
    } catch (dbError: any) {
        console.error('DB Operation Failed:', dbError);
        return sendError(res, 500, 'db_operation_failed', `Erro ao conectar/gravar no banco: ${dbError.message}`);
    }

  } catch (e: any) {
    console.error('DB Test Critical Error:', e);
    return sendError(res, 500, 'server_error', `Falha interna no handler: ${e.message}`);
  }
}