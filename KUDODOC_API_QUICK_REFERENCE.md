# KudoDoc API Quick Reference

## Core Concepts

**Templates** → Reusable documents with `{{placeholder}}` fields
**Documents** → Instances created from templates or from scratch
**Signatures** → Multi-party signature requests with ordering
**Audit Trail** → Complete history of all document actions

---

## API Endpoints

### Templates

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/templates` | GET | List templates (filter, search, paginate) |
| `/api/templates` | POST | Create template |
| `/api/templates/:id` | GET | Get single template |
| `/api/templates/:id` | PATCH | Update template |
| `/api/templates/:id` | DELETE | Soft delete template |

### Documents

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/documents` | GET | List documents (filter by status, search) |
| `/api/documents` | POST | Create document (from template or scratch) |
| `/api/documents/:id` | GET | Get document with all details |
| `/api/documents/:id` | PATCH | Update document/status |
| `/api/documents/:id` | DELETE | Delete DRAFT only |

### Signatures

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/signatures` | GET | List signature requests |
| `/api/signatures` | POST | Create signature request(s) |
| `/api/signatures/:id` | GET | Get single signature request |
| `/api/signatures/:id` | PATCH | Sign/decline/view signature |
| `/api/signatures/verify` | POST | Verify signatures & audit trail |

### Dashboard

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard` | GET | Get KPIs and metrics |

---

## Common Workflows

### Create Document from Template

```typescript
import { documentsApi } from '@/lib/api';

const doc = await documentsApi.create({
  title: 'Service Agreement - ACME Corp',
  templateId: 'template-uuid',
  fieldValues: {
    companyName: 'ACME Corp',
    contactName: 'John Smith',
    startDate: '2026-04-01'
  },
  expiresAt: '2026-12-31',
  createdByName: 'Sarah Manager'
});
```

### Request Signatures

```typescript
import { signaturesApi } from '@/lib/api';

await signaturesApi.requestSignatures({
  documentId: doc.id,
  signers: [
    { email: 'alice@acme.com', name: 'Alice', order: 1 },
    { email: 'bob@acme.com', name: 'Bob', order: 2 }
  ],
  requestedByName: 'Sarah Manager'
});
```

### Sign Document

```typescript
await signaturesApi.sign('signature-request-id', {
  status: 'SIGNED',
  signatureImageUrl: 'data:image/png;base64,...',
  signerEmail: 'alice@acme.com'
});
```

### Verify Signatures

```typescript
const verification = await signaturesApi.verify('document-id');

console.log(verification.integrityCheck);
// {
//   documentStatus: 'SIGNED',
//   totalSignersRequired: 2,
//   signersCompleted: 2,
//   signatureChainValid: true,
//   ...
// }
```

### Get Dashboard

```typescript
const dashboard = await dashboardApi.get();

console.log(dashboard.kpis);
// {
//   totalDocuments: 150,
//   pendingSignatures: 23,
//   completedToday: 5,
//   signatureCompletionRate: 87
// }
```

---

## Query Parameters

### List Templates
```
GET /api/templates?category=contracts&active=true&search=service&page=1&limit=20
```

### List Documents
```
GET /api/documents?status=PENDING_SIGNATURE&templateId=uuid&search=acme&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### List Signatures
```
GET /api/signatures?status=PENDING&documentId=uuid&page=1&limit=20
```

---

## Request/Response Examples

### Create Template

**Request:**
```json
POST /api/templates
{
  "name": "Service Agreement",
  "description": "Standard SLA",
  "content": "<h1>{{companyName}} Service Agreement</h1><p>Service Type: {{serviceType}}</p>",
  "category": "agreements",
  "fields": [
    { "name": "companyName", "type": "text", "required": true },
    { "name": "serviceType", "type": "select", "options": ["consulting", "support"] }
  ]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "orgId": "org-id",
  "name": "Service Agreement",
  "description": "Standard SLA",
  "content": "...",
  "category": "agreements",
  "isActive": true,
  "createdAt": "2026-03-27T08:19:00Z",
  "createdBy": { "id": "user-id", "name": "Admin", "email": "admin@..." },
  "_count": { "documents": 0 }
}
```

### Create Document

**Request:**
```json
POST /api/documents
{
  "title": "Service Agreement - ACME",
  "templateId": "template-uuid",
  "fieldValues": {
    "companyName": "ACME Corp",
    "serviceType": "consulting"
  },
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "id": "doc-uuid",
  "orgId": "org-id",
  "title": "Service Agreement - ACME",
  "status": "DRAFT",
  "content": "<h1>ACME Corp Service Agreement</h1><p>Service Type: consulting</p>",
  "createdAt": "2026-03-27T08:19:00Z",
  "template": { "id": "...", "name": "Service Agreement" },
  "createdBy": { "id": "...", "name": "...", "email": "..." },
  "_count": { "signatureRequests": 0, "documentAuditTrail": 1 }
}
```

### Request Signatures

**Request:**
```json
POST /api/signatures
{
  "documentId": "doc-uuid",
  "signers": [
    { "email": "alice@acme.com", "name": "Alice Manager", "order": 1 },
    { "email": "bob@acme.com", "name": "Bob Director", "order": 2 }
  ]
}
```

**Response (201):**
```json
{
  "signatureRequests": [
    {
      "id": "sig-uuid-1",
      "status": "PENDING",
      "signerEmail": "alice@acme.com",
      "signerName": "Alice Manager",
      "order": 1,
      "createdAt": "2026-03-27T08:19:00Z"
    },
    {
      "id": "sig-uuid-2",
      "status": "PENDING",
      "signerEmail": "bob@acme.com",
      "signerName": "Bob Director",
      "order": 2,
      "createdAt": "2026-03-27T08:19:00Z"
    }
  ],
  "document": {
    "id": "doc-uuid",
    "status": "PENDING_SIGNATURE"
  }
}
```

### Sign Document

**Request:**
```json
PATCH /api/signatures/sig-uuid-1
{
  "status": "SIGNED",
  "signatureImageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "signerEmail": "alice@acme.com"
}
```

**Response (200):**
```json
{
  "id": "sig-uuid-1",
  "status": "SIGNED",
  "signerEmail": "alice@acme.com",
  "signerName": "Alice Manager",
  "signedAt": "2026-03-27T09:15:30Z",
  "ipAddress": "192.168.1.100",
  "signatureImageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "order": 1,
  "document": { "id": "doc-uuid", "title": "Service Agreement - ACME", "status": "PARTIALLY_SIGNED" }
}
```

### Verify Signatures

**Request:**
```json
POST /api/signatures/verify
{
  "documentId": "doc-uuid"
}
```

**Response (200):**
```json
{
  "document": { ... },
  "signatureRequests": [ ... ],
  "auditTrail": [
    {
      "id": "...",
      "action": "CREATED",
      "actorEmail": "admin@...",
      "createdAt": "2026-03-27T08:19:00Z"
    },
    {
      "id": "...",
      "action": "SIGNATURE_REQUESTED",
      "actorEmail": "admin@...",
      "metadata": { "signerCount": 2, "signerNames": "Alice Manager, Bob Director" },
      "createdAt": "2026-03-27T08:20:00Z"
    },
    {
      "id": "...",
      "action": "SIGNED",
      "actorEmail": "alice@acme.com",
      "actorName": "Alice Manager",
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-03-27T09:15:30Z"
    }
  ],
  "integrityCheck": {
    "documentId": "doc-uuid",
    "documentTitle": "Service Agreement - ACME",
    "documentStatus": "PARTIALLY_SIGNED",
    "totalSignersRequired": 2,
    "signersCompleted": 1,
    "signersPending": 1,
    "signatureChainValid": true,
    "firstSignedAt": "2026-03-27T09:15:30Z"
  },
  "signatureChain": [
    {
      "order": 1,
      "signer": "Alice Manager",
      "email": "alice@acme.com",
      "signedAt": "2026-03-27T09:15:30Z",
      "ipAddress": "192.168.1.100",
      "sequenceValid": true
    }
  ],
  "verification": {
    "isComplete": false,
    "isPartiallyComplete": true,
    "chainValid": true,
    "allSignersIdentified": true,
    "hasDeclines": false
  }
}
```

---

## Document Status Flow

```
DRAFT
  ↓ (Request signatures)
PENDING_SIGNATURE
  ↓ (First signer signs)
PARTIALLY_SIGNED
  ↓ (Last signer signs)
SIGNED
```

Or:

```
DRAFT
  ↓ (Request signatures)
PENDING_SIGNATURE
  ↓ (Signer declines)
PENDING_SIGNATURE (remains, awaiting other signers)
```

---

## Headers

All requests should include:
```
x-org-id: org-uuid          (required, defaults to 'default')
x-user-id: user-uuid        (optional, defaults to 'system')
x-user-email: user@...      (optional, defaults to 'system@inherenttech.ai')
Content-Type: application/json
```

Browser cookies can provide these automatically via the api.ts helper.

---

## Error Responses

All errors include status code and message:

```json
400 Bad Request
{
  "error": "Name and content are required"
}

404 Not Found
{
  "error": "Document not found"
}

500 Server Error
{
  "error": "Database connection failed"
}
```

---

## Pagination

List endpoints return pagination info:

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Import in Frontend

```typescript
// In React components
import {
  templatesApi,
  documentsApi,
  signaturesApi,
  dashboardApi
} from '@/lib/api';

// Auto-includes headers from cookies
const templates = await templatesApi.list();
```

---

## Performance Notes

- All list endpoints are paginated (default 20 items)
- Dashboard aggregates across entire org in ~50ms
- Signature verification includes full audit trail
- Status changes trigger cascading updates
- IP addresses captured for audit trail
- Template interpolation handles missing fields gracefully

