export type UserRole = 'owner' | 'admin' | 'recruiter' | 'team_lead' | 'employee' | 'candidate' | 'client';

export type AppAccess = 'aiocrm' | 'ats' | 'kudodoc' | 'jobplatform';

export type VisaStatus = 'us_citizen' | 'green_card' | 'h1b' | 'opt' | 'cpt' | 'ead' | 'tn' | 'other';

export type SubmissionStatus = 'draft' | 'rtr_sent' | 'rtr_signed' | 'submitted' | 'interview' | 'offered' | 'placed' | 'rejected' | 'withdrawn';

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type OutreachChannel = 'email' | 'sms' | 'voice' | 'linkedin' | 'whatsapp' | 'telegram';

export type OutreachStatus = 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed';


export type AgentStage = 'shadow' | 'draft' | 'assisted' | 'full_auto';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
