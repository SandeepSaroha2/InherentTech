import { getSupabaseBrowserClient } from '@inherenttech/ui';

const BASE_URL = '/api';

async function api<T = any>(path: string, options: { method?: string; body?: any; params?: Record<string, string> } = {}): Promise<T> {
  const { method = 'GET', body, params } = options;
  let url = `${BASE_URL}${path}`;
  if (params) {
    const sp = new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== ''));
    url += `?${sp}`;
  }

  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
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
  return { 'x-org-id': 'default' };
}

export const candidatesApi = {
  list: (params?: Record<string, string>) => api('/candidates', { params }),
  get: (id: string) => api(`/candidates/${id}`),
  create: (data: any) => api('/candidates', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/candidates/${id}`, { method: 'PATCH', body: data }),
};

export const jobsApi = {
  list: (params?: Record<string, string>) => api('/jobs', { params }),
  create: (data: any) => api('/jobs', { method: 'POST', body: data }),
};

export const submissionsApi = {
  list: (params?: Record<string, string>) => api('/submissions', { params }),
  create: (data: any) => api('/submissions', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/submissions/${id}`, { method: 'PATCH', body: data }),
};

export const interviewsApi = {
  list: (params?: Record<string, string>) => api('/interviews', { params }),
  create: (data: any) => api('/interviews', { method: 'POST', body: data }),
};

export const timesheetsApi = {
  list: (params?: Record<string, string>) => api('/timesheets', { params }),
  create: (data: any) => api('/timesheets', { method: 'POST', body: data }),
};

export const dashboardApi = { get: () => api('/dashboard') };
