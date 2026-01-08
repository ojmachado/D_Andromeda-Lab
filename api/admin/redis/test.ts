import { kv } from '../../_lib/kv';
import { getUser, isMasterAdmin, sendError } from '../../_lib/auth';

// Endpoint para testar conexão com Banco de Dados (Postgres/Nile)
export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  
  try {
    // 1. Validação de Método
    if (req.method !== 'POST' && req.method !== 'GET') {
      return sendError(res, 405, 'method_not_allowed', 'Method not allowed');
    }

    // 2. Validação de Auth
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'unauthorized', 'Login requerido');

    const isAdmin = await isMasterAdmin(user.userId);
    if (!isAdmin) return sendError(res, 403, 'forbidden', 'Acesso negado');

    // 3. Validação de Variáveis de Ambiente
    const envs = {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        NILEDB_URL: !!process.env.NILEDB_URL,
        DATABASE_URL: !!process.env.DATABASE_URL
    };
    
    if (!envs.POSTGRES_URL && !envs.NILEDB_URL && !envs.DATABASE_URL) {
        return sendError(res, 500, 'config_error', 'Nenhuma variável de conexão (POSTGRES_URL) encontrada.', envs);
    }

    // 4. Teste de Operação (Round-Trip)
    const testKey = `system:test:latency:${startTime}`;
    const testValue = { status: 'alive', check: startTime, provider: 'Nile Postgres' };

    try {
        // Gravação
        await kv.set(testKey, testValue, { ex: 30 });
        
        // Leitura
        const retrieved = await kv.get<any>(testKey);
        
        // Limpeza
        await kv.del(testKey);

        const endTime = Date.now();
        const latency = endTime - startTime;

        // Verificação de Integridade
        if (!retrieved || retrieved.check !== startTime) {
            return sendError(res, 500, 'data_integrity_error', 'Falha na integridade dos dados (valor gravado difere do lido).', {
                sent: testValue,
                received: retrieved
            });
        }

        return res.status(200).json({
            success: true,
            provider: 'PostgreSQL (Nile)',
            latency_ms: latency,
            message: `Banco de Dados Operacional. Latência: ${latency}ms`
        });

    } catch (dbError: any) {
        console.error('DB Operation Failed:', dbError);
        return sendError(res, 500, 'db_operation_failed', `Erro ao conectar/gravar no banco: ${dbError.message}`, {
            stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
        });
    }

  } catch (e: any) {
    console.error('Critical Handler Crash:', e);
    // Retorna JSON mesmo em erro crítico para evitar tela padrão de erro do Vercel
    if (!res.headersSent) {
      res.status(500).json({
        error: 'server_crash',
        message: `Critical Server Error: ${e.message}`,
        requestId: `req_${startTime}`,
        details: {
            step: 'Top Level Handler Catch',
            errorName: e.name
        }
      });
    }
  }
}