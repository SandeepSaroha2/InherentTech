# n8n Workflow Quick Reference

## Using Agent Hooks in Your Code

### Import Agent Hooks

```typescript
// In CRM routes
import { agentEvents } from '../../../lib/agent-hooks';

// In ATS routes
import { agentEvents } from '../../../../lib/agent-hooks';
```

### Dispatch Events from API Routes

```typescript
// When creating a lead
const lead = await prisma.lead.create({...});
agentEvents.leadCreated(lead, orgId, userId);

// When lead moves to a new stage
agentEvents.leadStageChanged(leadId, oldStage, newStage, leadData, orgId, userId);

// When candidate is created
const candidate = await prisma.candidate.create({...});
agentEvents.candidateCreated(candidate, orgId, userId);

// When resume is parsed
agentEvents.resumeParsed(candidateId, parsedData, orgId, userId);

// When job is created
const job = await prisma.jobOrder.create({...});
agentEvents.jobOrderCreated(job, orgId, userId);

// When submission status changes
agentEvents.submissionStatusChanged(submissionId, newStatus, oldStatus, data, orgId, userId);

// When placement is created
agentEvents.placementCreated(placementData, orgId, userId);
```

## Workflow Execution Flow

```
API Route POST/PATCH
    ↓
Create/Update DB Record
    ↓
Log Audit Entry
    ↓
Dispatch Agent Event
    ├─→ POST to /api/agents (orchestrator)
    └─→ POST to /webhook/{path} (n8n)
    ↓
Return Success Response
```

## Event Types Reference

### CRM Events

```typescript
'lead.created'         // New lead added
'lead.stage_changed'   // Lead moved to new stage
'lead.nurture_started' // Nurture sequence initiated
'lead.scored'          // Lead scored by system
'lead.converted'       // Lead converted to job order
'lead.lost'            // Lead marked as lost
'lead.activity_logged' // Activity added to lead
'lead.assigned'        // Lead assigned to user
```

### ATS Events

```typescript
'candidate.created'               // New candidate added
'candidate.resume_parsed'         // Resume parsed
'job_order.created'               // New job order
'submission.status_changed'       // Submission status updated
'interview.scheduled'             // Interview scheduled
'placement.created'               // Placement created
'placement.ending_soon'           // Placement ending in X days
'timesheet.submitted'             // Timesheet submitted
'timesheet.approved'              // Timesheet approved
'invoice.created'                 // Invoice created
'invoice.overdue'                 // Invoice overdue
'document.signature_requested'    // Document awaiting signature
'document.expiring'               // Document expiring soon
```

## Webhook URLs

All webhooks are POST endpoints at:
```
{N8N_BASE_URL}/webhook/{path}
```

### Mapping Event → Webhook

| Event | Webhook Path |
|-------|--------------|
| lead.created | new-lead-slack-alert |
| lead.stage_changed | lead-scoring |
| candidate.created | candidate-job-matcher |
| candidate.resume_parsed | resume-parser |
| job_order.created | candidate-job-matcher |
| submission.status_changed | submission-status-notify |
| interview.scheduled | interview-scheduler |
| placement.created | placement-onboarding |
| timesheet.submitted | weekly-timesheet-reminder |
| timesheet.approved | invoice-generator |
| invoice.overdue | follow-up-reminder |
| document.signature_requested | signature-reminder |
| document.expiring | document-expiry-alert |

## Key Implementation Details

### Non-Blocking Dispatch

Agent events are dispatched with `.catch(() => {})` to ensure they never block the main request:

```typescript
// This NEVER blocks main operation
await fetch(AGENT_API_URL, {...}).catch(() => {});
```

### Required Headers

When calling API routes that trigger workflows, include:

```typescript
// x-org-id: Organization ID
// x-user-id: User performing action
headers: {
  'x-org-id': 'org_123',
  'x-user-id': 'user_456',
}
```

### Resume Parsing

When calling the resume parser, include candidate ID:

```typescript
headers: {
  'x-org-id': orgId,
  'x-user-id': userId,
  'x-candidate-id': candidateId,  // ← Important for event dispatch
}
```

## Environment Variables

```bash
# .env.local in platform root
N8N_BASE_URL=http://localhost:5678
AGENT_API_URL=http://localhost:3000/api/agents
PLATFORM_URL=http://localhost:3000
```

## Testing Workflows Locally

### Start n8n

```bash
npm install -g n8n
n8n start
# Runs at http://localhost:5678
```

### Import Workflow JSON

1. In n8n: Click "+" → "New Workflow"
2. Click "..." → "Import from URL"
3. Paste workflow definition from `packages/db/src/workflows/index.ts`

### Test Webhook

```bash
curl -X POST http://localhost:5678/webhook/lead-scoring \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lead.created",
    "data": {
      "leadId": "lead_123",
      "companyName": "Test Corp",
      "contactName": "John",
      "contactEmail": "john@test.com"
    },
    "orgId": "org_123",
    "userId": "user_456"
  }'
```

## Common Patterns

### Pattern 1: Create Record + Trigger Event

```typescript
// Create in DB
const record = await prisma.entity.create({data: {...}});

// Trigger event
agentEvents.eventName(record, orgId, userId);

// Return success
return NextResponse.json(record, {status: 201});
```

### Pattern 2: Update Record + Check for Change

```typescript
// Get current state
const current = await prisma.entity.findUnique({where: {id}});

// Update in DB
const updated = await prisma.entity.update({where: {id}, data: {...}});

// Check if field changed
if (updated.field !== current.field) {
  agentEvents.eventName(current.field, updated.field, orgId, userId);
}

// Return success
return NextResponse.json(updated);
```

### Pattern 3: Conditional Event Dispatch

```typescript
// Auto-create placement when submission ACCEPTED
if (body.status === 'ACCEPTED') {
  // Create placement
  const placement = await prisma.placement.create({...});

  // Trigger placement event
  agentEvents.placementCreated(placement, orgId, userId);
}

// Always trigger status change
agentEvents.submissionStatusChanged(id, body.status, oldStatus, data, orgId, userId);
```

## Debugging

### Check Event Dispatch

Look for these in browser DevTools Network tab:
```
POST /api/agents              (agent orchestrator)
POST /webhook/{workflow-path} (n8n webhook)
```

### View n8n Logs

```bash
# If running via npm
npm logs n8n

# If running in Docker
docker logs n8n
```

### Test Agent Event Manually

```typescript
// In browser console
const event = {
  type: 'lead.created',
  data: {leadId: 'test_123', companyName: 'Test'},
  orgId: 'org_123',
  userId: 'user_456',
  timestamp: new Date().toISOString()
};

fetch('/api/agents', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(event)
});
```

## Workflow Execution Examples

### Scenario 1: New Lead Created

```
POST /api/leads {companyName: "Acme"}
  ↓
Create Lead record
  ↓
agentEvents.leadCreated()
  ↓
n8n receives at /webhook/new-lead-slack-alert
  ↓
Posts to #sales: "🆕 New Lead: Acme Corp..."
```

### Scenario 2: Candidate Resume Parsed

```
POST /api/candidates/parse-resume {file: resume.pdf}
  ↓
Parse with Claude API
  ↓
agentEvents.resumeParsed()
  ↓
n8n receives at /webhook/resume-parser
  ↓
Updates candidate skills/experience
  ↓
Notifies #recruiting
```

### Scenario 3: Submission Accepted → Placement Created

```
PATCH /api/submissions/123 {status: "ACCEPTED"}
  ↓
Update submission in DB
  ↓
agentEvents.submissionStatusChanged()
  ↓
n8n: /webhook/submission-status-notify
    ├─ Email candidate
    └─ Slack #recruiting
  ↓
Auto-create placement
  ↓
agentEvents.placementCreated()
  ↓
n8n: /webhook/placement-onboarding
    ├─ Generate offer letter
    ├─ Create DocuSign envelope
    ├─ Send onboarding kit
    ├─ Schedule orientation
    └─ Slack #operations
```

## Performance Considerations

- Agent events are **non-blocking** (fire-and-forget)
- Main API request completes immediately
- n8n webhooks may have slight delay (milliseconds)
- No timeout for webhook dispatch
- If n8n is down, events are lost (consider adding queue)

## Next Steps

1. Set up n8n in development environment
2. Import all 16 workflow definitions
3. Configure Slack credentials
4. Configure email provider credentials
5. Test each workflow manually
6. Deploy to staging
7. Run end-to-end tests
8. Deploy to production
