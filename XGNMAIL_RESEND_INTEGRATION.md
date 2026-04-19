# XGNMail Resend Email Integration

This document describes the complete Resend email service integration for XGNMail, the unified email management platform for InherentTech.

## Overview

**XGNMail** provides:
- Single email sending via Resend
- Bulk email campaigns with template rendering
- Webhook handling for delivery/bounce/open/click events
- Email tracking and analytics
- Pre-built email templates for recruiting workflows

**Provider**: Resend (transactional & bulk email SaaS)
**API Key**: `RESEND_API_KEY` environment variable (already in .env)

## Architecture

### Package Structure

```
packages/db/
├── src/
│   ├── resend.ts           # Client initialization (new)
│   ├── integrations/
│   │   └── email.ts        # Email logic: sendEmail(), sendBulkEmails(), templates
│   └── index.ts            # Exports getResend, etc.

apps/web/
├── src/app/api/email/
│   ├── send/route.ts       # POST /api/email/send (single email)
│   ├── campaign/send/route.ts  # POST /api/email/campaign/send (bulk)
│   ├── webhook/route.ts    # POST /api/email/webhook (Resend events)
│   ├── templates/route.ts  # GET /api/email/templates
│   └── stats/route.ts      # GET /api/email/stats
```

## Files Created

### 1. `packages/db/src/resend.ts`
Resend client initialization with singleton pattern.

**Exports:**
- `getResend()` — Get or initialize Resend client
- `resetResend()` — Clear singleton (testing)
- `hasResendKey()` — Check if API key is configured

**Usage:**
```typescript
import { getResend } from '@inherenttech/db';
const resend = getResend();
const result = await resend.emails.send({ ... });
```

### 2. `apps/web/src/app/api/email/send/route.ts`
Send a single email via Resend.

**Endpoint:** `POST /api/email/send`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to XGNMail",
  "html": "<p>Hello!</p>",
  "from": "noreply@xgnmail.com",
  "template": "CANDIDATE_OUTREACH",
  "variables": {
    "candidateName": "John Doe",
    "jobTitle": "Senior Engineer"
  },
  "cc": ["manager@company.com"],
  "bcc": ["archive@company.com"],
  "replyTo": "reply@company.com",
  "tags": [
    { "name": "campaign", "value": "jan2024" }
  ]
}
```

**Response:**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "provider": "resend",
  "status": "sent"
}
```

**Features:**
- Template rendering with variable substitution
- Automatic logging to `EmailLog` table
- CC/BCC/Reply-To support
- Custom headers and tags for tracking
- File attachments (base64 encoded)

### 3. `apps/web/src/app/api/email/campaign/send/route.ts`
Send bulk emails for campaigns (batch mode).

**Endpoint:** `POST /api/email/campaign/send`

**Request Body:**
```json
{
  "campaignId": "camp_123",
  "template": "CANDIDATE_OUTREACH",
  "from": "noreply@xgnmail.com",
  "replyTo": "team@company.com",
  "recipients": [
    {
      "email": "alice@example.com",
      "name": "Alice",
      "variables": {
        "candidateName": "Alice Smith",
        "jobTitle": "Frontend Engineer"
      }
    },
    {
      "email": "bob@example.com",
      "name": "Bob",
      "variables": {
        "candidateName": "Bob Jones",
        "jobTitle": "Backend Engineer"
      }
    }
  ],
  "tags": [
    { "name": "campaign", "value": "march2024" }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "email": "alice@example.com",
      "messageId": "msg_123",
      "status": "sent"
    },
    {
      "email": "bob@example.com",
      "messageId": "msg_124",
      "status": "sent"
    }
  ],
  "totalSent": 2,
  "totalFailed": 0
}
```

**Features:**
- Per-recipient template variable substitution
- Campaign tracking via `campaignId`
- Automatic `OutreachCampaign.sentCount` increment
- Database logging to `EmailLog`
- Partial success handling (207 Multi-Status if some fail)

### 4. `apps/web/src/app/api/email/webhook/route.ts`
Handle Resend webhook events.

**Endpoint:** `POST /api/email/webhook`

**Resend Webhook Events:**
- `email.sent` → Status: sent
- `email.delivered` → Status: delivered
- `email.bounced` → Status: bounced
- `email.complained` → Status: complained
- `email.delivery_delayed` → Status: delayed
- `email.opened` → Updates `OutreachMessage.openedAt`
- `email.clicked` → Logged (extensible)

**Setup:**
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Click **Webhooks** in the sidebar
3. Add endpoint: `https://your-domain.com/api/email/webhook`
4. Select events: email.sent, email.delivered, email.bounced, email.complained, email.opened, email.clicked
5. Copy webhook signing secret (optional for verification)
6. Add to .env: `RESEND_WEBHOOK_SECRET="whsec_..."`

**Event Flow:**
```
Resend API
    ↓
Sends Webhook → /api/email/webhook
    ↓
Updates EmailLog.status (delivery status)
    ↓
Updates OutreachMessage.openedAt (campaign engagement)
```

### 5. `apps/web/src/app/api/email/templates/route.ts`
Retrieve available email templates.

**Endpoints:**

**GET /api/email/templates**
List all available templates.

**Response:**
```json
{
  "templates": [
    {
      "id": "tpl_candidate_outreach",
      "name": "Candidate Outreach",
      "subject": "Exciting Opportunity: {{jobTitle}} at {{clientName}}",
      "variables": ["candidateName", "jobTitle", "clientName", "location", "duration", "rateRange", "recruiterName", "recruiterTitle"]
    },
    {
      "id": "tpl_client_submission",
      "name": "Client Submission",
      "subject": "Candidate Submission: {{candidateName}} for {{jobTitle}}",
      "variables": ["clientContactName", "jobTitle", "jobId", "candidateName", "experience", "skills", "visaStatus", "availability", "billRate", "recruiterName"]
    }
  ],
  "total": 6
}
```

**GET /api/email/templates?id=tpl_candidate_outreach**
Get specific template with HTML.

**Response:**
```json
{
  "template": {
    "id": "tpl_candidate_outreach",
    "name": "Candidate Outreach",
    "subject": "Exciting Opportunity: {{jobTitle}} at {{clientName}}",
    "html": "<div>...</div>",
    "variables": [...]
  }
}
```

### 6. `apps/web/src/app/api/email/stats/route.ts`
Email campaign and delivery statistics.

**Endpoint:** `GET /api/email/stats`

**Query Params:**
- `days` (optional, default: 30) — Time period in days
- `campaignId` (optional) — Filter to specific campaign

**Response:**
```json
{
  "period": {
    "days": 30,
    "from": "2024-02-25T...",
    "to": "2024-03-27T..."
  },
  "totals": {
    "sent": 500,
    "delivered": 480,
    "bounced": 15,
    "opened": 320,
    "replied": 45
  },
  "rates": {
    "deliveryRate": 96.0,
    "bounceRate": 3.0,
    "openRate": 64.0,
    "replyRate": 9.0
  },
  "byStatus": {
    "sent": 500,
    "delivered": 480,
    "bounced": 15,
    "complained": 2,
    "delayed": 3,
    "failed": 0
  },
  "campaign": {
    "id": "camp_123",
    "name": "Q1 Outreach",
    "status": "SENT",
    "sentCount": 500,
    "openCount": 320,
    "replyCount": 45
  }
}
```

## Available Email Templates

Pre-built templates in `packages/db/src/integrations/email.ts`:

1. **CANDIDATE_OUTREACH** - Initial recruitment outreach
   - Variables: candidateName, jobTitle, clientName, location, duration, rateRange, recruiterName, recruiterTitle

2. **CLIENT_SUBMISSION** - Submit candidate to client
   - Variables: clientContactName, jobTitle, jobId, candidateName, experience, skills, visaStatus, availability, billRate, recruiterName

3. **INTERVIEW_CONFIRMATION** - Interview scheduling
   - Variables: candidateName, jobTitle, interviewDate, interviewTime, interviewType, interviewerName, meetingLink, recruiterName

4. **PLACEMENT_WELCOME** - New placement notification
   - Variables: candidateName, clientName, startDate, jobTitle, location, payRate, recruiterName

5. **TIMESHEET_REMINDER** - Recurring timesheet reminders
   - Variables: candidateName, weekEnding, portalUrl

6. **INVOICE_NOTIFICATION** - Invoice delivery
   - Variables: clientContactName, invoiceNumber, amount, dueDate, periodStart, periodEnd, paymentLink, companyName

## Usage Examples

### Example 1: Send Single Email with Template

```bash
curl -X POST http://localhost:3004/api/email/send \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_123" \
  -d '{
    "to": "alice@example.com",
    "template": "CANDIDATE_OUTREACH",
    "variables": {
      "candidateName": "Alice Smith",
      "jobTitle": "Senior React Engineer",
      "clientName": "Acme Corp",
      "location": "San Francisco, CA",
      "duration": "3-6 months",
      "rateRange": "$85-95/hr",
      "recruiterName": "John Smith",
      "recruiterTitle": "Recruiting Manager"
    }
  }'
```

### Example 2: Send Campaign (Bulk)

```bash
curl -X POST http://localhost:3004/api/email/campaign/send \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_123" \
  -d '{
    "campaignId": "camp_march2024",
    "template": "CANDIDATE_OUTREACH",
    "recipients": [
      {
        "email": "alice@example.com",
        "variables": {
          "candidateName": "Alice Smith",
          "jobTitle": "Frontend Engineer"
        }
      },
      {
        "email": "bob@example.com",
        "variables": {
          "candidateName": "Bob Jones",
          "jobTitle": "Backend Engineer"
        }
      }
    ]
  }'
```

### Example 3: Get Email Stats

```bash
curl -X GET "http://localhost:3004/api/email/stats?days=30&campaignId=camp_march2024" \
  -H "x-org-id: org_123"
```

## Database Integration

### EmailLog Table
Stores all email send/delivery events.

```sql
CREATE TABLE "EmailLog" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "toEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL,  -- queued, sent, delivered, bounced, failed, complained, delayed
  "messageId" TEXT,
  "resendId" TEXT,         -- Resend's message ID for webhook correlation
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "EmailLog_orgId_idx" ON "EmailLog"("orgId");
CREATE INDEX "EmailLog_toEmail_idx" ON "EmailLog"("toEmail");
```

### OutreachMessage Table
Campaign engagement tracking.

```sql
CREATE TABLE "OutreachMessage" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "candidateId" TEXT,
  "leadId" TEXT,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL,  -- QUEUED, SENT, OPENED, REPLIED, FAILED
  "sentAt" TIMESTAMP,
  "openedAt" TIMESTAMP,    -- Updated by webhook when email.opened event received
  "repliedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### OutreachCampaign Table
Campaign summary statistics.

```sql
CREATE TABLE "OutreachCampaign" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" TEXT NOT NULL,  -- "EMAIL", "SMS", etc.
  "status" TEXT NOT NULL,   -- DRAFT, SENT, COMPLETED
  "templateSubject" TEXT,
  "templateBody" TEXT,
  "targetCriteria" JSON,
  "sentCount" INT DEFAULT 0,      -- Updated by campaign send route
  "openCount" INT DEFAULT 0,      -- Updated by webhook on email.opened
  "replyCount" INT DEFAULT 0,     -- Updated by webhook on email.clicked or reply
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP
);
```

## Error Handling

### Common Errors

**400 Bad Request**
- Missing required fields (to, subject/template)
- Invalid template ID
- Empty recipients array
- Invalid email format

**404 Not Found**
- Template ID doesn't exist
- Campaign ID doesn't exist

**500 Internal Server Error**
- RESEND_API_KEY not set
- Database connection failure
- Resend API service error

**207 Multi-Status**
- Returned by `/api/email/campaign/send` when some emails succeed and others fail

### Retry Logic

Resend automatically retries failed sends with exponential backoff:
- Soft bounces: Up to 5 days
- Hard bounces: No retry (invalid email)
- Rate limits: Built-in handling

For webhook processing, implement idempotency by checking if `resendId` already exists in `EmailLog`.

## Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY="re_2hEW6bGa_46o7woZyGe9y7SK9qMAGTDLm"

# Optional (for webhook signature verification)
RESEND_WEBHOOK_SECRET="whsec_..."
```

### Sender Addresses

Valid sender addresses require domain verification in Resend:

1. **Default**: `noreply@xgnmail.com`
2. **Custom**: Add to Resend dashboard and use in `from` field

```typescript
// Send from custom address
await fetch('/api/email/send', {
  method: 'POST',
  body: JSON.stringify({
    to: 'user@example.com',
    from: 'hello@yourdomain.com',  // Must be verified in Resend
    subject: 'Hello',
    html: '<p>Hi there</p>'
  })
});
```

## Webhook Setup Checklist

- [ ] Configure webhook endpoint in Resend dashboard
- [ ] Select events: email.sent, email.delivered, email.bounced, email.complained, email.opened, email.clicked
- [ ] Copy webhook signing secret (optional)
- [ ] Add `RESEND_WEBHOOK_SECRET` to .env if verifying signatures
- [ ] Test webhook with test event from Resend dashboard
- [ ] Confirm `/api/email/webhook` returns `{ success: true }`

## Performance & Limits

**Resend API Limits:**
- Rate: 100 requests/second
- Batch size: Up to 100 emails per bulk send request
- Attachment size: Max 25 MB per email
- Recipients per email: Unlimited

**XGNMail Campaign Batching:**
- Automatically splits large campaigns into 100-email batches
- Recommended: 500-1000 emails per campaign for stability

**Database Indexes:**
- `EmailLog.orgId` - Fast org-level queries
- `EmailLog.toEmail` - Recipient lookup
- `OutreachCampaign.createdById` - User campaign history
- `OutreachMessage.campaignId` - Campaign engagement

## Testing

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test single email endpoint
curl -X POST http://localhost:3004/api/email/send \
  -H "Content-Type: application/json" \
  -H "x-org-id: test_org" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from XGNMail!</p>"
  }'
```

### Test Sender Address

During development, add a test email to Resend:
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Add recipient email to **Audience**
3. Send test emails to the verified address

### Webhook Testing

Use [RequestBin](https://requestbin.com/) or [Webhook.cool](https://webhook.cool/) to inspect incoming webhooks:

1. Create temporary webhook URL
2. Update Resend dashboard with temp URL
3. Send test email
4. Inspect webhook payload structure

## Future Enhancements

1. **Click Tracking**: Extend `OutreachMessage` with `clickedAt` timestamp
2. **Unsubscribe Management**: Add unsubscribe link handling
3. **Template Builder UI**: Visual email editor in web app
4. **A/B Testing**: Compare subject lines and content variants
5. **Advanced Scheduling**: Send emails at optimal times per recipient
6. **Email Authentication**: DKIM/SPF setup verification
7. **Spam Scoring**: Pre-send spam filter checks
8. **Custom Domain**: Support branded xgnmail.com subdomains

## References

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Template Best Practices](https://resend.com/docs/best-practices)
- [Webhook Security](https://resend.com/docs/webhooks)

## Support

For issues:
1. Check Resend dashboard status
2. Verify API key in .env
3. Check console logs in `/api/email/*` routes
4. Review database logs in `EmailLog` table
5. Contact Resend support (resend.com/support)
