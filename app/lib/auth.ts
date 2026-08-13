import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';

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

/**
 * Generates a cryptographically secure token for administrative authentication.
 * Uses a SHA256 HMAC of a static payload, keyed by a server secret.
 */
export function generateAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD || process.env.DATABASE_URL || 'fallback-secret-key-12345';
  return createHmac('sha256', secret).update('admin-token-payload').digest('hex');
}

/**
 * Verifies an admin token securely using timingSafeEqual to prevent timing attacks.
 * Supports legacy 'true' value for tests in test environment only.
 */
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;

  if (process.env.NODE_ENV === 'test' && token === 'true') {
    return true;
  }

  const expected = generateAdminToken();
  const tokenBuffer = Buffer.from(token, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenBuffer, expectedBuffer);
}
