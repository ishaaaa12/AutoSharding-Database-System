import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';

function getKey() {
  const key = process.env.MASTER_KEY;

  if (!key) {
    throw new Error("MASTER_KEY is missing");
  }

  if (key.length !== 32) {
    throw new Error(`MASTER_KEY must be 32 characters. Received ${key.length}`);
  }

  return Buffer.from(key, 'utf8');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const [ivHex, encHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);

  let decrypted = decipher.update(encHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
