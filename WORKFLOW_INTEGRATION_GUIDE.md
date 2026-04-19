# n8n Workflow Integration Guide

## Overview

This document describes the n8n workflow system for InherentTech Platform and how it integrates with the CRM/ATS systems.

## Architecture

The workflow system consists of three layers:

```
┌─────────────────────────────────────────────┐
│  CRM/ATS API Routes                         │
│  (Create/Update Lead, Candidate, Job, etc)  │
└──────────────┬──────────────────────────────┘
               │ Event Dispatch
               ▼
┌─────────────────────────────────────────────┐
│  Agent Event Hooks                          │
│  (apps/aiocrm/src/lib/agent-hooks.ts)      │
│  (apps/ats/src/lib/agent-hooks.ts)         │
└──────────────┬──────────────────────────────┘
               │ Fire-and-Forget
       ┌───────┴──────────┐
       ▼                  ▼
┌──────────────┐   ┌─────────────────┐
│ n8n Webhooks │   │ Agent API       │
│ /webhook/*   │   │ /api/agents     │
└──────────────┘   └─────────────────┘
```

## 16 Workflow Definitions

All workflows are defined in:
```
packages/db/src/workflows/index.ts
```

### CRM Workflows

1. **Lead Scoring** (`lead-scoring`)
   - Webhook trigger on new lead creation
   - Enriches company data
   - Calculates lead score (0-100)
   - Classifies as HOT/WARM/COLD
   - Updates CRM and notifies Slack

2. **Lead Nurture Sequence** (`lead-nurture-sequence`)
   - Multi-touch email campaign
   - 4 emails over 14 days
   - Day 0: Welcome
   - Day 3: Value proposition
   - Day 7: Case study
   - Day 14: Meeting request

3. **New Lead Slack Alert** (`new-lead-slack-alert`)
   - Real-time notification
   - Posts to #sales channel
   - Includes company, contact, source, value, tier

### ATS Workflows

4. **Resume Parser & Enrichment** (`resume-parser`)
   - Parses PDF/DOCX resumes with Claude AI
   - Extracts structured candidate data
   - Updates candidate record
   - Notifies recruiter

5. **Candidate-Job Matcher** (`candidate-job-matcher`)
   - Matches candidates to open job orders
   - Scores matches (0-100)
   - Identifies top 5 matches per candidate
   - Creates submissions automatically

6. **Interview Scheduler** (`interview-scheduler`)
   - Finds available time slots
   - Sends candidate options
   - Creates calendar events
   - Sends confirmations and reminders

7. **Submission Status Notification** (`submission-status-notify`)
   - Notifies candidate and recruiter on status change
   - Customized messages per status
   - Tracks email opens
   - Updates ATS record

### Outreach Workflows

8. **Email Outreach Sequence** (`email-outreach-sequence`)
   - Targets passive candidates
   - 3-week campaign
   - Adaptive: skips email if reply received
   - Day 0: Initial outreach
   - Day 4: First follow-up
   - Day 11: Value prop follow-up

9. **LinkedIn Outreach Bot** (`linkedin-outreach`)
   - Searches for target candidates
   - Sends connection requests
   - Logs outreach attempts
   - Tracks engagement

### Operations Workflows

10. **Follow-Up Reminder** (`follow-up-reminder`)
    - Daily at 9am
    - Checks pending follow-ups
    - Sends Slack reminders by user
    - Tracks response times

11. **Weekly Timesheet Reminder** (`weekly-timesheet-reminder`)
    - Friday at 9am
    - Emails active placement contractors
    - Slack alerts to operations team
    - Tracks submission rate

12. **Invoice Generator** (`invoice-generator`)
    - Triggered on timesheet approval
    - Calculates invoice totals
    - Generates invoice record
    - Sends to client for approval

### Document Workflows

13. **Placement Onboarding** (`placement-onboarding`)
    - Generates offer letter
    - Creates DocuSign envelope
    - Sends onboarding kit
    - Schedules orientation
    - Notifies team

14. **Document Signature Reminder** (`signature-reminder`)
    - Daily at 10am
    - Checks pending signatures
    - Sends reminders at 1, 3, and 7 days
    - Escalates overdue to manager

15. **Document Expiry Alert** (`document-expiry-alert`)
    - Daily at 7am
    - Monitors document expiration dates
    - Alerts 30, 14, 7, and 1 day before
    - Critical alerts to HR

### AI Agent Workflows

16. **AI Agent Orchestrator** (`ai-agent-orchestrator`)
    - Central routing workflow
    - Receives all CRM/ATS events
    - Dispatches to appropriate AI agent
    - Applies agent recommendations
    - Logs all AI actions to audit trail

## Event-Driven Architecture

### CRM Events

**File:** `apps/aiocrm/src/lib/agent-hooks.ts`

Triggered events:
- `lead.created` → `new-lead-slack-alert`
- `lead.stage_changed` → `lead-scoring`
- `lead.nurture_started` → `lead-nurture-sequence`

### ATS Events

**File:** `apps/ats/src/lib/agent-hooks.ts`

Triggered events:
- `candidate.created` → `candidate-job-matcher`
- `candidate.resume_parsed` → `resume-parser`
- `job_order.created` → `candidate-job-matcher`
- `submission.status_changed` → `submission-status-notify`
- `interview.scheduled` → `interview-scheduler`
- `placement.created` → `placement-onboarding`
- `placement.ending_soon` → `follow-up-reminder`
- `timesheet.submitted` → `weekly-timesheet-reminder`
- `timesheet.approved` → `invoice-generator`
- `invoice.created` → (logging)
- `invoice.overdue` → `follow-up-reminder`
- `document.signature_requested` → `signature-reminder`
- `document.expiring` → `document-expiry-alert`

## Integration Points

### CRM Lead Routes

**File:** `apps/aiocrm/src/app/api/leads/route.ts`

```typescript
POST /api/leads
├─ Create lead in DB
├─ Log audit entry
└─ Dispatch agentEvents.leadCreated()  ← Triggers workflows
```

**File:** `apps/aiocrm/src/app/api/leads/[id]/route.ts`

```typescript
PATCH /api/leads/[id]
├─ Update lead fields
├─ Log stage changes
└─ Dispatch agentEvents.leadStageChanged()  ← Triggers workflows
```

### ATS Candidate Routes

**File:** `apps/ats/src/app/api/candidates/route.ts`

```typescript
POST /api/candidates
├─ Create candidate in DB
└─ Dispatch agentEvents.candidateCreated()  ← Triggers workflows
```

**File:** `apps/ats/src/app/api/candidates/parse-resume/route.ts`

```typescript
POST /api/candidates/parse-resume
├─ Parse resume with Claude AI
├─ Extract structured data
└─ Dispatch agentEvents.resumeParsed()  ← Triggers workflows
```

### ATS Job Order Routes

**File:** `apps/ats/src/app/api/jobs/route.ts`

```typescript
POST /api/jobs
├─ Create job order in DB
└─ Dispatch agentEvents.jobOrderCreated()  ← Triggers workflows
```

### ATS Submission Routes

**File:** `apps/ats/src/app/api/submissions/[id]/route.ts`

```typescript
PATCH /api/submissions/[id]
├─ Update submission status
├─ Auto-create placement on ACCEPTED
├─ Dispatch agentEvents.submissionStatusChanged()  ← Triggers workflows
└─ Dispatch agentEvents.placementCreated()  ← Triggers workflows
```

## Setup Instructions

### 1. n8n Installation

```bash
# Install n8n locally or use cloud
npm install -g n8n
n8n start

# Access at http://localhost:5678
```

### 2. Import Workflows

Use the workflow definitions from `packages/db/src/workflows/index.ts`:

```bash
# Via n8n API
curl -X POST http://localhost:5678/api/workflows \
  -H "Content-Type: application/json" \
  -d @workflow-definition.json
```

Or manually import via UI:
1. Click "Create" → "New Workflow"
2. Click "+" → "Import from URL" or paste JSON

### 3. Configure Webhooks

Each workflow has a webhook path. Enable webhook triggers:

```
Trigger Node → "Webhook" type
Method: POST
Path: /webhook/{workflow-name}
```

Full webhook URLs:
```
http://localhost:5678/webhook/lead-scoring
http://localhost:5678/webhook/new-lead-slack-alert
http://localhost:5678/webhook/candidate-job-matcher
...etc
```

### 4. Configure Slack Integration (Optional)

For workflows that post to Slack:

1. Create Slack App
2. Generate bot token
3. In n8n, add Slack credentials:
   - Settings → Credentials
   - Add Slack credential with bot token
   - Authorize channels (#sales, #recruiting, #operations, #hr-alerts)

### 5. Configure Email Provider

For email workflows (nurture, reminders, etc.):

1. Add email provider (Gmail, SendGrid, etc.)
2. In n8n → Credentials → Add Email credential
3. Update email addresses in workflows

### 6. Environment Variables

```bash
# .env
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_URL=http://your-domain.com/webhooks/n8n
AGENT_API_URL=http://localhost:3000/api/agents
PLATFORM_URL=http://localhost:3000
```

### 7. Platform Configuration

In platform `.env.local`:

```bash
N8N_BASE_URL=http://localhost:5678
AGENT_API_URL=http://localhost:3000/api/agents
```

## Usage Examples

### Creating a Lead (Triggers Workflow)

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_123" \
  -H "x-user-id: user_456" \
  -d '{
    "companyName": "Acme Corp",
    "contactName": "John Doe",
    "contactEmail": "john@acme.com",
    "contactPhone": "+1-555-1234",
    "source": "LinkedIn",
    "value": 50000
  }'
```

**Triggered workflows:**
1. `new-lead-slack-alert` (immediate)
2. `lead-scoring` (may be triggered by stage change)

### Creating a Candidate (Triggers Workflow)

```bash
curl -X POST http://localhost:3000/api/candidates \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_123" \
  -H "x-user-id: user_456" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "currentTitle": "Senior Developer",
    "skills": ["Python", "AWS", "React"],
    "yearsOfExperience": 8
  }'
```

**Triggered workflows:**
1. `candidate-job-matcher` (immediate)

### Parsing a Resume

```bash
curl -X POST http://localhost:3000/api/candidates/parse-resume \
  -F "file=@resume.pdf" \
  -H "x-org-id: org_123" \
  -H "x-user-id: user_456" \
  -H "x-candidate-id: cand_789"
```

**Triggered workflows:**
1. `resume-parser` (processes resume)

### Updating Submission Status

```bash
curl -X PATCH http://localhost:3000/api/submissions/sub_123 \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_123" \
  -H "x-user-id: user_456" \
  -d '{
    "status": "ACCEPTED",
    "billRate": 150,
    "payRate": 100,
    "startDate": "2026-04-01"
  }'
```

**Triggered workflows:**
1. `submission-status-notify` (send notifications)
2. `placement-onboarding` (create placement)

## Scheduled Workflows

These run on a cron schedule, not webhooks:

- `follow-up-reminder` — Daily at 9am
- `weekly-timesheet-reminder` — Friday at 9am
- `signature-reminder` — Daily at 10am
- `document-expiry-alert` — Daily at 7am

## Troubleshooting

### Webhook Not Triggering

1. Check n8n service is running
2. Verify webhook path matches workflow definition
3. Check `N8N_BASE_URL` is correct
4. Review n8n logs: `docker logs n8n` (if containerized)

### Agent Events Not Dispatching

1. Check `AGENT_API_URL` and `N8N_BASE_URL` in platform `.env`
2. Review browser network tab for dispatch requests
3. Check agent hooks file imports are correct
4. Verify `x-org-id` and `x-user-id` headers in requests

### Slack Messages Not Posting

1. Verify Slack credentials in n8n
2. Check channel name (should start with #)
3. Verify bot has permission to post in channel
4. Review Slack API limits (may be rate-limited)

### Email Not Sending

1. Verify email provider credentials
2. Check email addresses are valid
3. Review email provider's bounce rate / deliverability
4. Check SMTP settings (if using SMTP)

## Next Steps

1. Deploy n8n to production environment
2. Configure database persistence for n8n
3. Set up monitoring/alerting on workflows
4. Create dashboard to view workflow execution metrics
5. Implement retry logic for failed workflows
6. Add workflow versioning and change tracking
