import crypto from 'crypto';
import { Buffer } from 'buffer';

const ALGORITHM = 'aes-256-gcm';

// Helper lazy para obter a chave e validar apenas quando necessário
// Isso evita que o app inteiro quebre se a ENV estiver faltando em rotas que não usam crypto
function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('FATAL: SESSION_SECRET is missing from environment variables.');
  }
  // Garante 32 bytes para AES-256
  const buffer = Buffer.alloc(32);
  buffer.write(secret);
  return buffer;
}

// Criptografa strings (App Secret, Access Tokens)
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Descriptografa strings
export function decrypt(text: string): string {
  const key = getKey();
  const parts = text.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    key, 
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}