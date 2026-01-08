import { verifyToken, createClerkClient } from '@clerk/backend';

const MASTER_EMAIL = 'ojmachadomkt@gmail.com';

// Suporta tanto Request padrão quanto VercelRequest (IncomingMessage)
export async function getUser(req: any) {
  // Tenta obter header de diferentes formas (Node vs Web)
  let authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader && typeof req.headers.get === 'function') {
    authHeader = req.headers.get('Authorization');
  }

  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('CRITICAL ERROR: CLERK_SECRET_KEY is missing in environment variables.');
    return null;
  }

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return { userId: verifiedToken.sub };
  } catch (error) {
    console.error('Auth Error:', error);
    return null;
  }
}

export async function isMasterAdmin(userId: string): Promise<boolean> {
  if (!process.env.CLERK_SECRET_KEY) return false;

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(userId);
    return user.emailAddresses.some(
      email => email.emailAddress.toLowerCase() === MASTER_EMAIL.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Helper atualizado para usar o objeto de resposta (res) do Vercel/Node
export function sendError(res: any, status: number, code: string, message: string, details = {}) {
  return res.status(status).json({
    error: code,
    message,
    requestId: `req_${Date.now()}`,
    details
  });
}