import crypto from 'crypto';
import { Buffer } from 'buffer';

// Garante que o SESSION_SECRET venha do .env
// Se estiver rodando localmente via "vercel dev", ele lerá do .env
const SECRET_KEY = process.env.SESSION_SECRET;

if (!SECRET_KEY) {
  throw new Error('FATAL: SESSION_SECRET is missing from environment variables.');
}

// Garante 32 bytes para AES-256 (se a string for maior, corta; se menor, pad com zeros - ideal é ter 32 chars no env)
const KEY_BUFFER = Buffer.alloc(32);
KEY_BUFFER.write(SECRET_KEY);

const ALGORITHM = 'aes-256-gcm';

// Criptografa strings (App Secret, Access Tokens)
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Descriptografa strings
export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    KEY_BUFFER, 
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}