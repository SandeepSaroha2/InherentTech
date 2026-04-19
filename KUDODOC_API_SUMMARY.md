# KudoDoc Backend API Suite

Comprehensive REST API implementation for the KudoDoc document management and e-signature platform.

## Overview

KudoDoc provides document template management, document creation from templates, and multi-party signature workflows with complete audit trails.

## API Routes Created

### 1. Templates API

#### `GET /api/templates`
List document templates with filtering, search, and pagination.

**Query Parameters:**
- `category` - Filter by category
- `active` - Filter by active status (true/false)
- `search` - Search in template name and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "orgId": "org-id",
      "name": "Contract Template",
      "description": "Standard contract",
      "content": "<html>...</html>",
      "fields": [{"name": "clientName", "type": "text"}],
      "category": "contracts",
      "isActive": true,
      "createdAt": "2026-03-27T...",
      "createdBy": { "id", "name", "email" },
      "_count": { "documents": 5 }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

#### `POST /api/templates`
Create a new document template.

**Request Body:**
```json
{
  "name": "Service Agreement",
  "description": "Service agreement template",
  "content": "<html>Template content with {{placeholders}}</html>",
  "fields": [
    { "name": "companyName", "type": "text", "required": true },
    { "name": "serviceType", "type": "select", "options": ["..."] }
  ],
  "category": "agreements"
}
```

**Response:** Created template object (201)

#### `GET /api/templates/:id`
Get a single template with document usage count.

#### `PATCH /api/templates/:id`
Update template (name, description, content, fields, category, isActive).

#### `DELETE /api/templates/:id`
Soft delete template by setting `isActive` to false.

---

### 2. Documents API

#### `GET /api/documents`
List documents with filtering, search, and pagination.

**Query Parameters:**
- `status` - DRAFT, PENDING_SIGNATURE, PARTIALLY_SIGNED, SIGNED, EXPIRED
- `templateId` - Filter by template
- `search` - Search in document title
- `page`, `limit`, `sortBy`, `sortOrder`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "orgId": "org-id",
      "title": "Client Agreement",
      "status": "PENDING_SIGNATURE",
      "createdAt": "2026-03-27T...",
      "template": { "id", "name" },
      "createdBy": { "id", "name", "email" },
      "_count": { "signatureRequests": 2, "documentAuditTrail": 5 }
    }
  ],
  "pagination": { ... }
}
```

#### `POST /api/documents`
Create a new document, optionally from a template.

**Request Body:**
```json
{
  "title": "Service Agreement 2026",
  "templateId": "template-uuid",
  "fieldValues": {
    "companyName": "ACME Corp",
    "serviceType": "consulting"
  },
  "expiresAt": "2026-12-31T23:59:59Z",
  "createdByName": "John Doe"
}
```

**Features:**
- Template interpolation: replaces `{{fieldName}}` with `fieldValues[fieldName]`
- Automatic audit trail entry for document creation
- Document status set to DRAFT

#### `GET /api/documents/:id`
Get full document with:
- Template details
- All signature requests (with signer info, ordered by sequence)
- Complete audit trail

#### `PATCH /api/documents/:id`
Update document (title, content, status, expiresAt).

**Features:**
- Logs status changes to audit trail
- Logs content/title updates
- Supports status transitions: DRAFT → PENDING_SIGNATURE → PARTIALLY_SIGNED → SIGNED

#### `DELETE /api/documents/:id`
Delete document - only allowed if status is DRAFT.

---

### 3. Signatures API

#### `GET /api/signatures`
List signature requests with filtering.

**Query Parameters:**
- `status` - PENDING, VIEWED, SIGNED, DECLINED, EXPIRED
- `documentId` - Filter by document
- `page`, `limit`, `sortBy`, `sortOrder`

#### `POST /api/signatures`
Create signature request(s) for a document.

**Request Body:**
```json
{
  "documentId": "doc-uuid",
  "signers": [
    { "email": "signer1@example.com", "name": "Alice", "userId": "user-id", "order": 1 },
    { "email": "signer2@example.com", "name": "Bob", "order": 2 }
  ],
  "requestedByName": "Manager"
}
```

**Features:**
- Multiple signers in sequence
- Updates document status to PENDING_SIGNATURE
- Creates audit trail entry with all signer info

#### `GET /api/signatures/:id`
Get single signature request with document and signer details.

#### `PATCH /api/signatures/:id`
Update signature request status (SIGNED, DECLINED, VIEWED).

**Request Body:**
```json
{
  "status": "SIGNED",
  "signatureImageUrl": "data:image/png;base64,...",
  "signerEmail": "signer@example.com"
}
```

**Features - On SIGNED:**
- Sets `signedAt` timestamp
- Records IP address
- Stores signature image URL
- Creates audit trail entry
- Checks if all signers have signed:
  - If yes: updates document status to SIGNED, creates completion audit entry
  - If no: updates document status to PARTIALLY_SIGNED

**Features - On DECLINED:**
- Creates audit trail entry with decline reason
- Records signer and timestamp

---

### 4. Signatures Verify API

#### `POST /api/signatures/verify`
Comprehensive verification endpoint for document signatures.

**Request Body:**
```json
{
  "documentId": "doc-uuid"
}
```

**Response:**
```json
{
  "document": { ... },
  "signatureRequests": [ ... ],
  "auditTrail": [ ... ],
  "integrityCheck": {
    "documentId": "...",
    "documentTitle": "...",
    "documentStatus": "SIGNED",
    "createdAt": "...",
    "lastModified": "...",
    "totalSignersRequired": 2,
    "signersCompleted": 2,
    "signersPending": 0,
    "signersDeclined": 0,
    "signatureChainValid": true,
    "completionDate": "...",
    "firstSignedAt": "...",
    "lastSignedAt": "..."
  },
  "signatureChain": [
    {
      "order": 1,
      "signer": "Alice",
      "email": "alice@example.com",
      "signedAt": "...",
      "ipAddress": "192.168.1.1",
      "sequenceValid": true
    }
  ],
  "verification": {
    "isComplete": true,
    "isPartiallyComplete": false,
    "chainValid": true,
    "allSignersIdentified": true,
    "hasDeclines": false
  }
}
```

**Features:**
- Full audit trail retrieval
- Signature chain validation
- Signer sequence validation
- Completion metrics
- Document integrity metrics

---

### 5. Dashboard API

#### `GET /api/dashboard`
Get KPIs and metrics for dashboard.

**Response:**
```json
{
  "kpis": {
    "totalDocuments": 150,
    "pendingSignatures": 23,
    "completedToday": 5,
    "totalTemplates": 12,
    "signatureCompletionRate": 87,
    "totalSignatureRequests": 250,
    "completedSignatures": 217
  },
  "breakdown": {
    "byStatus": {
      "DRAFT": 45,
      "PENDING_SIGNATURE": 23,
      "PARTIALLY_SIGNED": 8,
      "SIGNED": 74,
      "EXPIRED": 0
    },
    "byCategory": {
      "contracts": 8,
      "agreements": 3,
      "policies": 1,
      "Uncategorized": 0
    }
  },
  "recent": {
    "documents": [
      { "id", "title", "status", "createdAt", "createdBy", "_count" }
    ],
    "pendingSignatures": [
      { "id", "signerEmail", "signerName", "status", "createdAt", "document" }
    ]
  },
  "timestamp": "2026-03-27T08:19:00Z"
}
```

**Features:**
- Real-time KPI aggregation
- Status breakdown
- Category breakdown
- Recent documents (last 5)
- Pending signatures (next 5)
- Signature completion metrics

---

## Client-Side API Helper

**File:** `apps/kudodoc/src/lib/api.ts`

Type-safe API client with automatic header injection and cookie-based organization/user context.

### Usage

```typescript
import { templatesApi, documentsApi, signaturesApi, dashboardApi } from '@/lib/api';

// Templates
const templates = await templatesApi.list({ category: 'contracts' });
const template = await templatesApi.get('template-id');
const newTemplate = await templatesApi.create({ name: '...', content: '...' });
await templatesApi.update('id', { name: 'Updated' });
await templatesApi.delete('id');

// Documents
const docs = await documentsApi.list({ status: 'PENDING_SIGNATURE' });
const doc = await documentsApi.get('doc-id');
const newDoc = await documentsApi.create({
  title: 'Agreement',
  templateId: 'template-id',
  fieldValues: { companyName: 'ACME' }
});
await documentsApi.update('id', { status: 'SIGNED' });
await documentsApi.delete('id');

// Signatures
const sigs = await signaturesApi.list({ documentId: 'doc-id' });
const sig = await signaturesApi.get('sig-id');
await signaturesApi.requestSignatures({
  documentId: 'doc-id',
  signers: [{ email: '...', name: '...' }]
});
await signaturesApi.sign('sig-id', { status: 'SIGNED' });
const verification = await signaturesApi.verify('doc-id');

// Dashboard
const metrics = await dashboardApi.get();
```

### Features

- Automatic `x-org-id`, `x-user-id`, `x-user-email` header injection
- Reads organization/user context from browser cookies
- Query parameter handling with null/undefined filtering
- Error handling with descriptive messages
- Type-safe with TypeScript generics

---

## Data Flow & Workflows

### Template Creation Workflow
1. Admin creates template with `{{placeholders}}`
2. Template stored in database with fields metadata
3. Template marked as active

### Document Workflow
1. Create document from template (or from scratch)
2. Field values interpolated into template content
3. Document status: DRAFT
4. Audit entry: "Document created"

### Signature Workflow
1. Request signatures for document (POST /api/signatures)
   - Specify array of signers with email, name, order
   - Document status → PENDING_SIGNATURE
   - Audit entry: "Signature requested from [names]"

2. Signer views and signs (PATCH /api/signatures/:id)
   - Signature request status → SIGNED
   - IP address and timestamp recorded
   - Audit entry: "Document signed by [name]"
   - If all signers done: Document status → SIGNED, completion audit entry

3. Optional: Decline signature
   - Signature request status → DECLINED
   - Audit entry: "Signature declined by [name]"

### Verification Workflow
1. Call POST /api/signatures/verify with documentId
2. Returns:
   - Complete audit trail
   - All signature requests with status
   - Signature chain validation
   - Document integrity metrics
   - Completion verification

---

## Database Relations

### DocumentTemplate
- One-to-Many with Document
- Many-to-One with User (createdBy)
- Many-to-One with Organization

### Document
- Many-to-One with DocumentTemplate
- Many-to-One with User (createdBy)
- One-to-Many with SignatureRequest
- One-to-Many with DocumentAuditTrail

### SignatureRequest
- Many-to-One with Document
- Many-to-One with User (signer, optional)

### DocumentAuditTrail
- Many-to-One with Document

---

## Headers & Context

All API routes respect these headers:
- `x-org-id` - Organization ID (required, defaults to 'default')
- `x-user-id` - User ID (optional, defaults to 'system')
- `x-user-email` - User email (optional, defaults to 'system@inherenttech.ai')
- `x-forwarded-for` - IP address (recorded in signature requests and audit trails)

---

## Error Handling

All routes include:
- Try-catch blocks with error logging
- Validation of required fields (400 errors)
- Resource existence checks (404 errors)
- Business logic validation (400 errors)
- Cascading deletes where appropriate

---

## Files Created

```
/apps/kudodoc/src/app/api/
├── templates/
│   ├── route.ts           (GET, POST)
│   └── [id]/
│       └── route.ts       (GET, PATCH, DELETE)
├── documents/
│   ├── route.ts           (GET, POST)
│   └── [id]/
│       └── route.ts       (GET, PATCH, DELETE)
├── signatures/
│   ├── route.ts           (GET, POST)
│   ├── [id]/
│   │   └── route.ts       (GET, PATCH)
│   └── verify/
│       └── route.ts       (POST)
└── dashboard/
    └── route.ts           (GET)

/apps/kudodoc/src/lib/
└── api.ts                 (Client-side API helper)
```

---

## Key Features

✓ Multi-party signature support with sequence ordering
✓ Template interpolation with field replacement
✓ Complete audit trail for all document actions
✓ Signature chain validation and integrity checking
✓ Real-time KPI dashboard
✓ Soft delete templates, hard delete drafts
✓ IP address and timestamp recording
✓ Status transition tracking
✓ Pagination and filtering throughout
✓ TypeScript throughout with proper typing
✓ Production-ready error handling
✓ Automatic context from headers/cookies

---

## Status Enums

**DocumentStatus:**
- DRAFT
- PENDING_SIGNATURE
- PARTIALLY_SIGNED
- SIGNED
- EXPIRED

**SignatureStatus:**
- PENDING
- VIEWED
- SIGNED
- DECLINED
- EXPIRED

---

## Next Steps

1. Add authentication middleware to verify `x-org-id` and `x-user-id`
2. Add webhook notifications for signature requests and completions
3. Add email notifications to signers
4. Add document expiration/cleanup job
5. Add signature image storage (S3/cloud)
6. Add bulk template operations
7. Add document versioning
8. Add search/full-text indexing for documents
9. Add reporting/export endpoints
10. Add signature reminders/escalations

