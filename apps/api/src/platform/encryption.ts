/**
 * Field-level encryption for PHI columns (AES-256-GCM).
 *
 * Used for the most sensitive identifiers at rest, on top of database-level
 * encryption. Ciphertext is stored as `iv:tag:ciphertext`, all hex. The key is
 * a 32-byte value provided via FIELD_ENCRYPTION_KEY and must be rotated through
 * a re-encryption migration, never edited in place.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from './config.js';

const KEY = Buffer.from(config.FIELD_ENCRYPTION_KEY, 'hex');
const ALGO = 'aes-256-gcm';

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptField(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('malformed ciphertext');
  const decipher = createDecipheriv(ALGO, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString(
    'utf8',
  );
}
