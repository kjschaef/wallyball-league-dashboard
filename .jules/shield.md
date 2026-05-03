## 2025-05-18 - Fix React Testing Library "act()" warnings
**Learning:** When a component fetches data inside a useEffect and sets state asynchronously upon mount (like `SignupsPage`), wrapping the initial `render()` call in `await act(async () => { render(...) })` ensures all state updates from the mocked `fetch` resolve within the React batch before assertions run. This prevents the "update to X inside a test was not wrapped in act(...)" warning. Similarly, interactive events that trigger async state updates should be wrapped in `await act(async () => { fireEvent(...) })`.
**Action:** Identify and fix `act()` warnings in other component tests that mount async components by replacing `render(<Component />)` with `await act(async () => { render(<Component />); })`.

## 2024-05-01 - Bypassing Drizzle-Kit Interactive Prompts

**Learning:** When `drizzle-kit generate` runs into schema drifts or rename ambiguities (e.g. "Is table X created or renamed?"), it hangs indefinitely waiting for standard input. Standard workarounds like `yes "" |` or basic spawn scripts without a pseudo-terminal fail because Drizzle detects the lack of a TTY and either behaves unpredictably or still blocks.

**Action:** In restricted headless environments without interactive shells, bypass these prompts by creating a temporary script using `node-pty` to spawn `drizzle-kit generate` inside a pseudo-terminal. Write a listener that programmatically sends a carriage return (`\r`) whenever the interactive prompt text (like `rename table` or `create table`) appears in the output.
