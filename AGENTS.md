# Repository Instructions

## Tooling

- Use `pnpm` for package management in this repo.
- Before committing, make sure the repo is clean under formatting, linting, tests, and build checks.

## Required Checks

- Run `pnpm run format:check`.
- Run `pnpm run lint`.
- Run `pnpm run test:run`.
- Run `pnpm run build`.

## TypeScript Versions

- `typescript` is deliberately aliased to the `@typescript/typescript6` shim. TypeScript 7.0
  ships only a `tsc` binary with no JavaScript API, and typescript-eslint refuses to load
  against it, so ESLint and editors need the TS 6 API under the `typescript` name.
- TypeScript 7 is installed as `typescript7`, and provides the `tsc` binary that `build` runs.
- Drop the shim once typescript-eslint supports the TS 7.1 API.

## Commit Hook

- `.githooks/pre-commit` runs `format:check` and `lint` before each commit.
- `pnpm install` wires it up via the `prepare` script (`git config core.hooksPath .githooks`).

## Auto-fix Commands

- Use `pnpm run format` to apply Prettier formatting.
- Use `pnpm run lint:fix` to apply safe ESLint fixes.

## Commit Standard

- Do not create a commit until all required checks pass locally.
- If a change breaks lint or formatting, fix that in the same work before considering the task done.
