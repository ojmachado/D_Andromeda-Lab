import Redis from 'ioredis';

// Conecta ao Redis usando a URL do .env
const redisUrl = process.env.d_andromeda_labandromeda_lab_REDIS_URL;

// Em ambiente Serverless (Vercel), não devemos tentar conectar em localhost se a ENV faltar.
// Isso causa Connection Refused e quebra a função com Erro 500.
let redis: Redis | null = null;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    lazyConnect: true, // Importante para serverless
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) return null; // Desiste rápido
      return Math.min(times * 50, 2000);
    }
  });

  redis.on('error', (err) => {
    // Apenas loga, não derruba o processo
    console.warn('Redis Connection Warning:', err.message);
  });
} else {
  console.warn('WARNING: d_andromeda_labandromeda_lab_REDIS_URL missing. Database operations will fail safely.');
}

export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    if (!redis) return null;
    try {
      const val = await redis.get(key);
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
    if (!redis) throw new Error('Database not configured (Missing d_andromeda_labandromeda_lab_REDIS_URL)');
    try {
      const stringValue = JSON.stringify(value);
      if (opts?.ex) {
        await redis.set(key, stringValue, 'EX', opts.ex);
      } else {
        await redis.set(key, stringValue);
      }
    } catch (e) {
      console.error('KV SET Error:', e);
      throw new Error('Database connection failed');
    }
  },

  lpush: async (key: string, ...elements: any[]) => {
    if (!redis) throw new Error('Database not configured (Missing d_andromeda_labandromeda_lab_REDIS_URL)');
    try {
      const args = elements.map(e => (typeof e === 'object' ? JSON.stringify(e) : String(e)));
      return await redis.lpush(key, ...args);
    } catch (e) {
      console.error('KV LPUSH Error:', e);
      throw new Error('Database connection failed');
    }
  },

  lrange: async (key: string, start: number, end: number) => {
    if (!redis) return [];
    try {
      return await redis.lrange(key, start, end);
    } catch (e) {
      console.error('KV LRANGE Error:', e);
      return [];
    }
  },

  del: async (key: string) => {
    if (!redis) return 0;
    try {
      return await redis.del(key);
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