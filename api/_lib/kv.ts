import pg from 'pg';

// Robust pool extraction to handle CommonJS/ESM interop in Vercel/Node
// Isso corrige o erro onde Pool é undefined dependendo do bundler
const Pool = pg.Pool || (pg as any).default?.Pool || (pg as any).default;

// Singleton Pool
let pool: pg.Pool | null = null;
let migrationPromise: Promise<any> | null = null;

const getPool = () => {
  if (pool) return pool;

  // Tenta várias variáveis de ambiente comuns
  const connectionString = 
    process.env.POSTGRES_URL || 
    process.env.NILEDB_URL || 
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('CRITICAL: Database URL not found (POSTGRES_URL, NILEDB_URL or DATABASE_URL).');
    throw new Error('Database configuration missing');
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Necessário para conexões externas seguras (Nile/Vercel)
      max: 5, // Limite de conexões para serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Não limpa o pool aqui, deixa o Vercel matar o processo se necessário
    });

    return pool;
  } catch (e: any) {
    console.error('Failed to create Postgres Pool:', e);
    throw e;
  }
};

// Garante que a tabela KV exista (Simulação de NoSQL em SQL)
const ensureSchema = async () => {
  try {
    const p = getPool();
    if (!migrationPromise) {
      // Usamos uma promise para evitar múltiplas tentativas simultâneas de migração
      migrationPromise = p.query(`
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY,
          value JSONB,
          expires_at TIMESTAMPTZ
        );
      `).catch(err => {
        console.error('Migration Query Failed:', err);
        migrationPromise = null; // Reset para tentar novamente na próxima req
        throw err;
      });
    }
    return migrationPromise;
  } catch (e) {
    console.error('Schema Check Failed:', e);
    throw e; // Propaga erro para ser capturado no handler
  }
};

export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      await ensureSchema();
      const p = getPool();
      
      const res = await p.query(
        `SELECT value FROM kv_store WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())`, 
        [key]
      );
      
      if (res.rows.length === 0) return null;
      return res.rows[0].value as T;
    } catch (e: any) {
      console.error(`DB GET Error [${key}]:`, e.message);
      // Retorna null em vez de quebrar, para resiliência (mas loga erro)
      return null;
    }
  },

  set: async (key: string, value: any, opts?: { ex?: number }) => {
    try {
      await ensureSchema();
      const p = getPool();
      
      let expiresAt = null;
      if (opts?.ex) {
        const date = new Date();
        date.setSeconds(date.getSeconds() + opts.ex);
        expiresAt = date;
      }

      await p.query(
        `INSERT INTO kv_store (key, value, expires_at) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE 
         SET value = $2, expires_at = $3`,
        [key, JSON.stringify(value), expiresAt]
      );
    } catch (e: any) {
      console.error(`DB SET Error [${key}]:`, e.message);
      throw new Error('Database write failed: ' + e.message);
    }
  },

  lpush: async (key: string, ...elements: any[]) => {
    try {
      await ensureSchema();
      const p = getPool();
      
      for (const element of elements) {
         await p.query(`
            INSERT INTO kv_store (key, value)
            VALUES ($1, jsonb_build_array($2::jsonb))
            ON CONFLICT (key) DO UPDATE
            SET value = jsonb_build_array($2::jsonb) || COALESCE(kv_store.value, '[]'::jsonb)
         `, [key, JSON.stringify(element)]);
      }
      return 1;
    } catch (e: any) {
      console.error(`DB LPUSH Error [${key}]:`, e.message);
      throw new Error('Database write failed');
    }
  },

  lrange: async (key: string, start: number, end: number) => {
    try {
      await ensureSchema();
      const p = getPool();
      
      const res = await p.query(`SELECT value FROM kv_store WHERE key = $1`, [key]);
      
      if (res.rows.length === 0) return [];
      
      let arr = res.rows[0].value;
      if (!Array.isArray(arr)) return [];
      
      const actualEnd = end === -1 ? arr.length : end + 1;
      return arr.slice(start, actualEnd);
    } catch (e: any) {
      console.error(`DB LRANGE Error [${key}]:`, e.message);
      return [];
    }
  },

  del: async (key: string) => {
    try {
      await ensureSchema();
      const p = getPool();
      await p.query(`DELETE FROM kv_store WHERE key = $1`, [key]);
      return 1;
    } catch (e: any) {
      console.error(`DB DEL Error [${key}]:`, e.message);
      return 0;
    }
  }
};

export const KEYS = {
  WORKSPACE: (id: string) => `workspace:${id}`,
  USER_WORKSPACES: (userId: string) => `user:${userId}:workspaces`,
  META_CONFIG: 'config:meta',
  AUTH_STATE: (state: string) => `auth:state:${state}`,
};