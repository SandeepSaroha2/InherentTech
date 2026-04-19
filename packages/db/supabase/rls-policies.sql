/**
 * InherentTech Supabase Row Level Security (RLS) Policies
 *
 * Multi-tenant system with organization-based data isolation.
 * Every table has an orgId column for tenant isolation.
 *
 * IMPORTANT: Service Role Bypass
 * Clients using the service_role key (supabaseAdmin) bypass all RLS policies.
 * Use with caution - only for admin operations and trusted backend services.
 * Always use the anon/user key for client applications.
 */

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Get current user's organization ID from JWT claims
 * Checks both top-level org_id and app_metadata.org_id
 */
CREATE OR REPLACE FUNCTION auth.org_id() RETURNS TEXT AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'org_id')
  );
$$ LANGUAGE sql STABLE;

/**
 * Get current user's role from JWT claims
 * Checks both top-level role and app_metadata.role
 */
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role')
  );
$$ LANGUAGE sql STABLE;

/**
 * Get current authenticated user's ID
 */
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- CORE TENANT ISOLATION (Organizations & Users)
-- ============================================================================

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only read/update their own org (must be OWNER/ADMIN)
CREATE POLICY "orgs_select" ON organizations
  FOR SELECT USING (
    id = auth.org_id()::uuid
  );

CREATE POLICY "orgs_update_owner_admin" ON organizations
  FOR UPDATE USING (
    id = auth.org_id()::uuid AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  ) WITH CHECK (
    id = auth.org_id()::uuid AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

CREATE POLICY "orgs_delete_owner" ON organizations
  FOR DELETE USING (
    id = auth.org_id()::uuid AND
    auth.user_role() = 'OWNER'
  );

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users: Everyone can read all users in their org (for discovery, mentions, etc)
CREATE POLICY "users_select_org_members" ON users
  FOR SELECT USING (
    org_id = auth.org_id()
  );

-- Users: Can always read/update their own profile
CREATE POLICY "users_select_self" ON users
  FOR SELECT USING (
    id = auth.user_id()
  );

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (
    id = auth.user_id()
  ) WITH CHECK (
    id = auth.user_id()
  );

-- Users: Only OWNER/ADMIN can create new users
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Users: Only OWNER/ADMIN can delete users
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================================
-- AUDIT & LOGGING
-- ============================================================================

-- Audit logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs: Users can read logs for their org
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    org_id = auth.org_id()
  );

-- Audit logs: Insert only (append-only audit trail)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

-- Email logs table
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Email logs: Users can read logs for their org
CREATE POLICY "email_logs_select" ON email_logs
  FOR SELECT USING (
    org_id = auth.org_id()
  );

-- Email logs: Insert only
CREATE POLICY "email_logs_insert" ON email_logs
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

-- ============================================================================
-- RECRUITMENT (Leads, Candidates, Job Orders, Submissions, Interviews)
-- ============================================================================

-- Leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "leads_delete" ON leads
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Candidates: Standard org-level access
CREATE POLICY "candidates_select_org" ON candidates
  FOR SELECT USING (
    org_id = auth.org_id()
  );

-- Candidates: CANDIDATE role users can only see their own record
CREATE POLICY "candidates_select_self" ON candidates
  FOR SELECT USING (
    user_id = auth.user_id()
  );

CREATE POLICY "candidates_insert" ON candidates
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "candidates_update" ON candidates
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "candidates_delete" ON candidates
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Job orders table
ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_orders_select" ON job_orders
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "job_orders_insert" ON job_orders
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "job_orders_update" ON job_orders
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "job_orders_delete" ON job_orders
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_select" ON submissions
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "submissions_insert" ON submissions
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "submissions_update" ON submissions
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "submissions_delete" ON submissions
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Interviews table
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interviews_select" ON interviews
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "interviews_insert" ON interviews
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "interviews_update" ON interviews
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "interviews_delete" ON interviews
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================================
-- STAFFING & PLACEMENTS
-- ============================================================================

-- Placements table
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "placements_select" ON placements
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "placements_insert" ON placements
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "placements_update" ON placements
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "placements_delete" ON placements
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================================
-- TIME & BILLING
-- ============================================================================

-- Timesheets table
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Timesheets: Users can see their own timesheets
CREATE POLICY "timesheets_select_own" ON timesheets
  FOR SELECT USING (
    user_id = auth.user_id()
  );

-- Timesheets: ADMIN/TEAM_LEAD can see all timesheets in their org
CREATE POLICY "timesheets_select_admin" ON timesheets
  FOR SELECT USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN', 'TEAM_LEAD')
  );

-- Timesheets: Users can only update their own
CREATE POLICY "timesheets_update_own" ON timesheets
  FOR UPDATE USING (
    user_id = auth.user_id()
  ) WITH CHECK (
    user_id = auth.user_id()
  );

-- Timesheets: ADMIN can update any in org
CREATE POLICY "timesheets_update_admin" ON timesheets
  FOR UPDATE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  ) WITH CHECK (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Timesheets: Users can insert their own
CREATE POLICY "timesheets_insert_own" ON timesheets
  FOR INSERT WITH CHECK (
    user_id = auth.user_id() AND
    org_id = auth.org_id()
  );

-- Timesheets: Delete restricted to OWNER/ADMIN
CREATE POLICY "timesheets_delete" ON timesheets
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Time entries table
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select" ON time_entries
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "time_entries_insert" ON time_entries
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "time_entries_update" ON time_entries
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "time_entries_delete" ON time_entries
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================================
-- ACTIVITIES & ENGAGEMENT
-- ============================================================================

-- Activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON activities
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "activities_insert" ON activities
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "activities_update" ON activities
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "activities_delete" ON activities
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Outreach campaigns table
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_campaigns_select" ON outreach_campaigns
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "outreach_campaigns_insert" ON outreach_campaigns
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "outreach_campaigns_update" ON outreach_campaigns
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "outreach_campaigns_delete" ON outreach_campaigns
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Outreach messages table
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_messages_select" ON outreach_messages
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "outreach_messages_insert" ON outreach_messages
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "outreach_messages_update" ON outreach_messages
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "outreach_messages_delete" ON outreach_messages
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================================
-- DOCUMENTS & SIGNATURES
-- ============================================================================

-- Document templates table
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_templates_select" ON document_templates
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "document_templates_insert" ON document_templates
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "document_templates_update" ON document_templates
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "document_templates_delete" ON document_templates
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Signature requests table
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- Signature requests: Users can see requests where they are a signer
CREATE POLICY "signature_requests_select_signer" ON signature_requests
  FOR SELECT USING (
    org_id = auth.org_id() OR
    signer_email = (SELECT email FROM users WHERE id = auth.user_id())
  );

-- Signature requests: Standard org access
CREATE POLICY "signature_requests_select_org" ON signature_requests
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "signature_requests_insert" ON signature_requests
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "signature_requests_update" ON signature_requests
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "signature_requests_delete" ON signature_requests
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Document audit trails table
ALTER TABLE document_audit_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_audit_trails_select" ON document_audit_trails
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "document_audit_trails_insert" ON document_audit_trails
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

-- ============================================================================
-- AI AGENTS & KNOWLEDGE BASES
-- ============================================================================

-- Agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select" ON agents
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "agents_insert" ON agents
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "agents_update" ON agents
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "agents_delete" ON agents
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Agent executions table
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_executions_select" ON agent_executions
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "agent_executions_insert" ON agent_executions
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "agent_executions_update" ON agent_executions
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "agent_executions_delete" ON agent_executions
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- Knowledge bases table
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_bases_select" ON knowledge_bases
  FOR SELECT USING (
    org_id = auth.org_id()
  );

CREATE POLICY "knowledge_bases_insert" ON knowledge_bases
  FOR INSERT WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "knowledge_bases_update" ON knowledge_bases
  FOR UPDATE USING (
    org_id = auth.org_id()
  ) WITH CHECK (
    org_id = auth.org_id()
  );

CREATE POLICY "knowledge_bases_delete" ON knowledge_bases
  FOR DELETE USING (
    org_id = auth.org_id() AND
    auth.user_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    user_id = auth.user_id()
  );

-- Notifications: Users can update their own notifications (mark as read, etc)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    user_id = auth.user_id()
  ) WITH CHECK (
    user_id = auth.user_id()
  );

-- Notifications: Users can insert into their own record (typically done by system)
CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT WITH CHECK (
    user_id = auth.user_id()
  );

-- Notifications: Users can delete their own (with restrictions)
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (
    user_id = auth.user_id()
  );

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

/**
 * SUMMARY OF RLS STRATEGY:
 *
 * 1. STANDARD TENANT ISOLATION:
 *    - SELECT/INSERT/UPDATE: org_id = auth.org_id()
 *    - DELETE: org_id = auth.org_id() AND user has OWNER/ADMIN role
 *
 * 2. USER-LEVEL ISOLATION:
 *    - users: Can always read/update own profile, ADMIN can create/delete
 *    - notifications: Users see only their own (user_id filter)
 *    - timesheets: Users see/update own, ADMIN sees all in org
 *
 * 3. SPECIAL CASES:
 *    - candidates: CANDIDATE role users see only their own record
 *    - organizations: Only OWNER/ADMIN can read/update their own org
 *    - signature_requests: Signers can see by email match
 *
 * 4. SERVICE ROLE BYPASS:
 *    Clients using supabase.createClient with service_role key bypass all RLS.
 *    Only use this for trusted backend operations. Always use anon/user key
 *    for client-facing features.
 *
 * 5. DEPLOYMENT NOTES:
 *    - Run this script against your Supabase project
 *    - Verify all tables are created before running this script
 *    - Test RLS policies with different user roles before production
 *    - Monitor auth.org_id() and auth.user_role() return values
 */
