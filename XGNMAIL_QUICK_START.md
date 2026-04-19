# XGNMail Resend Integration — Quick Start

## Installation

```bash
npm install
npm run db:generate
npm run db:push
```

The `resend` package is already added to `packages/db/package.json`.

## API Endpoints

### Send Single Email
```bash
POST /api/email/send
```
- **Purpose**: Send one email to a recipient
- **Use case**: Transactional emails, notifications, follow-ups
- **Response**: `{ id, provider: 'resend', status: 'sent' }`

### Send Campaign (Bulk)
```bash
POST /api/email/campaign/send
```
- **Purpose**: Send templated emails to many recipients with personalized variables
- **Use case**: Candidate outreach, recruitment campaigns
- **Response**: `{ results: [...], totalSent, totalFailed }`

### Receive Webhooks
```bash
POST /api/email/webhook
```
- **Events**: sent, delivered, bounced, complained, opened, clicked
- **Auto-updates**: EmailLog.status, OutreachMessage.openedAt

### Get Templates
```bash
GET /api/email/templates
GET /api/email/templates?id=TEMPLATE_ID
```
- **Purpose**: List or retrieve specific email template
- **Returns**: Template metadata and variables

### Get Statistics
```bash
GET /api/email/stats?days=30&campaignId=CAMPAIGN_ID
```
- **Purpose**: Email delivery & engagement metrics
- **Returns**: sent, delivered, bounced, opened, replied, rates

## Code Examples

### Single Email
```typescript
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-org-id': 'org_123'
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<p>Hello</p>',
    from: 'noreply@xgnmail.com'
  })
});
```

### Campaign with Template
```typescript
const response = await fetch('/api/email/campaign/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-org-id': 'org_123'
  },
  body: JSON.stringify({
    campaignId: 'camp_123',
    template: 'CANDIDATE_OUTREACH',
    recipients: [
      {
        email: 'alice@example.com',
        variables: {
          candidateName: 'Alice',
          jobTitle: 'Engineer',
          recruiterName: 'John'
        }
      },
      {
        email: 'bob@example.com',
        variables: {
          candidateName: 'Bob',
          jobTitle: 'Designer',
          recruiterName: 'John'
        }
      }
    ]
  })
});
```

### Using Template
```typescript
// Send with template rendering
await fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-org-id': 'org_123'
  },
  body: JSON.stringify({
    to: 'alice@example.com',
    template: 'CANDIDATE_OUTREACH',
    variables: {
      candidateName: 'Alice Smith',
      jobTitle: 'Senior Engineer',
      clientName: 'Acme Corp',
      location: 'San Francisco',
      duration: '3-6 months',
      rateRange: '$85-95/hr',
      recruiterName: 'John Smith',
      recruiterTitle: 'Manager'
    }
  })
});
```

## Template Variables

### CANDIDATE_OUTREACH
- candidateName
- jobTitle
- clientName
- clientLocation
- location
- duration
- rateRange
- recruiterName
- recruiterTitle

### CLIENT_SUBMISSION
- clientContactName
- jobTitle
- jobId
- candidateName
- experience
- skills
- visaStatus
- availability
- billRate
- recruiterName

### INTERVIEW_CONFIRMATION
- candidateName
- jobTitle
- interviewDate
- interviewTime
- interviewType
- interviewerName
- meetingLink
- recruiterName

### PLACEMENT_WELCOME
- candidateName
- clientName
- startDate
- jobTitle
- location
- payRate
- recruiterName

### TIMESHEET_REMINDER
- candidateName
- weekEnding
- portalUrl

### INVOICE_NOTIFICATION
- clientContactName
- invoiceNumber
- amount
- dueDate
- periodStart
- periodEnd
- paymentLink
- companyName

## Files Created

```
packages/db/
├── src/resend.ts           ← Client initialization

apps/web/src/app/api/email/
├── send/route.ts           ← Single email endpoint
├── campaign/send/route.ts  ← Bulk campaign endpoint
├── webhook/route.ts        ← Webhook handler
├── templates/route.ts      ← Template listing
└── stats/route.ts          ← Analytics endpoint
```

## Environment

Already in `.env`:
```bash
RESEND_API_KEY="re_2hEW6bGa_46o7woZyGe9y7SK9qMAGTDLm"
```

Optional (for webhook verification):
```bash
RESEND_WEBHOOK_SECRET="whsec_..."
```

## Database Tables

- **EmailLog**: Every email sent via Resend
  - Status: sent, delivered, bounced, failed, complained, delayed
  - Updated by webhooks

- **OutreachMessage**: Campaign tracking
  - sentAt, openedAt, repliedAt
  - Updated by webhooks

- **OutreachCampaign**: Campaign summary
  - sentCount, openCount, replyCount
  - Updated when campaign sent

## Webhook Setup

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Click **Webhooks**
3. Add: `https://your-domain.com/api/email/webhook`
4. Select events: sent, delivered, bounced, complained, opened, clicked
5. Copy secret (optional)
6. Test with **Send test event**

## Testing

```bash
# Start dev server
npm run dev

# Send test email
curl -X POST http://localhost:3004/api/email/send \
  -H "Content-Type: application/json" \
  -H "x-org-id: test_org" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test",
    "html": "<p>Hello!</p>"
  }'

# Get templates
curl -X GET http://localhost:3004/api/email/templates

# Get stats
curl -X GET "http://localhost:3004/api/email/stats" \
  -H "x-org-id: test_org"
```

## Common Issues

**401 Unauthorized**
- Check RESEND_API_KEY in .env

**400 Bad Request**
- Verify required fields (to, subject/template)
- Check template variable names

**404 Not Found**
- Template ID incorrect
- Campaign ID not found

**Email not sent**
- Verify sender domain is verified in Resend
- Check browser console for errors
- Review database EmailLog table

## Support

See `XGNMAIL_RESEND_INTEGRATION.md` for detailed documentation.
