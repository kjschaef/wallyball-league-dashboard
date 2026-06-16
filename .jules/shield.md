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

## 2025-06-04 - Testing fallback error messages in catch blocks
**Learning:** When API routes contain fallback logic for unknown errors (e.g., `details: error instanceof Error ? error.message : 'Unknown error'`), this path is often missed in coverage because standard error mocks return `Error` objects.
**Action:** Explicitly trigger the 'Unknown error' path in Jest by mocking the failing dependency (like `request.json()`) to reject with a primitive string (e.g., `mockRejectedValue('String error')`) instead of an Error object.

## 2025-06-05 - Mocking API methods effectively
**Learning:** For Next.js App Router unit tests covering API endpoints with complex logic, properly isolating the database functionality inside mocked tagged template literal `mockSql` functions allows rigorous assertion on specific input arguments and response shapes.
**Action:** Always structure API unit tests to thoroughly replace database drivers while avoiding overly broad mocks, so the code paths specific to error states like "missing DATABASE_URL" can still be exercised by setting and restoring `process.env`.

## 2026-06-10 - Shared Mock Function References for Class Instantiations
**Learning:** When testing a module that instantiates a class at the top level (e.g., `const client = new OpenAI(...)` outside of any exported function), using `jest.mock` and trying to assert against `mockCreate = client.chat.completions.create` within a `beforeEach` can lead to reference mismatches or initialization errors (Cannot access before initialization) if the mock isn't structured carefully.
**Action:** When mocking module-level class instantiations in Jest, ensure the `jest.mock` factory uses a shared mock function reference (e.g., `const mCreate = jest.fn()` inside the factory but outside the returned mock implementation) so both the test suite and the application code interact with the same mock instance.
