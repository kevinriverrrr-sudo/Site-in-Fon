# Tooling Setup

This repository is configured with opinionated quality tooling for a Next.js + TypeScript codebase.

## Tooling

- ESLint
  - Base: `next/core-web-vitals` + `@typescript-eslint/recommended`
  - Extras: import ordering (`eslint-plugin-import`), unused vars stricter rule, optional Tailwind class sorting (`eslint-plugin-tailwindcss`).
  - Scripts:
    - `pnpm lint` – run lint checks
    - `pnpm lint:fix` – attempt to automatically fix issues

- Prettier
  - Opinionated formatting with `prettier-plugin-tailwindcss` to sort Tailwind classes.
  - Scripts:
    - `pnpm format` – format the entire repository

- TypeScript
  - `pnpm typecheck` – run `tsc --noEmit` for type checking.

- Husky + lint-staged
  - Pre-commit hook runs linting and formatting on staged files.
  - On lint errors, the commit is blocked.
  - Install hooks via the `prepare` script during `pnpm install`.

- CI (GitHub Actions)
  - On PRs and pushes to `main`/`master`, the workflow installs deps (with caching), runs lint, type-check, Prettier check, and tests.

## Commands

- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm typecheck`
- `pnpm test`

## Notes

- Formatting conflicts are resolved by `eslint-config-prettier` so Prettier remains the source of truth for code style.
- Tailwind plugins are included for sorting, but they are no-ops if you don't use Tailwind classes.
