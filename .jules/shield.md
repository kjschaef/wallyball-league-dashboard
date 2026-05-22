## 2025-05-18 - Fix React Testing Library "act()" warnings
**Learning:** When a component fetches data inside a useEffect and sets state asynchronously upon mount (like `SignupsPage`), wrapping the initial `render()` call in `await act(async () => { render(...) })` ensures all state updates from the mocked `fetch` resolve within the React batch before assertions run. This prevents the "update to X inside a test was not wrapped in act(...)" warning. Similarly, interactive events that trigger async state updates should be wrapped in `await act(async () => { fireEvent(...) })`.
**Action:** Identify and fix `act()` warnings in other component tests that mount async components by replacing `render(<Component />)` with `await act(async () => { render(<Component />); })`.

## 2024-05-01 - Bypassing Drizzle-Kit Interactive Prompts
**Learning:** When `drizzle-kit generate` runs into schema drifts or rename ambiguities (e.g. "Is table X created or renamed?"), it hangs indefinitely waiting for standard input. Standard workarounds like `yes "" |` or basic spawn scripts without a pseudo-terminal fail because Drizzle detects the lack of a TTY and either behaves unpredictably or still blocks.
**Action:** In restricted headless environments without interactive shells, bypass these prompts by creating a temporary script using `node-pty` to spawn `drizzle-kit generate` inside a pseudo-terminal. Write a listener that programmatically sends a carriage return (`\r`) whenever the interactive prompt text (like `rename table` or `create table`) appears in the output.

## 2026-05-07 - Jest NextRequest json parsing behavior
**Learning:** When mocking Next.js API `POST` requests in Jest, initializing `NextRequest` objects with stringified bodies often causes unexpected parsing errors during `await request.json()`. Using a generic `Request` fallback or constructing a custom mock object that explicitly defines the `json()` resolver method bypasses these stringify bugs and stabilizes tests.
**Action:** Use a custom mock function like `createMockRequest(bodyObj) { return { json: async () => bodyObj } as Request; }` to predictably resolve `await request.json()` calls in Next.js App Router API tests.

## 2026-05-09 - Avoid wrap render in act
**Learning:** Wrapping `render()` inside `await act(async () => { ... })` is an anti-pattern in React Testing Library. The preferred approach to handle asynchronous state updates after initial render is to render the component normally and then wait for the expected UI changes using `waitFor` or `await screen.findBy*` queries.
**Action:** When a component uses `useEffect` to set state asynchronously upon mount, render it normally and then use `waitFor` to wait for the expected DOM state instead of wrapping the entire render in `act`.
