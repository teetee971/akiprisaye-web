# Pre-Merge Automation Tools

This directory contains scripts and tools to verify code quality and stability before merging to main.

## 🔧 Tools Available

### 1. Automated Pre-Merge Check (`pre-merge-check.sh`)

Comprehensive automated verification script that checks 16 different aspects of the codebase:

**Usage:**
```bash
./scripts/pre-merge-check.sh
```

**What it checks:**
- ✅ Project structure (frontend/ directory)
- ✅ Essential files (main.jsx, App.tsx, Layout.jsx, etc.)
- ✅ Duplicate detection (src/ vs frontend/src/)
- ✅ Dependencies installation (npm ci)
- ✅ Security audit (npm audit)
- ✅ Production build (npm run build)
- ✅ ESLint linting
- ✅ TypeScript check (tsc --noEmit)
- ✅ Essential routes defined
- ✅ Leaflet assets (markers PNG)
- ✅ Logo and favicon
- ✅ PWA manifest
- ✅ Environment variables (.env.example)
- ✅ Exposed secrets detection
- ✅ Cloudflare configuration (_redirects)
- ✅ JS bundle size (warning if > 500KB)

**Exit codes:**
- `0` = All checks passed (🎉 FEU VERT)
- `1` = Blocking errors detected (🚨 FEU ROUGE)

### 2. Interactive Checklist (`pre-merge-checklist.sh`)

Interactive manual verification with 15 questions across 3 categories:

**Usage:**
```bash
./scripts/pre-merge-checklist.sh
```

**Questions:**

**🔴 Critical (5) - Blocking:**
1. Build production passes?
2. Application starts in preview?
3. Main navigation works?
4. Comparator displays?
5. Leaflet map with markers?

**🟡 Important (5) - Warnings:**
6. Mobile responsive?
7. Offline indicator?
8. Notification toasts?
9. Ti-Panier works?
10. Product search?

**🔵 Optional (5) - Continuous improvement:**
11. Lighthouse Performance > 80?
12. Lighthouse Accessibility > 90?
13. PWA installable?
14. Console without errors?
15. SEO meta tags?

**Answers:**
- `o` = yes (functional)
- `n` = no (issue detected)
- `s` = skip (not tested)

### 3. GitHub Actions Workflow

Automatically runs on pull requests to `main` and `develop` branches.

**Jobs:**
1. **pre-merge-check**: Runs automated checks (lint, TypeScript, build, security)
2. **lighthouse-check**: Runs Lighthouse CI performance audits

**Manual trigger:**
You can also manually trigger the workflow from the Actions tab.

## 📋 Pre-Merge Checklist

Before creating a PR to `main`:

1. ✅ Run `./scripts/pre-merge-check.sh` locally
2. ✅ Fix any blocking errors (FEU ROUGE)
3. ✅ Consider fixing warnings
4. ✅ Run `./scripts/pre-merge-checklist.sh` for manual checks
5. ✅ Ensure critical questions all pass
6. ✅ Create PR - GitHub Actions will run automatically
7. ✅ Review workflow results in GitHub Actions
8. ✅ Fix any issues found
9. ✅ Get approval and merge

## 🚀 CI/CD Integration

The `.github/workflows/pre-merge-check.yml` workflow:
- Triggers on PRs to `main` and `develop`
- Runs all automated checks
- Uploads build artifacts
- Runs Lighthouse CI
- Generates markdown summaries
- Comments on PR with results

## 🔍 Lighthouse Configuration

The `.lighthouserc.json` file configures Lighthouse CI:
- Tests routes: `/` and `/#/comparateur`
- Performance threshold: 80%
- Accessibility threshold: 90%
- Best Practices threshold: 85%
- SEO threshold: 90%

## 📝 Notes

- All scripts use colored output with emojis for clarity
- Scripts are designed to be run from the repository root
- Node.js 20+ is required
- The project uses `frontend/` as the main directory

## 🐛 Troubleshooting

**Script fails with "package.json not found":**
- Ensure you're running from the repository root

**Build fails:**
- Check `/tmp/build.log` for details
- Run `cd frontend && npm ci && npm run build` manually

**Linting errors:**
- Check `/tmp/eslint.log` for details
- Run `cd frontend && npm run lint` to see errors
- Run `cd frontend && npm run lint:fix` to auto-fix

**TypeScript errors:**
- Check `/tmp/tsc.log` for details
- Run `cd frontend && npx tsc --noEmit` to see errors

## 🔐 Security

The scripts check for:
- npm audit vulnerabilities
- Exposed secrets in code (API keys, tokens, passwords)
- Proper Cloudflare configuration

Always review security warnings before merging.
