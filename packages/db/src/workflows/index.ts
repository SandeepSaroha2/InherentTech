/**
 * n8n Workflow Definitions for InherentTech Platform
 *
 * These are the 16 planned automation workflows.
 * Each can be imported into n8n via the API or UI.
 * Webhook URLs follow the pattern: /webhook/{workflow-name}
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'crm' | 'ats' | 'outreach' | 'operations' | 'documents' | 'ai';
  webhookPath: string;
  triggerType: 'webhook' | 'cron' | 'event';
  schedule?: string; // cron expression for scheduled workflows
  nodes: WorkflowNode[];
  isActive: boolean;
}

export interface WorkflowNode {
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
}

// 1. Lead Scoring
export const leadScoringWorkflow: WorkflowDefinition = {
  id: 'wf_lead_scoring',
  name: 'Lead Scoring',
  description: 'Automatically scores new leads based on company size, industry, engagement, and fit. Updates lead score in CRM.',
  category: 'crm',
  webhookPath: 'lead-scoring',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'lead-scoring', method: 'POST' } },
    { name: 'Enrich Company Data', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '={{$json.companyDomain}}', method: 'GET', headers: { 'Accept': 'application/json' } } },
    { name: 'Score Calculation', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'let score = 0; const data = $json; if (data.employees > 100) score += 20; if (data.revenue > 1000000) score += 15; if (data.industry === "technology" || data.industry === "financial") score += 15; if (data.engagement > 3) score += 25; if (data.previousInteraction) score += 10; return { score, tier: score > 60 ? "HOT" : score > 30 ? "WARM" : "COLD", leadId: data.leadId };' } },
    { name: 'Update CRM Lead', type: 'n8n-nodes-base.httpRequest', position: [600, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/leads/{{$json.leadId}}', method: 'PATCH', headers: { 'x-org-id': '{{$json.orgId}}' }, body: { score: '={{$json.score}}', tier: '={{$json.tier}}' } } },
    { name: 'Notify Slack', type: 'n8n-nodes-base.slack', position: [800, 0], parameters: { channel: '#leads', message: 'New lead scored: {{$json.companyName}} — {{$json.tier}} ({{$json.score}} pts)' } },
  ],
  isActive: true,
};

// 2. Lead Nurture Sequence
export const leadNurtureWorkflow: WorkflowDefinition = {
  id: 'wf_lead_nurture',
  name: 'Lead Nurture Sequence',
  description: 'Multi-touch email sequence for new leads. Sends welcome, value prop, case study, and meeting request over 14 days.',
  category: 'crm',
  webhookPath: 'lead-nurture-sequence',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'lead-nurture-sequence', method: 'POST' } },
    { name: 'Day 0 - Welcome Email', type: 'n8n-nodes-base.emailSend', position: [200, 0], parameters: { subject: 'Welcome to InherentTech', to: '={{$json.contactEmail}}', body: 'Welcome {{$json.contactName}}! We\'re excited to connect.' } },
    { name: 'Wait 3 Days', type: 'n8n-nodes-base.wait', position: [400, 0], parameters: { amount: 3, unit: 'days' } },
    { name: 'Day 3 - Value Prop Email', type: 'n8n-nodes-base.emailSend', position: [600, 0], parameters: { subject: 'How We Cut Hiring Time by 60%', to: '={{$json.contactEmail}}', body: 'Hi {{$json.contactName}}, here\'s how we\'ve helped similar companies...' } },
    { name: 'Wait 4 Days', type: 'n8n-nodes-base.wait', position: [800, 0], parameters: { amount: 4, unit: 'days' } },
    { name: 'Day 7 - Case Study Email', type: 'n8n-nodes-base.emailSend', position: [1000, 0], parameters: { subject: 'Case Study: TechCorp Staffing Success', to: '={{$json.contactEmail}}', body: 'Check out how TechCorp reduced time-to-hire from 90 to 35 days...' } },
    { name: 'Wait 7 Days', type: 'n8n-nodes-base.wait', position: [1200, 0], parameters: { amount: 7, unit: 'days' } },
    { name: 'Day 14 - Meeting Request', type: 'n8n-nodes-base.emailSend', position: [1400, 0], parameters: { subject: 'Quick call this week?', to: '={{$json.contactEmail}}', body: 'Would love to find time for a brief call. Calendly link: ...' } },
  ],
  isActive: true,
};

// 3. New Lead Slack Alert
export const newLeadAlertWorkflow: WorkflowDefinition = {
  id: 'wf_new_lead_alert',
  name: 'New Lead Slack Alert',
  description: 'Posts a notification to Slack when a new lead is created or moves to a key stage.',
  category: 'crm',
  webhookPath: 'new-lead-slack-alert',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'new-lead-slack-alert', method: 'POST' } },
    { name: 'Format Slack Message', type: 'n8n-nodes-base.code', position: [200, 0], parameters: { code: 'const emoji = $json.tier === "HOT" ? "🔥" : $json.tier === "WARM" ? "🌤️" : "❄️"; return { text: `${emoji} *New Lead: ${$json.companyName}*\\n*Contact:* ${$json.contactName}\\n*Email:* ${$json.contactEmail}\\n*Source:* ${$json.source || "Web"}\\n*Value:* $${$json.value || "TBD"}\\n*Tier:* ${$json.tier} (${$json.score || 0} pts)` };' } },
    { name: 'Post to Slack Sales Channel', type: 'n8n-nodes-base.slack', position: [400, 0], parameters: { channel: '#sales', message: '={{$json.text}}' } },
  ],
  isActive: true,
};

// 4. Resume Parser
export const resumeParserWorkflow: WorkflowDefinition = {
  id: 'wf_resume_parser',
  name: 'Resume Parser & Enrichment',
  description: 'Automatically parses uploaded resumes using Claude AI and extracts candidate data into structured format.',
  category: 'ats',
  webhookPath: 'resume-parser',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'resume-parser', method: 'POST' } },
    { name: 'Parse Resume with Claude', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/candidates/parse-resume', method: 'POST', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Extract Parsed Data', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const parsed = $json.parsed; return { firstName: parsed.firstName, lastName: parsed.lastName, email: parsed.email, phone: parsed.phone, skills: parsed.skills, yearsOfExperience: parsed.yearsOfExperience, currentTitle: parsed.currentTitle, currentCompany: parsed.currentCompany, visaStatus: parsed.suggestedVisaStatus, candidateId: $json.candidateId };' } },
    { name: 'Update Candidate in DB', type: 'n8n-nodes-base.httpRequest', position: [600, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/candidates/{{$json.candidateId}}', method: 'PATCH', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '={{$json}}' } },
    { name: 'Notify Recruiter', type: 'n8n-nodes-base.slack', position: [800, 0], parameters: { channel: '#recruiting', message: 'Resume parsed: {{$json.firstName}} {{$json.lastName}} | {{$json.currentTitle}} | {{$json.yearsOfExperience}} yrs' } },
  ],
  isActive: true,
};

// 5. Candidate-Job Matcher
export const candidateMatcherWorkflow: WorkflowDefinition = {
  id: 'wf_candidate_matcher',
  name: 'Candidate-Job Matcher',
  description: 'Matches candidates to open job orders based on skills, experience, and requirements. Scores each match.',
  category: 'ats',
  webhookPath: 'candidate-job-matcher',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'candidate-job-matcher', method: 'POST' } },
    { name: 'Fetch Open Jobs', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/jobs?status=OPEN', method: 'GET', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Score Matches', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const candidate = $json.candidate; const jobs = $json.jobs; const matches = []; jobs.forEach(job => { let score = 0; const skillOverlap = candidate.skills.filter(s => job.requirements.includes(s)).length; score += skillOverlap * 15; if (candidate.yearsOfExperience >= job.yearsRequired) score += 20; if (candidate.visaStatus === "US_CITIZEN" || candidate.visaStatus === "GREEN_CARD") score += 10; matches.push({ jobId: job.id, jobTitle: job.title, candidateId: candidate.id, score, status: score > 60 ? "STRONG" : score > 30 ? "POTENTIAL" : "WEAK" }); }); return matches.sort((a, b) => b.score - a.score).slice(0, 5);' } },
    { name: 'Create Submissions', type: 'n8n-nodes-base.httpRequest', position: [600, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/submissions', method: 'POST', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{ "candidateId": "{{$json.candidateId}}", "jobOrderId": "{{$json.jobId}}", "score": {{$json.score}}, "matchQuality": "{{$json.status}}" }' } },
    { name: 'Notify Recruiter of Matches', type: 'n8n-nodes-base.slack', position: [800, 0], parameters: { channel: '#recruiting', message: 'Matched {{$json.name}} to {{$json.jobCount}} open roles' } },
  ],
  isActive: true,
};

// 6. Interview Scheduler
export const interviewSchedulerWorkflow: WorkflowDefinition = {
  id: 'wf_interview_scheduler',
  name: 'Interview Scheduler',
  description: 'Schedules interviews with candidates and hiring managers. Sends calendar invites and reminders.',
  category: 'ats',
  webhookPath: 'interview-scheduler',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'interview-scheduler', method: 'POST' } },
    { name: 'Find Available Slots', type: 'n8n-nodes-base.googleCalendar', position: [200, 0], parameters: { operation: 'getAvailability', calendarId: '{{$json.recruiterCalendarId}}', timeMin: '={{new Date().toISOString()}}', timeMax: '={{new Date(Date.now() + 14*24*60*60*1000).toISOString()}}' } },
    { name: 'Send Candidate Options', type: 'n8n-nodes-base.emailSend', position: [400, 0], parameters: { subject: 'Interview Times for {{$json.jobTitle}}', to: '={{$json.candidateEmail}}', body: 'Please select one of these times for your interview...' } },
    { name: 'Wait for Confirmation', type: 'n8n-nodes-base.wait', position: [600, 0], parameters: { amount: 2, unit: 'days' } },
    { name: 'Create Calendar Event', type: 'n8n-nodes-base.googleCalendar', position: [800, 0], parameters: { operation: 'create', summary: 'Interview: {{$json.candidateName}} for {{$json.jobTitle}}', description: 'Phone/Video interview', startTime: '={{$json.selectedTime}}', attendees: ['{{$json.candidateEmail}}', '{{$json.recruiterEmail}}'] } },
    { name: 'Send Confirmation & Reminder', type: 'n8n-nodes-base.emailSend', position: [1000, 0], parameters: { subject: 'Interview Confirmed: {{$json.jobTitle}}', to: '={{$json.candidateEmail}}', body: 'Your interview is scheduled for {{$json.selectedTime}}. Calendar invite attached.' } },
  ],
  isActive: true,
};

// 7. Submission Status Notification
export const submissionNotifyWorkflow: WorkflowDefinition = {
  id: 'wf_submission_notify',
  name: 'Submission Status Notification',
  description: 'Notifies candidate and recruiter when submission status changes (submitted, rejected, accepted, etc.).',
  category: 'ats',
  webhookPath: 'submission-status-notify',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'submission-status-notify', method: 'POST' } },
    { name: 'Map Status to Messages', type: 'n8n-nodes-base.code', position: [200, 0], parameters: { code: 'const status = $json.newStatus; const msgs = { SUBMITTED: "submitted to {{$json.companyName}}", REJECTED: "unfortunately rejected", ACCEPTED: "🎉 accepted!", INTERVIEW: "moved to interview stage" }; return { statusMsg: msgs[status] || status, emoji: status === "ACCEPTED" ? "🎉" : status === "REJECTED" ? "😞" : "📝" };' } },
    { name: 'Email Candidate', type: 'n8n-nodes-base.emailSend', position: [400, 0], parameters: { subject: '{{$json.emoji}} Your {{$json.jobTitle}} submission', to: '={{$json.candidateEmail}}', body: 'Hi {{$json.candidateName}}, your application was {{$json.statusMsg}}.' } },
    { name: 'Notify Recruiter on Slack', type: 'n8n-nodes-base.slack', position: [600, 0], parameters: { channel: '#recruiting', message: '{{$json.emoji}} {{$json.candidateName}} → {{$json.statusMsg}}' } },
    { name: 'Update ATS Submission', type: 'n8n-nodes-base.httpRequest', position: [800, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/submissions/{{$json.submissionId}}', method: 'PATCH', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{ "notificationSent": true, "lastNotifiedAt": "{{new Date().toISOString()}}" }' } },
  ],
  isActive: true,
};

// 8. Email Outreach Sequence
export const emailOutreachWorkflow: WorkflowDefinition = {
  id: 'wf_email_outreach',
  name: 'Email Outreach Sequence',
  description: 'Multi-step email outreach to passive candidates. Touch points over 3 weeks with breakoff conditions.',
  category: 'outreach',
  webhookPath: 'email-outreach-sequence',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'email-outreach-sequence', method: 'POST' } },
    { name: 'Day 0 - First Touch', type: 'n8n-nodes-base.emailSend', position: [200, 0], parameters: { subject: 'Quick opportunity for {{$json.title}}', to: '={{$json.email}}', body: 'Hi {{$json.name}}, I came across your profile. Quick fit for a {{$json.title}} role...' } },
    { name: 'Wait & Check Open Rate', type: 'n8n-nodes-base.wait', position: [400, 0], parameters: { amount: 4, unit: 'days' } },
    { name: 'If No Reply, Follow-up Email', type: 'n8n-nodes-base.emailSend', position: [600, 0], parameters: { subject: 'Re: Quick opportunity for {{$json.title}}', to: '={{$json.email}}', body: 'Just following up on my previous message. Thought this could be a great fit...' } },
    { name: 'Wait 7 Days', type: 'n8n-nodes-base.wait', position: [800, 0], parameters: { amount: 7, unit: 'days' } },
    { name: 'Final Touch - Value Prop', type: 'n8n-nodes-base.emailSend', position: [1000, 0], parameters: { subject: 'What you might be missing', to: '={{$json.email}}', body: 'Last message: here are the top reasons this role might excite you...' } },
  ],
  isActive: true,
};

// 9. LinkedIn Outreach
export const linkedinOutreachWorkflow: WorkflowDefinition = {
  id: 'wf_linkedin_outreach',
  name: 'LinkedIn Outreach Bot',
  description: 'Finds target candidates on LinkedIn, sends connection requests and InMail messages.',
  category: 'outreach',
  webhookPath: 'linkedin-outreach',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'linkedin-outreach', method: 'POST' } },
    { name: 'Search LinkedIn', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: 'https://www.linkedin.com/search/results/people/', method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' }, qs: { keywords: '{{$json.searchQuery}}', location: '{{$json.location}}' } } },
    { name: 'Parse Results', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const profiles = $json.profiles || []; return profiles.map(p => ({ linkedinUrl: p.url, name: p.name, title: p.title, company: p.company })).slice(0, 10);' } },
    { name: 'Send Connection Requests', type: 'n8n-nodes-base.httpRequest', position: [600, 0], parameters: { url: 'https://www.linkedin.com/messaging/compose/', method: 'POST', headers: { 'x-requested-with': 'XMLHttpRequest' }, body: '{ "recipientId": "{{$json.linkedinId}}", "message": "Hi {{$json.name}}, I think your {{$json.title}} background fits a role I\'m filling..." }' } },
    { name: 'Log Outreach Attempt', type: 'n8n-nodes-base.httpRequest', position: [800, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/activities', method: 'POST', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{ "type": "LINKEDIN_OUTREACH", "targetName": "{{$json.name}}", "linkedinUrl": "{{$json.linkedinUrl}}", "status": "SENT" }' } },
  ],
  isActive: true,
};

// 10. Follow-Up Reminder
export const followUpReminderWorkflow: WorkflowDefinition = {
  id: 'wf_followup_reminder',
  name: 'Follow-Up Reminder',
  description: 'Sends Slack reminders to recruiters about pending follow-ups on candidates, submissions, and invoices.',
  category: 'operations',
  webhookPath: 'follow-up-reminder',
  triggerType: 'cron',
  schedule: '0 9 * * 1-5',
  nodes: [
    { name: 'Scheduled Trigger (Daily 9am)', type: 'n8n-nodes-base.cron', position: [0, 0], parameters: { mode: 'every', minute: 0, hour: 9, dayOfWeek: [1, 2, 3, 4, 5] } },
    { name: 'Fetch Pending Follow-ups', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/activities?status=PENDING&daysOld=>=3', method: 'GET', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Group by User', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const activities = $json.data; const byUser = {}; activities.forEach(a => { if (!byUser[a.userId]) byUser[a.userId] = []; byUser[a.userId].push(a); }); return Object.entries(byUser).map(([userId, items]) => ({ userId, count: items.length, items }));' } },
    { name: 'Send Slack DM to Each User', type: 'n8n-nodes-base.slack', position: [600, 0], parameters: { message: '⏰ You have {{$json.count}} pending follow-ups. Check the list: {{$json.items}}' } },
  ],
  isActive: true,
};

// 11. Weekly Timesheet Reminder
export const timesheetReminderWorkflow: WorkflowDefinition = {
  id: 'wf_timesheet_reminder',
  name: 'Weekly Timesheet Reminder',
  description: 'Sends weekly reminders to candidates/contractors to submit timesheets. Follows up on overdue timesheets.',
  category: 'operations',
  webhookPath: 'timesheet-reminder',
  triggerType: 'cron',
  schedule: '0 9 * * 5',
  nodes: [
    { name: 'Friday Morning Trigger', type: 'n8n-nodes-base.cron', position: [0, 0], parameters: { mode: 'every', minute: 0, hour: 9, dayOfWeek: [5] } },
    { name: 'Fetch Active Placements', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/placements?status=ACTIVE', method: 'GET', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Check Timesheet Status', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const placements = $json.data; return placements.map(p => ({ candidateId: p.candidateId, candidateEmail: p.candidate.email, placementId: p.id, status: p.currentWeekTimesheet ? "SUBMITTED" : "PENDING" }));' } },
    { name: 'Email Pending Timesheets', type: 'n8n-nodes-base.emailSend', position: [600, 0], parameters: { subject: 'Reminder: Submit Your Timesheet by EOD Friday', to: '={{$json.candidateEmail}}', body: 'Hi, please submit your timesheet for this week. Timesheets deadline: EOD Friday.' } },
    { name: 'Slack Alert to Managers', type: 'n8n-nodes-base.slack', position: [800, 0], parameters: { channel: '#operations', message: '📋 {{$json.pendingCount}} timesheets pending. Please send reminders.' } },
  ],
  isActive: true,
};

// 12. Invoice Generator
export const invoiceGeneratorWorkflow: WorkflowDefinition = {
  id: 'wf_invoice_generator',
  name: 'Invoice Generator',
  description: 'Generates invoices from approved timesheets. Creates invoice line items, calculates totals, sends for approval.',
  category: 'operations',
  webhookPath: 'invoice-generator',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'invoice-generator', method: 'POST' } },
    { name: 'Fetch Approved Timesheet', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/timesheets/{{$json.timesheetId}}', method: 'GET', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Calculate Invoice Details', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const ts = $json; const hours = ts.totalHours; const billRate = ts.placement.billRate; const payRate = ts.placement.payRate; const subtotal = hours * billRate; const tax = subtotal * 0.1; const total = subtotal + tax; const margin = (subtotal - (hours * payRate)); return { invoiceNumber: `INV-${Date.now()}`, subtotal, tax, total, margin, hours, billRate, payRate };' } },
    { name: 'Create Invoice Record', type: 'n8n-nodes-base.httpRequest', position: [600, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/invoices', method: 'POST', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{{$json}}' } },
    { name: 'Email Invoice for Approval', type: 'n8n-nodes-base.emailSend', position: [800, 0], parameters: { subject: 'Invoice {{$json.invoiceNumber}} ready for review', to: '={{$json.clientEmail}}', body: 'Invoice for {{$json.candidateName}} - {{$json.hours}} hours @ ${{$json.billRate}}/hr = ${{$json.total}}' } },
  ],
  isActive: true,
};

// 13. Placement Onboarding
export const placementOnboardWorkflow: WorkflowDefinition = {
  id: 'wf_placement_onboard',
  name: 'Placement Onboarding',
  description: 'Triggers when a placement is accepted. Sends onboarding docs, schedules orientation, notifies team.',
  category: 'documents',
  webhookPath: 'placement-onboarding',
  triggerType: 'webhook',
  nodes: [
    { name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'placement-onboarding', method: 'POST' } },
    { name: 'Generate Offer Letter', type: 'n8n-nodes-base.code', position: [200, 0], parameters: { code: 'const p = $json; const letter = `Offer Letter\\n\\nCandidate: ${p.candidateName}\\nCompany: ${p.companyName}\\nRole: ${p.jobTitle}\\nStart Date: ${p.startDate}\\nBill Rate: $${p.billRate}/hr\\nDuration: TBD`; return { offerId: `OFF-${Date.now()}`, content: letter };' } },
    { name: 'Create DocuSign Envelope', type: 'n8n-nodes-base.httpRequest', position: [400, 0], parameters: { url: 'https://demo.docusign.net/restapi/v2.1/accounts/{{$env.DOCUSIGN_ACCOUNT}}/envelopes', method: 'POST', headers: { 'Authorization': 'Bearer {{$env.DOCUSIGN_TOKEN}}' }, body: '{ "documents": [{ "documentId": "1", "name": "Offer Letter", "pages": "{{$json.content}}" }], "recipients": { "signers": [{ "email": "{{$json.candidateEmail}}", "name": "{{$json.candidateName}}", "recipientId": "1" }] }, "status": "sent" }' } },
    { name: 'Email Onboarding Kit', type: 'n8n-nodes-base.emailSend', position: [600, 0], parameters: { subject: 'Welcome! Your onboarding documents', to: '={{$json.candidateEmail}}', body: 'Welcome to {{$json.companyName}}! Please sign the attached offer letter and submit required docs.' } },
    { name: 'Schedule Orientation', type: 'n8n-nodes-base.googleCalendar', position: [800, 0], parameters: { operation: 'create', summary: 'Orientation: {{$json.candidateName}}', startTime: '={{$json.startDate}}', attendees: ['{{$json.candidateEmail}}', '{{$json.managerEmail}}'] } },
    { name: 'Notify Team on Slack', type: 'n8n-nodes-base.slack', position: [1000, 0], parameters: { channel: '#operations', message: '🎉 {{$json.candidateName}} placed at {{$json.companyName}} starting {{$json.startDate}}' } },
  ],
  isActive: true,
};

// 14. Document Signature Reminder
export const signatureReminderWorkflow: WorkflowDefinition = {
  id: 'wf_signature_reminder',
  name: 'Document Signature Reminder',
  description: 'Sends reminders when documents are awaiting signature. Escalates after 3 days.',
  category: 'documents',
  webhookPath: 'signature-reminder',
  triggerType: 'cron',
  schedule: '0 10 * * *',
  nodes: [
    { name: 'Daily Check (10am)', type: 'n8n-nodes-base.cron', position: [0, 0], parameters: { mode: 'every', minute: 0, hour: 10 } },
    { name: 'Fetch Pending Signatures', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/documents?status=PENDING_SIGNATURE', method: 'GET', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Check Days Pending', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const docs = $json.data; return docs.map(d => { const daysPending = Math.floor((Date.now() - new Date(d.createdAt)) / (1000*60*60*24)); return { docId: d.id, recipientEmail: d.recipientEmail, recipientName: d.recipientName, daysPending, escalate: daysPending >= 3 }; });' } },
    { name: 'Send Reminder Email', type: 'n8n-nodes-base.emailSend', position: [600, 0], parameters: { subject: 'Reminder: Document awaiting your signature', to: '={{$json.recipientEmail}}', body: 'Hi {{$json.recipientName}}, please sign the attached document.' } },
    { name: 'If 3+ days, Escalate to Manager', type: 'n8n-nodes-base.emailSend', position: [800, 0], parameters: { subject: 'URGENT: {{$json.docType}} overdue signature', to: '={{$json.managerEmail}}', body: 'Document {{$json.docId}} pending signature for {{$json.daysPending}} days.' } },
  ],
  isActive: true,
};

// 15. Document Expiry Alert
export const docExpiryAlertWorkflow: WorkflowDefinition = {
  id: 'wf_doc_expiry_alert',
  name: 'Document Expiry Alert',
  description: 'Monitors document expiration dates (background checks, certifications, visas). Alerts 30, 14, 7, 1 days before expiry.',
  category: 'documents',
  webhookPath: 'document-expiry-alert',
  triggerType: 'cron',
  schedule: '0 7 * * *',
  nodes: [
    { name: 'Daily Morning Check (7am)', type: 'n8n-nodes-base.cron', position: [0, 0], parameters: { mode: 'every', minute: 0, hour: 7 } },
    { name: 'Fetch All Documents', type: 'n8n-nodes-base.httpRequest', position: [200, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/documents?includeExpired=false', method: 'GET', headers: { 'x-org-id': '{{$json.orgId}}' } } },
    { name: 'Check Expiry Dates', type: 'n8n-nodes-base.code', position: [400, 0], parameters: { code: 'const docs = $json.data; return docs.map(d => { const expiryDate = new Date(d.expiryDate); const daysUntil = Math.ceil((expiryDate - Date.now()) / (1000*60*60*24)); const alertLevel = daysUntil <= 1 ? "CRITICAL" : daysUntil <= 7 ? "URGENT" : daysUntil <= 14 ? "WARNING" : daysUntil <= 30 ? "INFO" : null; return { docId: d.id, type: d.type, daysUntil, alertLevel, recipientEmail: d.recipientEmail, recipientName: d.recipientName }; }).filter(d => d.alertLevel);' } },
    { name: 'Email Reminder', type: 'n8n-nodes-base.emailSend', position: [600, 0], parameters: { subject: '{{$json.alertLevel}}: {{$json.type}} expires in {{$json.daysUntil}} days', to: '={{$json.recipientEmail}}', body: 'Hi {{$json.recipientName}}, your {{$json.type}} is expiring in {{$json.daysUntil}} days. Please renew.' } },
    { name: 'Slack Alert to HR', type: 'n8n-nodes-base.slack', position: [800, 0], parameters: { channel: '#hr-alerts', message: '🚨 {{$json.alertLevel}}: {{$json.type}} for {{$json.recipientName}} expires in {{$json.daysUntil}} days' } },
  ],
  isActive: true,
};

// 16. AI Agent Orchestrator
export const aiAgentOrchestratorWorkflow: WorkflowDefinition = {
  id: 'wf_ai_agent_orchestrator',
  name: 'AI Agent Orchestrator',
  description: 'Central workflow that receives events from CRM/ATS and routes them to appropriate AI agents for processing.',
  category: 'ai',
  webhookPath: 'ai-agent-orchestrator',
  triggerType: 'webhook',
  nodes: [
    { name: 'Event Webhook Trigger', type: 'n8n-nodes-base.webhook', position: [0, 0], parameters: { path: 'ai-agent-orchestrator', method: 'POST' } },
    { name: 'Parse Event Type', type: 'n8n-nodes-base.code', position: [200, 0], parameters: { code: 'const event = $json.event; const eventMap = { "lead.created": "leadQualifier", "candidate.created": "candidateScorer", "submission.status_changed": "submissionAnalyzer", "placement.created": "placementOptimizer", "interview.scheduled": "interviewPrepAgent" }; return { agentType: eventMap[event] || "defaultAgent", eventType: event, payload: $json };' } },
    { name: 'Route to Agent', type: 'n8n-nodes-base.httpRequest', position: [400, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/agents/execute', method: 'POST', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{ "agentType": "{{$json.agentType}}", "event": "{{$json.eventType}}", "input": {{JSON.stringify($json.payload)}} }' } },
    { name: 'Process Agent Response', type: 'n8n-nodes-base.code', position: [600, 0], parameters: { code: 'const response = $json; return { agentOutput: response.output, success: response.success, recommendations: response.recommendations, nextSteps: response.nextSteps };' } },
    { name: 'Apply Recommendations', type: 'n8n-nodes-base.httpRequest', position: [800, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/{{$json.entityType}}/{{$json.entityId}}', method: 'PATCH', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{{$json.recommendations}}' } },
    { name: 'Log to Audit Trail', type: 'n8n-nodes-base.httpRequest', position: [1000, 0], parameters: { url: '{{$env.PLATFORM_URL}}/api/audit-logs', method: 'POST', headers: { 'x-org-id': '{{$json.orgId}}' }, body: '{ "action": "AI_AGENT_PROCESSED", "agentType": "{{$json.agentType}}", "eventType": "{{$json.eventType}}", "outcome": "{{$json.success}}" }' } },
  ],
  isActive: true,
};

// Export all workflows
export const ALL_WORKFLOWS: WorkflowDefinition[] = [
  leadScoringWorkflow,
  leadNurtureWorkflow,
  newLeadAlertWorkflow,
  resumeParserWorkflow,
  candidateMatcherWorkflow,
  interviewSchedulerWorkflow,
  submissionNotifyWorkflow,
  emailOutreachWorkflow,
  linkedinOutreachWorkflow,
  followUpReminderWorkflow,
  timesheetReminderWorkflow,
  invoiceGeneratorWorkflow,
  placementOnboardWorkflow,
  signatureReminderWorkflow,
  docExpiryAlertWorkflow,
  aiAgentOrchestratorWorkflow,
];

// Helper functions
export function getWorkflowByCategory(category: string): WorkflowDefinition[] {
  return ALL_WORKFLOWS.filter(w => w.category === category);
}

export function getActiveWorkflows(): WorkflowDefinition[] {
  return ALL_WORKFLOWS.filter(w => w.isActive);
}

export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return ALL_WORKFLOWS.find(w => w.id === id);
}

export function getWorkflowByWebhookPath(path: string): WorkflowDefinition | undefined {
  return ALL_WORKFLOWS.find(w => w.webhookPath === path);
}

export function getScheduledWorkflows(): WorkflowDefinition[] {
  return ALL_WORKFLOWS.filter(w => w.triggerType === 'cron' && w.schedule);
}

export function getWebhookWorkflows(): WorkflowDefinition[] {
  return ALL_WORKFLOWS.filter(w => w.triggerType === 'webhook');
}
