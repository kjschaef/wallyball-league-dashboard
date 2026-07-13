## 2025-05-14 - [CRITICAL] Transition to Secure Password Hashing
**Vulnerability:** Admin passwords were stored and compared in plaintext in `app/api/auth/route.ts` and `app/api/settings/route.ts`.
**Learning:** Storing plaintext passwords makes the application vulnerable to credential theft if the database is compromised. Plaintext comparison is also susceptible to timing attacks.
**Prevention:** Always use a robust Key Derivation Function (KDF) like `scrypt` for password hashing and `timingSafeEqual` for comparison. Implementing a migration path (legacy fallback) ensures availability while hardening the system.
