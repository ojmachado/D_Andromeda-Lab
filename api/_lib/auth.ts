import { verifyToken, createClerkClient } from '@clerk/backend';

const MASTER_EMAIL = 'ojmachadomkt@gmail.com';

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

// Verifica se o usuário é o Master Admin baseado no e-mail
export async function isMasterAdmin(userId: string): Promise<boolean> {
  if (!process.env.CLERK_SECRET_KEY) return false;

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(userId);
    
    // Verifica se algum dos e-mails do usuário corresponde ao Master Email
    return user.emailAddresses.some(
      email => email.emailAddress.toLowerCase() === MASTER_EMAIL.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
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