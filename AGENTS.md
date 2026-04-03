# AGENTS.md — eikonstudio monorepo

## Overview

Bun-powered monorepo for the `@eikonstudio` npm organization. All publishable packages live under `packages/`. Build orchestration is handled by Turborepo, versioning and publishing by Changesets.

## Repository Structure

```
eikonstudio/
├── packages/               # All publishable @eikonstudio/* packages
│   └── <pkg>/
│       ├── src/            # Source code (TypeScript)
│       ├── dist/           # Build output (gitignored)
│       ├── package.json    # Scoped name, dual ESM/CJS exports, publishConfig
│       ├── tsconfig.json   # Extends root tsconfig.json
│       └── tsup.config.ts  # Bundler config (ESM + CJS + dts)
├── .changeset/             # Changesets config and pending changeset files
├── .github/workflows/      # CI (ci.yml) and release automation (release.yml)
├── turbo.json              # Turborepo task pipeline
├── tsconfig.json           # Base TypeScript config (all packages extend this)
├── eslint.config.mjs       # Root ESLint flat config (v10, typescript-eslint)
├── .prettierrc             # Prettier config
└── package.json            # Root workspace definition (private, not published)
```

## Tech Stack

- **Runtime & Package Manager:** Bun
- **Build Orchestration:** Turborepo
- **Bundler:** tsup (ESM + CJS dual output with declarations)
- **Language:** TypeScript (strict mode, ES2022 target, bundler module resolution)
- **Linting:** ESLint v10 with typescript-eslint (flat config)
- **Formatting:** Prettier
- **Versioning & Publishing:** Changesets with GitHub changelog
- **CI/CD:** GitHub Actions

## Key Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install all workspace dependencies |
| `bun run build` | Build all packages via Turborepo |
| `bun run lint` | Lint all packages via Turborepo |
| `bun run test` | Run tests across all packages via Turborepo |
| `bun run format` | Format all files with Prettier |
| `bun run format:check` | Check formatting without writing |
| `bun changeset` | Create a changeset for version bumping |
| `bun run version-packages` | Apply changeset versions and update lockfile |
| `bun run release` | Build all packages and publish changed ones to npm |

## Adding a New Package

1. Create `packages/<name>/` with `src/index.ts` as the entry point.
2. Add a `package.json` with:
   - `"name": "@eikonstudio/<name>"`
   - `"type": "module"`
   - Dual ESM/CJS exports via the `"exports"` field (see `packages/config/package.json` as reference)
   - `"publishConfig": { "access": "public" }`
   - Scripts: `"build": "tsup"`, `"lint": "eslint src/"`, `"dev": "tsup --watch"`
3. Add a `tsconfig.json` that extends `../../tsconfig.json`.
4. Add a `tsup.config.ts` with `format: ["esm", "cjs"]`, `dts: true`, `clean: true`.
5. Run `bun install` from the root to link the new workspace.

Use `packages/config/` as the canonical template for new packages.

## Coding Conventions

- **TypeScript only** — no plain JS files in packages.
- **Strict mode** — `strict: true`, `noUncheckedIndexedAccess: true` in tsconfig.
- **ESM first** — all packages use `"type": "module"`. CJS is generated as a build artifact.
- **No relative cross-package imports** — depend on sibling packages via `"workspace:*"` in `package.json`, never via `../../other-package`.
- **Exports field required** — every package must define conditional `"exports"` with both `"import"` and `"require"` conditions, each with `"types"` listed first.
- **Formatting** — Prettier with: semicolons, double quotes, 2-space indent, trailing commas, 100 char width.
- **Linting** — ESLint flat config at root. Packages inherit it automatically.

## Versioning & Publishing

This repo uses [Changesets](https://github.com/changesets/changesets).

- All packages under `packages/` are published to npm under the `@eikonstudio` scope with public access.
- When making a change that should result in a version bump, run `bun changeset` and commit the generated file.
- On merge to `main`, GitHub Actions runs the changesets action which either:
  - Opens a "Version Packages" PR to bump versions and update changelogs, or
  - Publishes packages if the version PR was just merged.
- Internal dependency versions are updated automatically (`"updateInternalDependencies": "patch"`).

## CI/CD

- **ci.yml** — Runs on PRs and pushes to `main`. Installs deps, builds, lints, and checks formatting.
- **release.yml** — Runs on push to `main`. Uses `changesets/action` to manage version PRs and npm publishing. Requires `NPM_TOKEN` secret in the GitHub repo.

## Dependencies

- Always install dev dependencies at the **root** level for shared tooling (eslint, prettier, typescript, tsup, turbo, changesets).
- Package-specific runtime dependencies go in each package's own `package.json`.
- Use `bun add -d <pkg>@latest` at the root for new shared dev deps. Never hardcode version numbers — always install via the package manager to resolve the latest.

## File Conventions

- Entry point: `src/index.ts`
- Build output: `dist/` (gitignored, included in npm via `"files": ["dist"]`)
- Config files at package level: `tsconfig.json`, `tsup.config.ts`
- No `test/` directory convention enforced yet — adopt when adding a test framework.

## Cursor Cloud specific instructions

- **Bun must be installed** before running any commands. The VM update script handles `bun install`, but Bun itself is installed via the VM snapshot (not the update script). If Bun is missing, install it with `curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.10"` and add `~/.bun/bin` to `PATH`.
- **No external services required.** All tests use mocks/spies. No databases, Docker, or API keys are needed for the standard dev workflow.
- **`@eikonstudio/nano` live smoke test** (`bun run test:live` in `packages/nano`) is opt-in and requires `GEMINI_API_KEY` in `packages/nano/.env.test` plus `NANO_LIVE_TEST=1`. It is skipped by default.
- **Pre-existing lint error** in `@eikonstudio/ports`: `KillByNameOptions` is defined but never used. This is not caused by Cloud Agent changes.
- **Turborepo test pipeline** requires a build first (`turbo.json` declares `"test"` depends on `"build"`). Running `bun run test` automatically triggers the build.
- **Before pushing**, always run `bun run format:check` (see `.cursor/rules/prettier-before-push.mdc`).
