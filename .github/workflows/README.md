# GitHub Actions Workflows

This directory contains the automated workflow for continuous integration and deployment.

## Main Workflow ([main.yml](main.yml))

A unified workflow that handles both CI testing and automated releases. Mirrors the functionality from [f5-corkscrew](https://github.com/f5devcentral/f5-corkscrew).

### Triggers

- **Push to `main`** - Runs tests, creates GitHub release, publishes to npm
- **Pull requests to `main` or `develop`** - Runs tests only (no release)

### Jobs

#### 1. Test Job

Runs on every push and PR across multiple platforms:

- **Operating Systems:** Windows, Ubuntu, macOS
- **Node.js version:** 20.x

**Steps:**
1. Checkout code
2. Setup Node.js with npm cache
3. Install dependencies (`npm ci`)
4. Run linter (`npm run lint`)
5. Compile TypeScript (`npm run compile`)
6. Run tests (`npm test`)

#### 2. Release-Publish Job

**Only runs on pushes to `main` branch** (skipped for PRs).

Runs after all tests pass successfully.

**Steps:**
1. Checkout code
2. Setup Node.js with npm registry
3. Install dependencies
4. Extract version from `package.json`
5. Read changelog entry for that version from `CHANGELOG.md`
6. Compile TypeScript
7. Create npm package tarball
8. Create GitHub release with:
   - Tag: `v{version}` (e.g., `v1.2.0`)
   - Release notes from CHANGELOG.md
   - Attached tarball artifact
9. Publish to npm with provenance

**Requirements:**
- `NPM_TOKEN` secret must be configured
- `CHANGELOG.md` must have an entry matching the current version
- GitHub environment `publishing` (optional, for approval gates)

## Setup Instructions

### 1. Configure NPM Token

1. Generate an npm access token:
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to Account Settings → Access Tokens
   - Generate a new **Automation** token

2. Add token to GitHub repository secrets:
   - Repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm automation token

### 2. Configure Publishing Environment (Optional)

For manual approval before releases:

1. Repository Settings → Environments
2. Create environment named: `publishing`
3. Add protection rules:
   - Required reviewers (optional)
   - Deployment branches: `main` only

### 3. Prepare CHANGELOG.md

Ensure your `CHANGELOG.md` follows Keep a Changelog format:

```markdown
# Change Log

## [1.2.0] - (2025-01-15)

### Added
- New feature description

### Changed
- Change description

### Fixed
- Bug fix description

---

## [1.1.0] - (2024-12-10)
...
```

**Critical:** Version in heading (e.g., `[1.2.0]`) must match `package.json` version.

## Release Process

The workflow runs automatically. To release a new version:

1. **Update version:**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Update CHANGELOG.md:**
   - Add section with new version number
   - Document all changes (Added, Changed, Fixed, etc.)

3. **Commit and push:**
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.2.1"
   git push origin main
   ```

4. **Workflow automatically:**
   - Tests on Windows, Ubuntu, macOS
   - Creates GitHub release (tag `v1.2.1`)
   - Publishes to npm with provenance
   - Attaches tarball to release

## Workflow Behavior

| Event | Test Job | Release Job |
|-------|----------|-------------|
| Push to `main` | ✅ Runs | ✅ Runs (after tests) |
| PR to `main` | ✅ Runs | ❌ Skipped |
| PR to `develop` | ✅ Runs | ❌ Skipped |

## Status Badge

Add to your README:

```markdown
[![Main](https://github.com/f5devcentral/f5-conx-core/workflows/Main/badge.svg)](https://github.com/f5devcentral/f5-conx-core/actions/workflows/main.yml)
```

## Troubleshooting

### "No changelog entry found"

- Verify `CHANGELOG.md` has section matching version in `package.json`
- Check format: `## [1.2.0]`
- Ensure proper Keep a Changelog structure

### "Cannot publish over existing version"

- Version already exists on npm
- Bump version: `npm version patch|minor|major`
- Update `CHANGELOG.md` to match

### NPM publish fails (403 error)

- Verify `NPM_TOKEN` secret is correct
- Ensure token has Automation permissions
- Confirm npm account has publish access to package

### Tests pass locally but fail in CI

- Check Node.js version (workflow uses v20)
- Review CI logs for environment differences
- Ensure all dependencies in `package.json`

### Release created but npm publish failed

- GitHub release exists, package not published
- Fix npm token issue
- Either:
  - Manually run `npm publish`
  - Delete release and tag, then re-push

## Design Rationale

**Why one workflow instead of separate CI/Release workflows?**

1. **Less duplication** - Tests run once for PRs, tests + release for main
2. **Simpler maintenance** - Single source of truth
3. **Conditional logic** - Release job only runs on main pushes
4. **Mirrors f5-corkscrew** - Proven pattern from sister project

**Why Node 20 only (not matrix of 18/20/22)?**

- Faster CI feedback
- Node 20 is LTS and recommended version
- Add more versions if needed for compatibility testing
