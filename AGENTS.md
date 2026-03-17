# Repository Instructions

## Tooling

- Use `pnpm` for package management in this repo.
- Before committing, make sure the repo is clean under formatting, linting, tests, and build checks.

## Required Checks

- Run `pnpm run format:check`.
- Run `pnpm run lint`.
- Run `pnpm run test:run`.
- Run `pnpm run build`.

## Auto-fix Commands

- Use `pnpm run format` to apply Prettier formatting.
- Use `pnpm run lint:fix` to apply safe ESLint fixes.

## Commit Standard

- Do not create a commit until all required checks pass locally.
- If a change breaks lint or formatting, fix that in the same work before considering the task done.
