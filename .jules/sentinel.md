## 2025-05-14 - [CRITICAL] Transition to Secure Password Hashing
**Vulnerability:** Admin passwords were stored and compared in plaintext in `app/api/auth/route.ts` and `app/api/settings/route.ts`.
**Learning:** Storing plaintext passwords makes the application vulnerable to credential theft if the database is compromised. Plaintext comparison is also susceptible to timing attacks.
**Prevention:** Always use a robust Key Derivation Function (KDF) like `scrypt` for password hashing and `timingSafeEqual` for comparison. Implementing a migration path (legacy fallback) ensures availability while hardening the system.

## 2025-05-14 - [CRITICAL] Admin Session Authentication Bypass
**Vulnerability:** Admin authorization was verified by checking if the `admin_token` cookie value was exactly `'true'`. This allowed any client to bypass authentication by manually setting `admin_token=true` in their cookie headers.
**Learning:** Using static plaintext values for authorization cookies defeats server-side access controls, since clients have full read/write control over standard cookie values unless they are cryptographically signed or verified.
**Prevention:** Always sign or verify admin cookies using a cryptographically secure signature/HMAC with a server-side secret, and use timing-safe comparison (`timingSafeEqual`) to prevent timing attacks.
