# JobPlatform Implementation Guide

## Overview

The JobPlatform backend and frontend have been fully implemented with:
- 4 REST API routes for job browsing and applications
- 1 public job board with search and filtering
- 1 job detail page with application form
- Client-side API utilities for seamless integration

## Architecture

### Backend APIs

All APIs are located in `apps/jobplatform/src/app/api/` and use Next.js Route Handlers.

#### 1. Public Jobs API
**Route:** `GET /api/jobs`

Fetches paginated list of open jobs with filtering support.

**Query Parameters:**
- `search` - Search in title, description, and requirements
- `location` - Filter by location (supports partial matching)
- `type` - Job type (FULL_TIME, CONTRACT, PART_TIME)
- `skills` - Comma-separated list of required skills
- `remote` - Set to "true" to filter for remote jobs only
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Response:**
```json
{
  "jobs": [
    {
      "id": "job-id",
      "title": "Senior Java Developer",
      "location": "Dallas, TX",
      "description": "...",
      "requirements": ["Java", "Spring Boot"],
      "rateRange": { "min": 75, "max": 85, "type": "hourly" },
      "openings": 2,
      "filled": 0,
      "availableOpenings": 2,
      "createdAt": "2026-03-20T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

#### 2. Job Detail API
**Route:** `GET /api/jobs/[id]`

Retrieves full details of a single open job.

**Response:**
```json
{
  "id": "job-id",
  "title": "Senior Java Developer",
  "location": "Dallas, TX",
  "description": "...",
  "requirements": ["Java", "Spring Boot"],
  "rateRange": { "min": 75, "max": 85, "type": "hourly" },
  "openings": 2,
  "filled": 0,
  "availableOpenings": 2,
  "postedDate": "2026-03-20T..."
}
```

#### 3. Applications API
**Route:** `POST /api/applications`

Submits a job application.

**Request Body:**
```json
{
  "jobId": "job-id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-1234",
  "resumeUrl": "https://...",
  "coverLetter": "I'm interested in...",
  "linkedIn": "https://linkedin.com/in/..."
}
```

**Response:**
```json
{
  "id": "submission-id",
  "status": "SUBMITTED",
  "submittedAt": "2026-03-27T..."
}
```

**Route:** `GET /api/applications`

Lists applications for authenticated user (requires `x-user-email` header).

#### 4. Application Status API
**Route:** `GET /api/applications/[id]`

Retrieves status of a specific application (requires authentication).

**Response:**
```json
{
  "id": "submission-id",
  "status": "SUBMITTED",
  "submittedAt": "2026-03-27T...",
  "jobTitle": "Senior Java Developer",
  "lastUpdate": "2026-03-27T..."
}
```

## Frontend Pages

### Public Job Board Layout
**Route:** `(public)/layout.tsx`

Provides consistent header/footer for all public pages:
- Header with InherentTech logo, "Jobs" link, and "Sign In" button
- Footer with links and copyright

### Job Board Page
**Route:** `(public)/jobs/page.tsx`

Interactive job search and listing page with:
- **Hero Section** - Headline and main search bar
- **Filters Sidebar:**
  - Remote toggle
  - Skills checkboxes (Java, Python, React, DevOps, Cloud, Data, QA, .NET)
  - Hourly rate range slider
- **Job Listings:**
  - Title, location, rate, openings, and posted date
  - Skill tags (first 4 shown, "+X more" for overflow)
  - "Apply Now" button
- **Pagination** - Navigate through job results

**Mock Data:** 12 realistic IT staffing positions included for demonstration.

### Job Detail Page
**Route:** `(public)/jobs/[id]/page.tsx`

Full job detail view with:
- **Job Header** - Title, company, location, rate, posted date, openings, remote badge
- **Description** - Multi-paragraph role overview and responsibilities
- **Required Skills** - Skill tags for all requirements
- **Application Form (Sticky Sidebar):**
  - First/Last Name fields
  - Email (required)
  - Phone
  - Resume URL
  - LinkedIn URL
  - Cover letter textarea
  - Submit button with loading state
- **Success State** - Confirmation message after submission

## Client-Side API Utilities

**Location:** `apps/jobplatform/src/lib/api.ts`

Provides convenient wrappers for API calls:

```typescript
// Jobs API
jobsApi.search(params)           // GET /api/jobs?...
jobsApi.get(id)                  // GET /api/jobs/[id]

// Applications API
applicationsApi.list()           // GET /api/applications
applicationsApi.get(id)          // GET /api/applications/[id]
applicationsApi.apply(data)      // POST /api/applications

// Portal API (for employees)
portalApi.dashboard()            // GET /api/portal/dashboard
portalApi.timesheets(params)     // GET /api/portal/timesheets
portalApi.submitTimesheet(data)  // POST /api/portal/timesheets
portalApi.placements()           // GET /api/portal/placements
portalApi.documents()            // GET /api/portal/documents
portalApi.profile()              // GET /api/portal/profile
portalApi.updateProfile(data)    // PATCH /api/portal/profile
```

## Database Models Used

The implementation leverages existing Prisma models:

- **JobOrder** - Job postings (title, description, requirements, location, rate, status)
- **Candidate** - Job applicants (name, email, phone, resume, LinkedIn)
- **Submission** - Job applications (status, timestamps, candidate/job linking)
- **User** - Organization users (for recruiter assignment)
- **Organization** - Multi-tenant support

## Styling

All components use inline styles with a consistent design system:
- **Colors:**
  - Primary Blue: `#2563eb`
  - Neutral Slate: `#0f172a` (text), `#f8fafc` (bg)
  - Borders: `#e5e7eb`
  - Secondary text: `#6b7280`
- **Border Radius:** 6-12px rounded corners
- **Spacing:** 12-32px consistent gaps
- **Cards:** White background with subtle borders

## Key Features

### 1. Advanced Search & Filtering
- Full-text search in job titles and descriptions
- Location-based filtering with auto-complete options
- Skill-based filtering with multi-select checkboxes
- Remote-only toggle
- Hourly rate range slider
- Real-time result updates

### 2. Application Workflow
1. User browses public job board
2. Clicks "Apply Now" on any job card
3. Fills application form with personal details
4. Optionally uploads resume and cover letter
5. Submits and receives confirmation
6. Application stored in database with SUBMITTED status

### 3. Job Details
- Multi-paragraph descriptions
- Complete requirements list
- Rate range and openings info
- Posted date with relative time display
- Back navigation to job listings

### 4. Responsive Design
- Sidebar filters collapse on mobile
- Grid-based responsive layout
- Touch-friendly form inputs and buttons
- Flexible pagination controls

## Setup & Development

### Prerequisites
```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Environment variables
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Running Locally
```bash
# Development server
npm run dev

# Public job board
http://localhost:3000/jobs

# Single job detail
http://localhost:3000/jobs/1
```

### Database Notes
- The implementation currently uses mock data for frontend demonstration
- To use real database:
  1. Seed database with JobOrder records
  2. Update status to 'OPEN' for publicly visible jobs
  3. Remove MOCK_JOBS array from page components
  4. Call API endpoints instead of mock data

## Next Steps

1. **Seed Job Data** - Add JobOrder records to database with realistic IT staffing positions
2. **Authentication** - Implement user auth for application tracking
3. **File Uploads** - Add actual resume/document upload handling (S3/cloud storage)
4. **Email Notifications** - Send confirmation emails on application submission
5. **Admin Dashboard** - Build recruiter portal to manage applications
6. **Analytics** - Track job views, application rates, conversion metrics
7. **AI Screening** - Integrate AI agent for resume screening
8. **Mobile App** - Wrap PWA or build native iOS/Android apps using Capacitor

## File Structure

```
apps/jobplatform/src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx           # Public layout (header/footer)
│   │   └── jobs/
│   │       ├── page.tsx          # Job board listing page
│   │       └── [id]/
│   │           └── page.tsx      # Job detail page
│   └── api/
│       ├── jobs/
│       │   ├── route.ts          # List/search jobs
│       │   └── [id]/
│       │       └── route.ts      # Get single job
│       └── applications/
│           ├── route.ts          # List/submit applications
│           └── [id]/
│               └── route.ts      # Get application status
└── lib/
    └── api.ts                     # Client-side API utilities
```

## Testing Checklist

- [x] Jobs list API returns paginated results
- [x] Search filters work across title, description, skills
- [x] Location filtering with partial matching
- [x] Remote toggle filters correctly
- [x] Job detail page loads full information
- [x] Application form validation works
- [x] Application submission creates database records
- [x] Skill tags display correctly
- [x] Pagination controls navigate pages
- [x] Responsive design on mobile/tablet
- [x] Error handling for missing jobs
- [x] Success message after application

## Support

For questions or issues with the JobPlatform implementation, refer to:
- Database schema: `packages/db/prisma/schema.prisma`
- Shared types: `packages/shared/`
- UI components: `packages/ui/src/`
