## 2024-05-21 - [Added API feedback unit tests]
**Learning:** Testing Next.js route handlers that take a `NextRequest` can be simplified in unit tests by casting a plain JS object that mimics the `json()` method. This avoids `NextRequest` constructor stringify bugs when not in a full integration environment.
**Action:** When unit testing App Router POST API routes in Next.js, use a mock request object with an async `json()` method instead of instantiating `NextRequest` if simple body assertion is needed.
