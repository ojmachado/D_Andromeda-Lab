import { kv } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';

export default async function handler(req: any, res: any) {
  // Try-catch de nível superior para capturar erros de inicialização de módulo ou falhas síncronas
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
    }

    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Acesso negado');

    // Verifica ENV
    const envUrl = process.env.POSTGRES_URL || process.env.NILEDB_URL || process.env.DATABASE_URL;
    if (!envUrl) {
        return sendError(res, 500, 'config_error', 'Nenhuma variável de conexão (POSTGRES_URL) encontrada.');
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
            message: `Banco de Dados Operacional. Latência: ${latency}ms`
        });
    } catch (dbError: any) {
        console.error('DB Operation Failed:', dbError);
        return sendError(res, 500, 'db_operation_failed', `Erro ao conectar/gravar no banco: ${dbError.message}`);
    }

  } catch (e: any) {
    console.error('DB Test Critical Error (Top Level):', e);
    // Tenta enviar uma resposta JSON mesmo em caso de crash crítico, se headers ainda não foram enviados
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'server_crash',
        message: `Critical Server Error: ${e.message}`,
        requestId: `req_${Date.now()}`
      });
    }
  }
}