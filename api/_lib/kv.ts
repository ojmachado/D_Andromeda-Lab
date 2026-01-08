import Redis from 'ioredis';

// Variável singleton lazy
let redis: Redis | null = null;

// Função segura para obter instância do Redis
const getRedis = () => {
  if (redis) return redis;

  // Tenta buscar a variável em múltiplos nomes para robustez
  const url = process.env.d_andromeda_labandromeda_lab_REDIS_URL || 
              process.env.REDIS_URL || 
              process.env.KV_URL;

  if (!url) {
    console.warn('WARN: Redis URL not found in environment variables.');
    return null;
  }

  try {
    // Inicializa cliente
    const client = new Redis(url, {
      lazyConnect: true, // Não conecta imediatamente
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      }
    });

    // Handler de erro silencioso para não derrubar o processo
    client.on('error', (err) => {
      console.warn('Redis Client Error:', err.message);
    });

    redis = client;
    return redis;
  } catch (e: any) {
    console.error('CRITICAL: Failed to initialize Redis client:', e.message);
    return null;
  }
};

export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    const r = getRedis();
    if (!r) return null;
    try {
      const val = await r.get(key);
      if (!val) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    } catch (e) {
      console.error('KV GET Error:', e);
      return null;
    }
  },

  set: async (key: string, value: any, opts?: { ex?: number }) => {
    const r = getRedis();
    if (!r) throw new Error('Database configuration missing (REDIS_URL)');
    try {
      const stringValue = JSON.stringify(value);
      if (opts?.ex) {
        await r.set(key, stringValue, 'EX', opts.ex);
      } else {
        await r.set(key, stringValue);
      }
    } catch (e) {
      console.error('KV SET Error:', e);
      throw new Error('Database write failed');
    }
  },

  lpush: async (key: string, ...elements: any[]) => {
    const r = getRedis();
    if (!r) throw new Error('Database configuration missing (REDIS_URL)');
    try {
      const args = elements.map(e => (typeof e === 'object' ? JSON.stringify(e) : String(e)));
      return await r.lpush(key, ...args);
    } catch (e) {
      console.error('KV LPUSH Error:', e);
      throw new Error('Database write failed');
    }
  },

  lrange: async (key: string, start: number, end: number) => {
    const r = getRedis();
    if (!r) return [];
    try {
      return await r.lrange(key, start, end);
    } catch (e) {
      console.error('KV LRANGE Error:', e);
      return [];
    }
  },

  del: async (key: string) => {
    const r = getRedis();
    if (!r) return 0;
    try {
      return await r.del(key);
    } catch (e) {
      console.error('KV DEL Error:', e);
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