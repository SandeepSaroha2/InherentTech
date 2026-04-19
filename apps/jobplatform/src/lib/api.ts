/**
 * Client-side API utilities for JobPlatform
 * Handles requests to both public and portal APIs
 */

import { getSupabaseBrowserClient } from '@inherenttech/ui';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

async function api(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, params, headers = {} } = options;

  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      query.append(key, String(value));
    });
    url += `?${query.toString()}`;
  }

  const authHeaders = await getAuthHeaders();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'x-org-id': session.user?.user_metadata?.org_id || 'default',
        'x-user-id': session.user?.id || '',
      };
    }
  } catch {
    // Fall through
  }
  return {};
}

/**
 * Public Jobs API - for browsing and applying
 */
export const jobsApi = {
  search: (params?: Record<string, string | number | boolean>) =>
    api('/api/jobs', { params }),
  get: (id: string) => api(`/api/jobs/${id}`),
};

/**
 * Applications API - for submitting and tracking applications
 */
export const applicationsApi = {
  list: () => api('/api/applications'),
  get: (id: string) => api(`/api/applications/${id}`),
  apply: (data: any) => api('/api/applications', { method: 'POST', body: data }),
};

/**
 * Portal API - for authenticated employees/consultants
 */
export const portalApi = {
  dashboard: () => api('/api/portal/dashboard'),
  timesheets: (params?: Record<string, string>) =>
    api('/api/portal/timesheets', { params }),
  submitTimesheet: (data: any) =>
    api('/api/portal/timesheets', { method: 'POST', body: data }),
  placements: () => api('/api/portal/placements'),
  documents: () => api('/api/portal/documents'),
  profile: () => api('/api/portal/profile'),
  updateProfile: (data: any) =>
    api('/api/portal/profile', { method: 'PATCH', body: data }),
};
