# CI/CD Quick Start Guide

Get your CI/CD pipeline running in 5 minutes.

## Prerequisites
- GitHub repository access
- Vercel account with projects created
- PostgreSQL database connection string

## Step 1: Add GitHub Secrets (2 min)

Go to: **Repository Settings > Secrets and variables > Actions > New repository secret**

Add these 7 secrets:

```
VERCEL_TOKEN = [get from vercel.com/account/tokens]
VERCEL_ORG_ID = [from Vercel settings]
VERCEL_WEB_PROJECT_ID = [from Vercel project settings]
VERCEL_AIOCRM_PROJECT_ID = [from Vercel project settings]
VERCEL_ATS_PROJECT_ID = [from Vercel project settings]
VERCEL_JOBPLATFORM_PROJECT_ID = [from Vercel project settings]
VERCEL_KUDODOC_PROJECT_ID = [from Vercel project settings]
DATABASE_URL = postgresql://user:pass@host:5432/db
DIRECT_URL = postgresql://user:pass@host:5432/db
```

**Done!** Workflows will now start on PR/push.

## Step 2: Configure Vercel Environment Variables (2 min)

For **each app** in Vercel (web, aiocrm, ats, jobplatform, kudodoc):

1. Project Settings > Environment Variables
2. Add these variables using values from GitHub Secrets:
   - DATABASE_URL
   - DIRECT_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - RESEND_API_KEY
   - ANTHROPIC_API_KEY
   - RETELL_API_KEY (AIOCRM only)

Use test keys for Preview, production keys for Production.

## Step 3: Test It (1 min)

1. Create a new branch: `git checkout -b test/ci-pipeline`
2. Make a trivial change (e.g., update README.md)
3. Push: `git push origin test/ci-pipeline`
4. Open a PR
5. Watch **Actions** tab - CI workflow should run

## That's it! 🎉

Your pipeline is live. Here's what happens next:

### On Every PR
- Lint runs
- Type checking runs
- Tests run
- Code quality checks run
- Status shown on PR

### On Push to main
- Same checks run
- Auto-deploys to Vercel if all pass
- All 5 apps deploy in parallel

### Manual Database Migration
- Actions > Database Migration
- Click "Run workflow"
- Type "MIGRATE" to confirm
- Select environment
- Runs db migration

## Common Commands

```bash
# Test locally before pushing
npm ci
npx prisma generate --schema=packages/db/prisma/schema.prisma
npx turbo lint
npx turbo test
npx turbo build
npm run format
```

## Need Help?

- **Full Guide:** See `.github/CI_CD_GUIDE.md`
- **Secrets Issues:** See `.github/SECRETS_SETUP.md`
- **PR Template:** Check `.github/PULL_REQUEST_TEMPLATE.md`
- **Troubleshooting:** See CI_CD_GUIDE.md > Troubleshooting section

## Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Main CI pipeline |
| `.github/workflows/deploy.yml` | Production deployments |
| `.github/workflows/code-quality.yml` | Code quality checks |
| `.github/workflows/db-migrate.yml` | Database migrations |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR guidelines |
| `vercel.json` | Root Vercel config |
| `apps/*/vercel.json` | App-specific Vercel configs |

## Status Check

View pipeline status anytime:
- **GitHub Actions tab:** All workflow runs
- **PR checks:** Shows which checks passed/failed
- **Vercel dashboard:** Live deployments

---

**Ready to deploy!** Create a PR and watch the pipeline run automatically.
