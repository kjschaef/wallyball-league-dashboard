## 2025-06-04 - Testing fallback error messages in catch blocks
**Learning:** When API routes contain fallback logic for unknown errors (e.g., `details: error instanceof Error ? error.message : 'Unknown error'`), this path is often missed in coverage because standard error mocks return `Error` objects.
**Action:** Explicitly trigger the 'Unknown error' path in Jest by mocking the failing dependency (like `request.json()`) to reject with a primitive string (e.g., `mockRejectedValue('String error')`) instead of an Error object.
