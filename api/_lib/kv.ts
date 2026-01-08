import pg from 'pg';
const { Pool } = pg;

// Singleton Pool
let pool: pg.Pool | null = null;
let migrationPromise: Promise<any> | null = null;

const getPool = () => {
  if (pool) return pool;

  const connectionString = process.env.POSTGRES_URL || process.env.NILEDB_URL;

  if (!connectionString) {
    console.warn('WARN: Database URL not found (POSTGRES_URL or NILEDB_URL).');
    throw new Error('Database configuration missing');
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Necessário para conexões externas seguras no Nile/Vercel
    max: 5, // Limite de conexões para serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Não limpa o pool aqui, deixa o Vercel matar o processo se necessário
  });

  return pool;
};

// Garante que a tabela KV exista (Simulação de NoSQL em SQL)
const ensureSchema = async () => {
  const p = getPool();
  if (!migrationPromise) {
    migrationPromise = p.query(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value JSONB,
        expires_at TIMESTAMPTZ
      );
    `).catch(err => {
      console.error('Migration failed:', err);
      migrationPromise = null; // Retry on next request
      throw err;
    });
  }
  return migrationPromise;
};

export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      await ensureSchema();
      const p = getPool();
      
      // Busca valor e verifica expiração em uma única query
      const res = await p.query(
        `SELECT value FROM kv_store WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())`, 
        [key]
      );
      
      if (res.rows.length === 0) return null;
      return res.rows[0].value as T;
    } catch (e) {
      console.error('DB GET Error:', e);
      return null;
    }
  },

  set: async (key: string, value: any, opts?: { ex?: number }) => {
    try {
      await ensureSchema();
      const p = getPool();
      
      let expiresAt = null;
      if (opts?.ex) {
        // Postgres precisa de data absoluta, Redis usa segundos relativos
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
    } catch (e) {
      console.error('DB SET Error:', e);
      throw new Error('Database write failed');
    }
  },

  // Simula LPUSH do Redis usando JSON Arrays do Postgres
  lpush: async (key: string, ...elements: any[]) => {
    try {
      await ensureSchema();
      const p = getPool();
      
      // Prepend elements to JSONB array. 
      // Se não existir, cria array. Se existir, concatena.
      // jsonb_build_array cria um array com os novos elementos
      // || concatena com o valor existente
      for (const element of elements) {
         await p.query(`
            INSERT INTO kv_store (key, value)
            VALUES ($1, jsonb_build_array($2::jsonb))
            ON CONFLICT (key) DO UPDATE
            SET value = jsonb_build_array($2::jsonb) || COALESCE(kv_store.value, '[]'::jsonb)
         `, [key, JSON.stringify(element)]);
      }
      
      // Retorna novo tamanho (aproximado, não crítico para este app)
      return 1;
    } catch (e) {
      console.error('DB LPUSH Error:', e);
      throw new Error('Database write failed');
    }
  },

  // Simula LRANGE do Redis
  lrange: async (key: string, start: number, end: number) => {
    try {
      await ensureSchema();
      const p = getPool();
      
      const res = await p.query(`SELECT value FROM kv_store WHERE key = $1`, [key]);
      
      if (res.rows.length === 0) return [];
      
      let arr = res.rows[0].value;
      if (!Array.isArray(arr)) return [];
      
      // Redis lrange: -1 significa até o final
      const actualEnd = end === -1 ? arr.length : end + 1;
      return arr.slice(start, actualEnd);
    } catch (e) {
      console.error('DB LRANGE Error:', e);
      return [];
    }
  },

  del: async (key: string) => {
    try {
      await ensureSchema();
      const p = getPool();
      await p.query(`DELETE FROM kv_store WHERE key = $1`, [key]);
      return 1;
    } catch (e) {
      console.error('DB DEL Error:', e);
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