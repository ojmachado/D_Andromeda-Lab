import { verifyToken } from '@clerk/backend';

export async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  
  // Verificação de segurança para ambiente de desenvolvimento/produção
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('CRITICAL ERROR: CLERK_SECRET_KEY is missing in environment variables.');
    return null;
  }

  try {
    // Valida o token JWT do Clerk
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return { userId: verifiedToken.sub };
  } catch (error) {
    console.error('Auth Error:', error);
    return null;
  }
}

// Helper para resposta de erro padrão
export function errorResponse(status: number, code: string, message: string, details = {}) {
  return new Response(JSON.stringify({
    error: code,
    message,
    requestId: `req_${Date.now()}`,
    details
  }), { status, headers: { 'Content-Type': 'application/json' } });
}