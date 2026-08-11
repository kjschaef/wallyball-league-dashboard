import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hashes a password using scrypt.
 * Returns a string in the format salt:hash (both hex encoded).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored salt:hash string.
 * Supports legacy plaintext passwords for migration.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  if (!storedHash.includes(':')) {
    // Legacy plaintext comparison
    // Note: This should be phased out after initial migration
    return password === storedHash;
  }

  const [salt, hash] = storedHash.split(':');
  const derivedKey = scryptSync(password, salt, 64);
  const hashBuffer = Buffer.from(hash, 'hex');

  if (derivedKey.length !== hashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, hashBuffer);
}
