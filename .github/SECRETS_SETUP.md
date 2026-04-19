# GitHub Secrets Configuration Guide

This guide explains how to set up all required secrets for the CI/CD pipeline to work correctly.

## Setting Up GitHub Secrets

### Location
1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"

## Required Secrets

### Vercel Deployment Secrets

These are required for the Deploy workflow to work.

| Secret Name | Description | How to Obtain |
|---|---|---|
| `VERCEL_TOKEN` | Vercel authentication token for CI/CD | Create in Vercel Settings > Tokens > Create Token |
| `VERCEL_ORG_ID` | Your Vercel organization ID | In Vercel dashboard, visible in URL or settings |
| `VERCEL_WEB_PROJECT_ID` | Project ID for the Web app | In Vercel project settings > General |
| `VERCEL_AIOCRM_PROJECT_ID` | Project ID for AIOCRM app | In Vercel project settings > General |
| `VERCEL_ATS_PROJECT_ID` | Project ID for ATS app | In Vercel project settings > General |
| `VERCEL_JOBPLATFORM_PROJECT_ID` | Project ID for Job Platform app | In Vercel project settings > General |
| `VERCEL_KUDODOC_PROJECT_ID` | Project ID for KudoDoc app | In Vercel project settings > General |

### Database Secrets

Required for the Database Migration workflow.

| Secret Name | Description | Example |
|---|---|---|
| `DATABASE_URL` | Full database connection string | `postgresql://user:password@host:5432/database?schema=public` |
| `DIRECT_URL` | Direct database connection (for migrations) | `postgresql://user:password@host:5432/database?schema=public` |

### Optional: Slack Notifications

For database migration notifications.

| Secret Name | Description | How to Obtain |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | Create in Slack workspace > Apps > Incoming Webhooks |

## Step-by-Step Setup Instructions

### 1. Vercel Token and IDs

#### Get Vercel Token
1. Log in to [Vercel](https://vercel.com)
2. Go to Settings > Tokens
3. Click "Create Token"
4. Name it something like "GitHub CI/CD"
5. Copy the token
6. In GitHub, create secret `VERCEL_TOKEN` with this value

#### Get Vercel Organization ID
1. In Vercel dashboard, go to Settings
2. Find "Team ID" or "Organization ID" (visible in URL bar too)
3. Create secret `VERCEL_ORG_ID` with this value

#### Get Project IDs
For each app (web, aiocrm, ats, jobplatform, kudodoc):
1. Go to that project in Vercel
2. Click Settings (top navigation)
3. Scroll to bottom of General section
4. Find "Project ID"
5. Create corresponding secret:
   - `VERCEL_WEB_PROJECT_ID`
   - `VERCEL_AIOCRM_PROJECT_ID`
   - `VERCEL_ATS_PROJECT_ID`
   - `VERCEL_JOBPLATFORM_PROJECT_ID`
   - `VERCEL_KUDODOC_PROJECT_ID`

### 2. Database Connection Strings

#### For PostgreSQL/Supabase
```
postgresql://username:password@host:5432/database?schema=public
```

Replace:
- `username`: Your database user
- `password`: Your database password
- `host`: Your database host (e.g., `db.example.com`)
- `5432`: Your database port
- `database`: Your database name
- `public`: Your schema name

#### For Supabase
1. Go to [Supabase](https://supabase.com)
2. Select your project
3. Settings > Database > Connection String
4. Choose "PostgreSQL" tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual password
7. Add `?schema=public` if not present

#### Create Secrets
1. Create `DATABASE_URL` with your connection string
2. Create `DIRECT_URL` with the same connection string (Prisma requirement)

### 3. Set Up Slack Notifications (Optional)

#### Create Slack Webhook
1. Go to your Slack workspace
2. Settings & administration > Manage apps
3. Search "Incoming Webhooks"
4. Click to install/open
5. Click "Add New Webhook to Workspace"
6. Select a channel (or create new #infrastructure-notifications)
7. Click "Allow"
8. Copy the Webhook URL
9. Create secret `SLACK_WEBHOOK_URL` with this value

## Environment-Specific Secrets

For environment-specific deployments (staging vs production), you can use GitHub Environments:

1. Go to Settings > Environments
2. Click "New environment"
3. Name it (e.g., "production", "staging")
4. Add secrets specific to that environment
5. In workflows, use: `environment: production` in the job

Example:
```yaml
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
```

## Vercel Project Environment Variables

After setting up GitHub secrets, configure environment variables in each Vercel project:

### For Each Vercel Project

1. Go to project Settings
2. Environment Variables
3. Add these variables (linking to GitHub secrets where applicable):

**Production Environment:**
```
DATABASE_URL = (from production database)
DIRECT_URL = (from production database)
SUPABASE_URL = your-project.supabase.co
SUPABASE_ANON_KEY = anon_key_from_supabase
SUPABASE_SERVICE_KEY = service_role_key_from_supabase
NEXT_PUBLIC_SUPABASE_URL = your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = anon_key_from_supabase
STRIPE_SECRET_KEY = sk_live_... (production)
STRIPE_PUBLISHABLE_KEY = pk_live_... (production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_... (production)
RESEND_API_KEY = re_... (production key)
ANTHROPIC_API_KEY = sk-... (production key)
RETELL_API_KEY = (for AIOCRM only)
```

**Preview Environment:**
```
DATABASE_URL = (from staging database)
DIRECT_URL = (from staging database)
SUPABASE_URL = your-project.supabase.co
SUPABASE_ANON_KEY = anon_key_from_supabase
STRIPE_SECRET_KEY = sk_test_... (test key)
STRIPE_PUBLISHABLE_KEY = pk_test_... (test key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_... (test key)
```

## Security Best Practices

1. **Rotate tokens regularly**
   - Regenerate Vercel tokens every 3-6 months
   - Update database passwords when policy requires

2. **Use least privilege**
   - Create service accounts for CI/CD
   - Limit token scopes to necessary permissions only

3. **Never commit secrets**
   - Always use GitHub Secrets
   - Add `.env*` to `.gitignore`
   - Review commits before pushing

4. **Audit secret usage**
   - Regularly review which workflows use which secrets
   - Monitor GitHub Actions logs (be careful not to log secrets)
   - Track who has access to secrets

5. **Use environment protection rules**
   - Go to Settings > Environments
   - Enable "Require approval before deploying to this environment"
   - Add reviewers for production deployments

## Troubleshooting Secrets Issues

### "Secret not found" error
- Verify secret name is spelled correctly (case-sensitive)
- Ensure you're using `${{ secrets.SECRET_NAME }}` syntax
- Check secret is available to the branch (secrets work on all branches by default)

### Workflow fails silently with secret
- Secrets are masked in logs (shows `***`)
- Check secret value doesn't contain special characters that need escaping
- For multi-line values, use literal block in YAML: `|`

### Vercel deployment fails with auth error
- Verify VERCEL_TOKEN is valid and not expired
- Check token has permission to access the organization
- Try regenerating the token in Vercel

### Database connection fails
- Test connection string locally: `psql "your-connection-string"`
- Ensure IP is whitelisted in database firewall
- Check password doesn't contain special characters that need URL encoding
- For Supabase, verify schema name is correct

## Checklist

- [ ] Created VERCEL_TOKEN secret
- [ ] Created VERCEL_ORG_ID secret
- [ ] Created VERCEL_WEB_PROJECT_ID secret
- [ ] Created VERCEL_AIOCRM_PROJECT_ID secret
- [ ] Created VERCEL_ATS_PROJECT_ID secret
- [ ] Created VERCEL_JOBPLATFORM_PROJECT_ID secret
- [ ] Created VERCEL_KUDODOC_PROJECT_ID secret
- [ ] Created DATABASE_URL secret
- [ ] Created DIRECT_URL secret
- [ ] (Optional) Created SLACK_WEBHOOK_URL secret
- [ ] Set up environment variables in each Vercel project
- [ ] Tested a deployment workflow runs successfully
- [ ] Verified application deployed correctly after workflow

## References

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Tokens](https://vercel.com/account/tokens)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Prisma DATABASE_URL](https://www.prisma.io/docs/reference/database-reference/connection-urls)
