# Andromeda Lab

SaaS Multi-tenant para Meta Ads.

## Configuração Inicial

### 1. Clerk (Auth)
1. Crie uma conta em clerk.com.
2. Crie uma aplicação.
3. Copie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (ou `VITE_CLERK_PUBLISHABLE_KEY`) e `CLERK_SECRET_KEY`.

### 2. Vercel KV (Redis)
1. Crie um banco KV no painel da Vercel.
2. Copie `KV_REST_API_URL` e `KV_REST_API_TOKEN`.

### 3. Variáveis de Ambiente (.env.local)
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
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
3. O Vercel detectará `vite.config.ts` e `api/` functions automaticamente.

## Troubleshooting

- **Redirect Mismatch:** Certifique-se que a URL gerada no backend (`/api/auth/meta/start`) corresponde EXATAMENTE à cadastrada no Meta.
- **Vite Proxy:** Localmente, chamadas `/api` são proxied para o serverless mock ou você deve rodar `vercel dev`.
- **Crypto Error:** Se ocorrer erro de criptografia, verifique se `SESSION_SECRET` tem tamanho suficiente (32 chars+).
