import Redis from 'ioredis';

// Conecta ao Redis usando a URL do .env
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('WARNING: REDIS_URL not found. Operations will fail.');
}

// lazyConnect: true impede que o IORedis tente conectar imediatamente ao importar o arquivo.
// Isso evita crashs síncronos se a URL estiver inválida ou o banco offline durante o "cold start" da serverless function.
const redis = new Redis(redisUrl || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1, // Falha rápido em serverless
  retryStrategy: (times) => {
    // Tenta reconectar 3 vezes max
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  }
});

redis.on('error', (err) => {
  console.error('Redis Connection Error:', err.message);
  // Não dar throw aqui para não derrubar o processo principal do Node em serverless
});

export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
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
    try {
      const args = elements.map(e => (typeof e === 'object' ? JSON.stringify(e) : String(e)));
      return await redis.lpush(key, ...args);
    } catch (e) {
      console.error('KV LPUSH Error:', e);
      throw new Error('Database connection failed');
    }
  },

  lrange: async (key: string, start: number, end: number) => {
    try {
      return await redis.lrange(key, start, end);
    } catch (e) {
      console.error('KV LRANGE Error:', e);
      return [];
    }
  },

  del: async (key: string) => {
    try {
      return await redis.del(key);
    } catch (e) {
      console.error('KV DEL Error:', e);
    }
  }
};

export const KEYS = {
  WORKSPACE: (id: string) => `workspace:${id}`,
  USER_WORKSPACES: (userId: string) => `user:${userId}:workspaces`,
  META_CONFIG: 'config:meta',
  AUTH_STATE: (state: string) => `auth:state:${state}`,
};