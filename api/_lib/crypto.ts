import crypto from 'crypto';
// Buffer é global no Node.js. Não importar de 'buffer' evita erro "Module not found" em serverless.

const ALGORITHM = 'aes-256-gcm';

// Helper lazy para obter a chave e validar apenas quando necessário
function getKey() {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    // Lança erro controlado ao invés de deixar o buffer falhar
    throw new Error('SERVER_CONFIG_ERROR: SESSION_SECRET environment variable is missing.');
  }
  
  // Garante 32 bytes para AES-256 preenchendo ou cortando
  // Isso evita erros de "Invalid Key Length" se o usuário colocar uma senha curta
  const buffer = Buffer.alloc(32);
  buffer.write(secret); 
  return buffer;
}

// Criptografa strings (App Secret, Access Tokens)
export function encrypt(text: string): string {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e: any) {
    console.error('Encryption Failed:', e.message);
    throw new Error(e.message.includes('SESSION_SECRET') ? e.message : 'Encryption failed due to server configuration');
  }
}

// Descriptografa strings
export function decrypt(text: string): string {
  try {
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
  } catch (e: any) {
    console.error('Decryption Failed:', e.message);
    throw new Error('Decryption failed. Check SESSION_SECRET or data integrity.');
  }
}