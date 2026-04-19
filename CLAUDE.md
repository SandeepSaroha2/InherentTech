# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
# Monorepo (Turbo + npm workspaces)
npm run dev              # All apps in parallel
npm run build            # Full monorepo build
npm run lint             # ESLint across all packages
npm run test             # Run tests
npm run format           # Prettier formatting

# Single app dev
npx turbo dev --filter=web          # Main site (port 4004)
npx turbo dev --filter=aiocrm       # CRM (port 4000)
npx turbo dev --filter=ats          # ATS (port 4001)
npx turbo dev --filter=kudodoc      # Document mgmt (port 4002)
npx turbo dev --filter=jobplatform  # Job board (port 4003)

# Database (Prisma — schema in packages/db/prisma/schema.prisma)
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB (no migration file)
npm run db:migrate       # Create & run migration
npm run db:seed          # Seed data
npx turbo db:studio      # Prisma Studio GUI
```

Requires Node >=20, npm 10.8.0. Copy `.env.example` to `.env` at root.

## Architecture

**Monorepo with 5 Next.js 14 apps sharing 4 packages:**

```
apps/
  web/           → Landing + SaaS admin dashboard (:4004)
  aiocrm/        → AI-powered CRM (:4000)
  ats/           → Applicant Tracking System (:4001)
  kudodoc/       → Document management + e-signatures (:4002)
  jobplatform/   → Public job board (:4003)

packages/
  db/            → Prisma schema, Supabase auth/storage, Stripe, Resend, n8n clients
  shared/        → Agent framework, analytics, notifications, integrations, types
  ui/            → Shared React components
  config/        → ESLint, TypeScript, Tailwind shared configs
```

All apps transpile `@inherenttech/ui` and `@inherenttech/shared` via `next.config.js`.

## Agent System

The AI agent framework lives in `packages/shared/src/agents/`:

- **base-agent.ts** — Abstract `BaseAgent` class all agents extend
- **claude-service.ts** — `runClaudeAgent()` drives the agentic loop (prompt → tool_use → tool_result, max 5 rounds) using `@anthropic-ai/sdk`
- **orchestrator.ts** — `AgentOrchestrator` routes requests to the correct agent
- **tools.ts / db-tools.ts** — Tool definitions for Claude function calling
- **implementations/** — `RecruiterIQ`, `BenchIQ`, `ClientIQ` agent implementations

Agents have four autonomy levels: `SHADOW` (observe only), `DRAFT` (human approves all), `ASSISTED` (auto-executes routine, flags exceptions), `FULL_AUTO`.

API endpoints for agents are at `apps/aiocrm/app/api/agents/` and `apps/ats/app/api/agents/`.

## Database

PostgreSQL via Supabase, managed with Prisma. Schema at `packages/db/prisma/schema.prisma` with 45+ models across modules: Auth (Users, UserRoles), CRM (Leads, Companies, Contacts, OutreachCampaigns), ATS (Candidates, Jobs, Submissions, Interviews, Placements, Timesheets, Invoices), Documents (Templates, Signatures), Billing (Subscriptions, UsageMetrics), and Agent tracking (AgentExecutions, AgentActions).

Multi-tenant: all queries scoped by `organizationId`. User roles: OWNER, ADMIN, RECRUITER, EMPLOYEE, CANDIDATE, CLIENT.

## Key Integrations

- **Supabase** — Auth (JWT + RLS) and file storage
- **Stripe** — Subscription billing (packages/db/src/stripe.ts)
- **Resend** — Transactional email (packages/db/src/resend.ts)
- **n8n** — 16 workflow automations (packages/db/src/n8n.ts)
- **Vonage/Retell** — SMS and AI voice calls
- **Anthropic Claude** — Agent AI backbone

## Deployment

Vercel-hosted. GitHub Actions CI/CD in `.github/workflows/`:
- `ci.yml` — lint + type-check + test on PRs
- `deploy.yml` — auto-deploy to Vercel on push to main
- `db-migrate.yml` — manual DB migration trigger
