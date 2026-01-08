# Andromeda Lab

SaaS Multi-tenant para Meta Ads.

## Configuração Inicial

### 1. Clerk (Auth)
1. Crie uma conta em clerk.com.
2. Crie uma aplicação.
3. Copie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (ou `VITE_CLERK_PUBLISHABLE_KEY`) e `CLERK_SECRET_KEY`.

### 2. Redis (Persistência)
1. Crie um banco Redis (pode ser Upstash, Redis Cloud, ou Vercel KV usando connection string padrão).
2. Obtenha a Connection String (ex: `redis://default:senha@url-do-host:6379`).
3. Defina a variável de ambiente `d_andromeda_labandromeda_lab_REDIS_URL`.

### 3. Variáveis de Ambiente (.env.local)
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
d_andromeda_labandromeda_lab_REDIS_URL=redis://default:senha@...
SESSION_SECRET=uma_string_aleatoria_muito_longa_para_criptografia_AES_256
```

### 4. Meta for Developers
1. Acesse `developers.facebook.com`.
2. Crie um App do tipo "Business".
3. Em "Facebook Login for Business", adicione a URL de callback.
   - Dev: `http://localhost:5173/api/auth/meta/callback` (Nota: Meta exige HTTPS, use túnel como ngrok ou deploy Vercel).
   - Prod: `https://seu-app.vercel.app/api/auth/meta/callback`.
4. Configure o App ID e Secret na rota `/admin/setup-meta` do Andromeda Lab.

## Deploy
1. Conecte o repositório à Vercel.
2. Adicione as Environment Variables.
3. Certifique-se de instalar `ioredis` (`npm install ioredis`).

## Troubleshooting

- **Redis Connection Error:** Verifique se `d_andromeda_labandromeda_lab_REDIS_URL` está correta e se o banco permite conexões externas.
- **Redirect Mismatch:** Certifique-se que a URL gerada no backend (`/api/auth/meta/start`) corresponde EXATAMENTE à cadastrada no Meta.
- **Crypto Error:** Se ocorrer erro de criptografia, verifique se `SESSION_SECRET` tem tamanho suficiente (32 chars+).