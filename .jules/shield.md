## 2025-05-18 - Fix React Testing Library "act()" warnings
**Learning:** When a component fetches data inside a useEffect and sets state asynchronously upon mount (like `SignupsPage`), wrapping the initial `render()` call in `await act(async () => { render(...) })` ensures all state updates from the mocked `fetch` resolve within the React batch before assertions run. This prevents the "update to X inside a test was not wrapped in act(...)" warning. Similarly, interactive events that trigger async state updates should be wrapped in `await act(async () => { fireEvent(...) })`.
**Action:** Identify and fix `act()` warnings in other component tests that mount async components by replacing `render(<Component />)` with `await act(async () => { render(<Component />); })`.

## 2024-05-01 - Bypassing Drizzle-Kit Interactive Prompts
**Learning:** When `drizzle-kit generate` runs into schema drifts or rename ambiguities (e.g. "Is table X created or renamed?"), it hangs indefinitely waiting for standard input. Standard workarounds like `yes "" |` or basic spawn scripts without a pseudo-terminal fail because Drizzle detects the lack of a TTY and either behaves unpredictably or still blocks.
**Action:** In restricted headless environments without interactive shells, bypass these prompts by creating a temporary script using `node-pty` to spawn `drizzle-kit generate` inside a pseudo-terminal. Write a listener that programmatically sends a carriage return (`\r`) whenever the interactive prompt text (like `rename table` or `create table`) appears in the output.

## 2026-05-07 - Jest NextRequest json parsing behavior
**Learning:** When mocking Next.js API `POST` requests in Jest, initializing `NextRequest` objects with stringified bodies often causes unexpected parsing errors during `await request.json()`. Using a generic `Request` fallback or constructing a custom mock object that explicitly defines the `json()` resolver method bypasses these stringify bugs and stabilizes tests.
**Action:** Use a custom mock function like `createMockRequest(bodyObj) { return { json: async () => bodyObj } as Request; }` to predictably resolve `await request.json()` calls in Next.js App Router API tests.

## 2025-05-22 - Mocking ES module dependencies in route handlers
**Learning:** In Next.js app router tests, when a route handler dynamically imports a utility module using `await import()`, standard `jest.mock()` at the top of the file successfully intercepts the import without needing complex setup.
**Action:** When testing dynamic imports, use standard `jest.mock('path/to/module', () => ({ ... }), { virtual: true })` at the top level to intercept and provide mocked implementations of utility functions.

## 2024-05-21 - [Added API feedback unit tests]
**Learning:** Testing Next.js route handlers that take a `NextRequest` can be simplified in unit tests by casting a plain JS object that mimics the `json()` method. This avoids `NextRequest` constructor stringify bugs when not in a full integration environment.
**Action:** When unit testing App Router POST API routes in Next.js, use a mock request object with an async `json()` method instead of instantiating `NextRequest` if simple body assertion is needed.
## 2024-05-24 - Environment Variable Manipulation in Jest
**Learning:** In Next.js App Router API testing, deleting required environment variables (like `DATABASE_URL`) without a fail-safe restoration block will silently pollute the process environment and cause subsequent tests to fail unexpectedly, since `process.env` mutations are global across the suite.
**Action:** Always wrap code blocks that manipulate or delete global environment variables in a `try...finally` block, ensuring variables are explicitly restored in the `finally` statement so they reset even if assertions throw errors.

## 2026-06-01 - Jest NextRequest json parsing behavior
**Learning:** When mocking Next.js API `POST` requests in Jest, initializing `NextRequest` objects with stringified bodies often causes unexpected parsing errors during `await request.json()`. Using a generic `Request` fallback or constructing a custom mock object that explicitly defines the `json()` resolver method bypasses these stringify bugs and stabilizes tests.
**Action:** Use a custom mock function like `createMockRequest(bodyObj) { return { json: async () => bodyObj } as Request; }` to predictably resolve `await request.json()` calls in Next.js App Router API tests.

## 2026-06-01 - Safe environment variable mocking in Node.js
**Learning:** In Node.js, `process.env` properties are strictly strings. If an original environment variable was `undefined` and a test restores it by assigning `process.env.VAR = originalVar`, it will cast the `undefined` to the literal string `"undefined"`. Because `"undefined"` is truthy, subsequent tests that check for the presence of the variable using `if (process.env.VAR)` will fail, causing severe cross-test pollution.
**Action:** When mocking environment variables that might be initially undefined, always conditionally restore them using `delete process.env.VAR` if the cached original value was `undefined`, rather than a direct assignment.
