# CI/CD Pipeline Guide

This document outlines the GitHub Actions CI/CD pipeline for the InherentTech platform monorepo.

## Overview

The pipeline consists of four main workflows that automate testing, building, code quality checks, and deployments.

### Workflows

1. **CI (Continuous Integration)** - Runs on every PR and push to main/develop
2. **Code Quality** - Format checks, dependency audits, and coverage reports
3. **Deploy** - Automated Vercel deployments on push to main
4. **Database Migration** - Manual workflow for database schema updates

## CI Workflow (.github/workflows/ci.yml)

### Triggers
- Push to `main` or `develop` branch
- Pull requests targeting `main` or `develop`

### Jobs

#### 1. Prisma Validation (prisma-validate)
Validates the Prisma schema and generates the client.
- Validates `packages/db/prisma/schema.prisma`
- Generates Prisma client for type safety

#### 2. Linting (lint)
Runs code linters across the monorepo.
- Depends on: `prisma-validate`
- Command: `npx turbo lint`
- Checks code style and quality

#### 3. Type Check & Build (typecheck)
Type checks and builds all packages.
- Depends on: `prisma-validate`
- Command: `npx turbo build`
- Generates optimized production builds

#### 4. Testing (test)
Runs all unit and integration tests.
- Depends on: `typecheck`
- Command: `npx turbo test`
- Validates functionality

### Environment Variables
The CI pipeline uses mock/fake environment variables for Prisma generation:
- `DATABASE_URL`, `DIRECT_URL`: Dummy PostgreSQL URLs
- `SUPABASE_*`: Fake Supabase credentials
- `STRIPE_*`, `RESEND_API_KEY`: Test/fake API keys
- `ANTHROPIC_API_KEY`, `RETELL_API_KEY`, `VONAGE_*`: Test keys

These are used only for schema validation and build steps, not actual operations.

## Code Quality Workflow (.github/workflows/code-quality.yml)

### Triggers
- Pull requests to `main` or `develop`
- Push to `main` or `develop`

### Jobs

#### 1. Format Check (format-check)
Validates code formatting with Prettier.
- Command: `npm run format -- --check`
- Ensures consistent code style

#### 2. Dependency Audit (dependency-audit)
Audits npm dependencies for vulnerabilities.
- Runs `npm audit --audit-level=moderate`
- Checks for outdated packages
- Non-blocking (continues on error for visibility)

#### 3. Test Coverage (test-coverage)
Generates test coverage reports.
- Runs tests with coverage flags
- Non-blocking for visibility

## Deploy Workflow (.github/workflows/deploy.yml)

### Triggers
- Push to `main` branch only

### Jobs
Parallel deployments for all applications:
- **web**: Main platform app
- **aiocrm**: AI-powered CRM
- **ats**: Applicant Tracking System
- **jobplatform**: Job marketplace platform
- **kudodoc**: Document management

Each deployment:
1. Checks out the repository
2. Uses `amondnet/vercel-action@v25` to deploy
3. Requires Vercel API token and project IDs from secrets
4. Deploys with `--prod` flag for production builds

### Required Secrets
In GitHub Settings > Secrets and variables > Actions, add:
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_WEB_PROJECT_ID`: Web app project ID
- `VERCEL_AIOCRM_PROJECT_ID`: AIOCRM app project ID
- `VERCEL_ATS_PROJECT_ID`: ATS app project ID
- `VERCEL_JOBPLATFORM_PROJECT_ID`: Job Platform project ID
- `VERCEL_KUDODOC_PROJECT_ID`: KudoDoc project ID

## Database Migration Workflow (.github/workflows/db-migrate.yml)

### Trigger
Manual trigger via GitHub UI with inputs.

### Usage
1. Go to Actions > Database Migration
2. Click "Run workflow"
3. Enter confirmation string: `MIGRATE`
4. Select target environment: `staging` or `production`
5. Click "Run workflow"

### Safety Features
- Requires explicit confirmation string (`MIGRATE`)
- Environment-specific access controls
- Prevents accidental migrations
- Creates step summary in GitHub
- Sends Slack notification (requires webhook)

### Required Secrets
- `DATABASE_URL`: Production or staging database connection
- `DIRECT_URL`: Direct database connection URL
- `SLACK_WEBHOOK_URL` (optional): For Slack notifications

## Vercel Configuration

Each app has a `vercel.json` configuration file that specifies:
- Build command: Uses Turbo to build specific app
- Output directory: `.next` for Next.js apps
- Node version: 20.x
- Environment variables linked to secrets (using `@variable_name` syntax)

### Vercel Environment Variables Setup
In Vercel dashboard for each project:
1. Settings > Environment Variables
2. Add variables from Vercel secret references:
   - `database_url` → DATABASE_URL
   - `direct_url` → DIRECT_URL
   - `supabase_url` → SUPABASE_URL
   - `supabase_anon_key` → SUPABASE_ANON_KEY
   - `supabase_service_key` → SUPABASE_SERVICE_KEY
   - `next_public_supabase_url` → NEXT_PUBLIC_SUPABASE_URL
   - `next_public_supabase_anon_key` → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `stripe_secret_key` → STRIPE_SECRET_KEY
   - `stripe_publishable_key` → STRIPE_PUBLISHABLE_KEY
   - `next_public_stripe_publishable_key` → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - `resend_api_key` → RESEND_API_KEY
   - `anthropic_api_key` → ANTHROPIC_API_KEY
   - `retell_api_key` → RETELL_API_KEY (AIOCRM only)

## Pull Request Process

### Template
A PR template (`.github/PULL_REQUEST_TEMPLATE.md`) guides contributors to:
- Describe changes and context
- Select change type (bug, feature, breaking, docs, etc.)
- Link related issues
- Describe testing approach
- Complete checklist items:
  - Code style conformance
  - Self-review
  - Documentation updates
  - Tests pass
  - No new warnings
  - Database migration notes (if applicable)
  - Breaking changes documentation

### Checks
Before merging, ensure:
1. All CI jobs pass (Prisma validation, lint, build, test)
2. Code quality checks pass (format, audit)
3. PR template is completed
4. At least one approval from a reviewer
5. No merge conflicts

## Local Development

### Before Committing
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate --schema=packages/db/prisma/schema.prisma

# Run linter
npx turbo lint

# Run tests
npx turbo test

# Format code
npm run format

# Build all packages
npx turbo build
```

### Environment Setup
Create `.env.local` in the root with:
```
DATABASE_URL=postgresql://user:password@localhost:5432/inherenttech
DIRECT_URL=postgresql://user:password@localhost:5432/inherenttech
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-...
RETELL_API_KEY=...
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
```

## Troubleshooting

### Build Failures

**"Prisma Client Generation Failed"**
- Ensure DATABASE_URL is set (even if dummy)
- Check schema syntax: `npx prisma validate --schema=packages/db/prisma/schema.prisma`

**"Turbo Build Failed"**
- Clear cache: `npm run clean`
- Reinstall: `npm ci`
- Check for TypeScript errors: Review build logs

**"Linting Errors"**
- Fix formatting: `npm run format`
- Check lint rules: Review `.eslintrc` files

### Deployment Issues

**Vercel Deploy Fails**
- Verify VERCEL_TOKEN is valid and has org access
- Check VERCEL_PROJECT_ID matches actual Vercel project
- Ensure build command succeeds locally
- Check environment variables in Vercel dashboard

**Database Migration Issues**
- Verify DATABASE_URL is correct for target environment
- Review migration for schema conflicts
- Check Prisma schema validity
- Consider rollback strategy

### CI Pipeline Hangs
- Check for missing environment variables
- Look for infinite loops in build scripts
- Review GitHub Actions logs for timeouts
- Verify Node version compatibility (20.x required)

## Best Practices

1. **Always test locally before pushing**
   - Run full CI checks locally
   - Test database migrations on staging first

2. **Use meaningful commit messages**
   - Reference issue numbers
   - Describe what changed and why

3. **Keep PRs focused**
   - Single feature or fix per PR
   - Easier to review and revert if needed

4. **Document breaking changes**
   - Migration guides for schema changes
   - Update API documentation

5. **Monitor deployments**
   - Check Vercel build logs
   - Test deployed apps thoroughly
   - Have rollback plan ready

6. **Manage secrets securely**
   - Never commit `.env` files
   - Use GitHub environment secrets for sensitive data
   - Rotate tokens regularly

## References

- [Turbo Documentation](https://turbo.build/repo/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
