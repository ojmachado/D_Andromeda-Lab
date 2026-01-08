import Redis from 'ioredis';

// Conecta ao Redis usando a URL padrão.
// Se a variável REDIS_URL não estiver definida, tenta conectar em localhost (útil para dev).
// Nota: Em serverless (Vercel), a conexão é criada fora do handler para aproveitar o container reuse.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Wrapper para manter consistência com o uso anterior e facilitar serialização JSON
export const kv = {
  // Recupera e faz parse automático de JSON
  get: async <T>(key: string): Promise<T | null> => {
    const val = await redis.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  },

  // Salva fazendo stringify automático. Suporta opção 'ex' (expire em segundos)
  set: async (key: string, value: any, opts?: { ex?: number }) => {
    const stringValue = JSON.stringify(value);
    if (opts?.ex) {
      await redis.set(key, stringValue, 'EX', opts.ex);
    } else {
      await redis.set(key, stringValue);
    }
  },

  // Adiciona item no início da lista (serializa se necessário, embora IDs sejam strings)
  lpush: async (key: string, ...elements: any[]) => {
    const args = elements.map(e => (typeof e === 'object' ? JSON.stringify(e) : String(e)));
    return redis.lpush(key, ...args);
  },

  // Retorna intervalo da lista (retorna strings, parse deve ser feito por quem chama se necessário)
  lrange: async (key: string, start: number, end: number) => {
    return redis.lrange(key, start, end);
  },

  // Remove chaves
  del: async (key: string) => {
    return redis.del(key);
  }
};

export const KEYS = {
  WORKSPACE: (id: string) => `workspace:${id}`,
  USER_WORKSPACES: (userId: string) => `user:${userId}:workspaces`,
  META_CONFIG: 'config:meta',
  AUTH_STATE: (state: string) => `auth:state:${state}`,
};