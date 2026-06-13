## 2024-05-24 - Missing Authorization on Game Routes
**Vulnerability:** Missing authorization check on `app/api/games/route.ts` and `app/api/games/[id]/route.ts`.
**Learning:** Any API route that modifies state must have an authorization check.
**Prevention:** Verify authentication tokens/cookies before executing POST/PUT/DELETE requests.
