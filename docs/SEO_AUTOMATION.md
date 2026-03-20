# SEO Automation — Architecture & Runbook

> **Status:** Active · Last updated: 2026-03-20

---

## Overview

The SEO automation system is built on **four distinct, isolated loops**.
Each loop has a single responsibility. They share no state and never auto-deploy.

```
DATA → CONTENT → DISTRIBUTION → TRAFFIC → CONVERSION → TRACKING → OPTIMISATION
       ↑                                                            ↑
   seo-generate                                              auto-seo-review
```

---

## Workflows

### 1. 🔄 `seo-generate.yml` — SEO Generation Loop

| Property | Value |
|----------|-------|
| Trigger | `workflow_dispatch` + daily `cron: '0 6 * * *'` |
| Permissions | `contents: read` (read-only) |
| Auto-commits | ❌ Never |
| Auto-deploys | ❌ Never |

**What it does:**
1. Runs `npm run seo:generate` → generates 2 400+ SEO page specs
2. Runs `npm run seo:sitemap` → regenerates `sitemap.xml`
3. Runs `npm run seo:validate` → fail-fast if any artifact is invalid
4. Uploads all generated files as a GitHub Actions artifact (14-day retention)

**Artifacts produced:**
- `frontend/src/data/seo/generated-pages.json`
- `frontend/src/data/seo/generated-content.json`
- `frontend/src/data/seo/internal-links-map.json`
- `seo-pages-manifest.json`
- `frontend/public/sitemap.xml`

---

### 2. 🔍 `auto-seo-review.yml` — SEO Analysis Loop

| Property | Value |
|----------|-------|
| Trigger | `workflow_dispatch` + weekly `cron: '0 4 * * 1'` (Monday) |
| Permissions | `contents: read` (read-only) |
| Auto-commits | ❌ Never |
| Auto-deploys | ❌ Never |

**What it does:**
1. Collects SEO signals (CTR, impressions, page views, affiliate clicks)
2. Scores each page with a composite `globalScore`
3. Generates prioritised recommendations (`IMPROVE_TITLE`, `DUPLICATE_PAGE`, …)
4. Builds a file-level patch plan (only against the whitelist)
5. Exports `AUTO_SEO_PLAN.md` — a human-readable review document
6. Uploads all outputs as artifacts (30-day retention)

**Artifacts produced:**
- `signals.json`
- `page-scores.json`
- `recommendations.json`
- `patch-plan.json`
- `AUTO_SEO_PLAN.md` ← **primary review document**
- `pr-title.txt` + `pr-body.md` ← ready for manual PR creation

---

### 3. 🌿 `auto-seo-prepare-pr.yml` — Safe Branch Preparation

| Property | Value |
|----------|-------|
| Trigger | `workflow_dispatch` only (manual — **no schedule**) |
| Permissions | `contents: write` (only when `push_branch=true`) |
| Auto-merges | ❌ Never |
| Auto-deploys | ❌ Never |

**What it does:**
1. Runs the full SEO generation pipeline
2. Validates all artifacts (fails fast if invalid)
3. Creates branch `auto-seo/YYYY-MM-DD`
4. Stages **only whitelisted files** (see below)
5. If `push_branch=true` (input): pushes the branch to remote
6. Human must create and merge the PR manually

**Whitelist** (the only files this workflow will ever commit):
```
frontend/src/data/seo/generated-pages.json
frontend/src/data/seo/generated-content.json
frontend/src/data/seo/internal-links-map.json
seo-pages-manifest.json
frontend/public/sitemap.xml
```

**How to use:**
1. Go to Actions → 🌿 Auto SEO Prepare PR → Run workflow
2. Set `push_branch: true` to actually push
3. Go to GitHub → create PR from `auto-seo/YYYY-MM-DD` → review → merge manually

---

### 4. 📣 `growth-content-export.yml` — Growth Content Export

| Property | Value |
|----------|-------|
| Trigger | `workflow_dispatch` + weekly `cron: '0 7 * * 3'` (Wednesday) |
| Permissions | `contents: read` (read-only) |
| Auto-posts | ❌ Never |
| Auto-commits | ❌ Never |

**What it does:**
1. Runs `scripts/auto-content-engine.mjs`
2. Generates TikTok scripts, Facebook posts, WhatsApp digests
3. Exports `content-posts.md` (human-readable summary of best posts)
4. Uploads artifacts for review

**Artifacts produced:**
- `auto-content-engine-output.json` (full structured output)
- `content-posts.md` (human-readable, ready for review + copy-paste)

---

### 5. 🚀 `deploy-pages.yml` — GitHub Pages Deployment

| Property | Value |
|----------|-------|
| Trigger | Push to `main` + `workflow_dispatch` |
| Deploys | ✅ Only when build + tests are green AND ref is `main` |

**This workflow is untouched by the SEO automation system.**  
The SEO loops never push to `main` automatically, so deployment is always human-gated.

---

## npm Scripts

```bash
# Generate all SEO pages, content, and internal links
npm run seo:generate

# Regenerate sitemap.xml
npm run seo:sitemap

# Validate all SEO artifacts (exits 1 if any check fails)
npm run seo:validate

# Run SEO signal collection + scoring + recommendations
npm run seo:loop

# Build patch plan + export AUTO_SEO_PLAN.md
npm run seo:review-plan

# Full pipeline: generate → sitemap → validate → loop → review-plan
npm run seo:full

# Generate TikTok/Facebook/WhatsApp/SEO content
npm run content:generate
```

---

## Local Workflow

```bash
# 1. Run full SEO generation + validation
npm run seo:full

# 2. Review the plan
cat scripts/auto-seo/output/AUTO_SEO_PLAN.md

# 3. If satisfied, review the content export
npm run content:generate
cat scripts/content-posts.md

# 4. Apply patches manually or trigger prepare-pr workflow
```

---

## Validation Script

`scripts/validate-seo-artifacts.mjs` performs the following checks:

| # | Check | Fail condition |
|---|-------|----------------|
| 1 | `generated-pages.json` summary | `totalPages = 0` |
| 2 | No duplicate URLs | Any URL appears twice in manifest |
| 3 | Required fields | Missing `path` or `title` |
| 4 | Path traversal | Any path contains `../` or forbidden prefix |
| 5 | `seo-pages-manifest.json` | Invalid JSON or 0 pages |
| 6 | `internal-links-map.json` | Invalid JSON or 0 entries |
| 7 | `sitemap.xml` | File missing or invalid XML |
| 8 | `signals.json` | Empty array (if loop has run) |

Exit code `0` = all checks pass. Exit code `1` = at least one failure.

---

## Safety Model

| Behaviour | Guaranteed |
|-----------|-----------|
| Auto-push to `main` | ❌ Impossible |
| Auto-merge | ❌ Impossible |
| Auto-deploy | ❌ Only `deploy-pages.yml` deploys, only on push to `main` |
| Files committed outside whitelist | ❌ `auto-seo-prepare-pr.yml` whitelist enforced |
| Path traversal in generated paths | ❌ Caught by validator (exit 1) |
| Duplicate URLs deployed | ❌ Caught by validator (exit 1) |
| Broken build deployed | ❌ `deploy-pages.yml` verifies `dist/index.html` |

---

## What Is Intentionally NOT Automated

| Feature | Reason |
|---------|--------|
| Auto-merge of SEO PRs | Human review required for quality control |
| Auto-posting to TikTok / Facebook / WhatsApp | Legal + brand risk — human approval required |
| Real-time price scraping | Separate scraping pipeline (`auto-scraping.yml`) |
| Lighthouse CI | Already in `deploy-pages.yml` |
| Auto-push on schedule | Only `auto-seo-prepare-pr.yml` can push, and only manually |
