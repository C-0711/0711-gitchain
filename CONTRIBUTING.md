# Contributing to GitChain

Thank you for your interest in contributing to GitChain!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/C-0711/0711-gitchain.git
cd 0711-gitchain

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm dev
```

## Project Structure

```
0711-gitchain/
├── packages/           # Core packages
│   ├── core/          # Schema, types, validation
│   ├── git/           # Git versioning layer
│   ├── chain/         # Blockchain anchoring
│   ├── inject/        # Context injection
│   ├── ipfs/          # IPFS storage
│   ├── dpp/           # Digital Product Passport
│   ├── c2pa/          # Content authenticity
│   └── sdk/           # Client SDK
├── apps/              # Applications
│   ├── api/           # REST + GraphQL API
│   ├── hub/           # Container browser
│   ├── verify/        # Verification portal
│   └── landing/       # Marketing site
├── cli/               # Command-line interface
├── sdks/              # Language SDKs
│   └── python/        # Python SDK
├── docs/              # Documentation
├── examples/          # Usage examples
└── scripts/           # Utility scripts
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Commit with conventional commits: `git commit -m "feat: add feature"`
6. Push and create a PR

## Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Package Development

Each package should:

- Export types from `src/types.ts`
- Export main API from `src/index.ts`
- Include a `README.md`
- Have unit tests in `test/`

## Questions?

- GitHub Issues: [github.com/C-0711/0711-gitchain/issues](https://github.com/C-0711/0711-gitchain/issues)
- Discord: [discord.gg/0711](https://discord.gg/0711)
