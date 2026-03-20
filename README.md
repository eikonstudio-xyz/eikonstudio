# eikonstudio

Monorepo for all [@eikonstudio](https://www.npmjs.com/org/eikonstudio) packages.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@eikonstudio/config`](./packages/config) | [![npm](https://img.shields.io/npm/v/@eikonstudio/config)](https://www.npmjs.com/package/@eikonstudio/config) | Shared configuration |
| [`@eikonstudio/nano`](./packages/nano) | Pending first release | Strongly typed Gemini and Imagen image generation helpers |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Node.js](https://nodejs.org) v22+ (for tooling compatibility)

### Setup

```bash
# Clone the repo
git clone https://github.com/eikonstudio-xyz/eikonstudio.git
cd eikonstudio

# Install dependencies
bun install

# Build all packages
bun run build
```

## Development

### Common Commands

```bash
# Build all packages
bun run build

# Lint all packages
bun run lint

# Format code
bun run format

# Check formatting
bun run format:check
```

### Adding a New Package

1. Create a new directory under `packages/`:
   ```bash
   mkdir -p packages/my-package/src
   ```

2. Add a `package.json`:
   ```json
   {
     "name": "@eikonstudio/my-package",
     "version": "0.0.1",
     "type": "module",
     "main": "./dist/index.cjs",
     "module": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
         "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
       }
     },
     "files": ["dist"],
     "scripts": {
       "build": "tsup",
       "lint": "eslint src/",
       "dev": "tsup --watch"
     },
     "publishConfig": { "access": "public" }
   }
   ```

3. Add a `tsconfig.json` extending the root and a `tsup.config.ts`. See `packages/config/` for a working example.

4. Run `bun install` from the repo root to link the new workspace.

### Publishing Changes

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

```bash
# After making changes, create a changeset
bun changeset

# Follow the prompts to select packages and bump types
# Commit the changeset file with your PR

# On merge to main, a GitHub Action will:
# 1. Open a "Version Packages" PR with bumped versions + changelogs
# 2. When that PR is merged, packages are published to npm
```

## Repository Structure

```
eikonstudio/
├── .changeset/          # Changesets config and pending changesets
├── .github/workflows/   # CI and release automation
├── packages/
│   ├── config/          # @eikonstudio/config
│   └── nano/            # @eikonstudio/nano
├── turbo.json           # Turborepo pipeline config
├── tsconfig.json        # Base TypeScript config
├── eslint.config.mjs    # ESLint config
└── package.json         # Root workspace config
```

## License

MIT
