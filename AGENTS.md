# Repository Guidelines

This document describes contribution expectations for the Wallyball League Dashboard repository.

## Project Structure & Module Organization
- `app/`: Next.js application source (pages/app routes, components).
- `lib/`: shared utilities and helper modules.
- `db/`, `migrations/`: database schema and migration scripts.
- `__tests__/` and `test_*.js`: unit/integration tests.
- `attached_assets/`, `Docs/`: images and documentation.

## Build, Test, and Development Commands
- `npm run dev` — run Next.js in development on port 5001.
- `npm run build` — production build (`next build`).
- `npm run start` — start built app on port 5000.
- `npm test` — run Jest test suite.
- `npm run test:watch` — Jest in watch mode.
- `npm run test:coverage` — generate test coverage report.
- `npm run lint` — run ESLint across the repo (`npx eslint . --ext .ts,.tsx,.js,.jsx`).
- `npm run lint:fix` — run ESLint autofix (`--fix`).

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js). Follow existing `.eslintrc.cjs` and `tsconfig.json`.
- Indentation: 2 spaces. Use camelCase for variables, PascalCase for React components.
- Files: use `.ts`/`.tsx` for typed modules, `.js` only for scripts/tests if needed.
- Formatting: project does not include Prettier; use ESLint autofix (`npx eslint --fix`) or editor formatter.

## Testing Guidelines
- Framework: Jest with React Testing Library (`@testing-library/*`).
- Test files: name `*.test.ts`, `*.test.tsx`, or `*.test.js` and place near the unit under test or in `__tests__/`.
- Coverage: aim to cover critical business logic (use `npm run test:coverage`).

## Commit & Pull Request Guidelines
- Commit style: short imperative subject, optional scope, one-line summary, blank line, longer body. Example:
  `feat(stats): add player summary (#123)`
- PR checklist: link issue, describe change, include screenshots for UI changes, add tests for new logic, request reviewers.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` for local variables and refer to `.env.example`.
- Review `drizzle.config.ts` and DB migrations when changing schemas.

The repository includes a GitHub Action that runs `npm run lint` on pull requests to `main`.

If you want, I can also add a PR template—tell me which to add.
