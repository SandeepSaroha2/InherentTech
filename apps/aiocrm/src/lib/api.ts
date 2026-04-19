import { getSupabaseBrowserClient } from '@inherenttech/ui';

const BASE_URL = '/api';

type RequestOptions = {
  method?: string;
  body?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers: extraHeaders } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    );
    url += `?${searchParams}`;
  }

  // Get auth token from Supabase session
  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Redirect to login on auth failure
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
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
    // Fall through to default headers
  }
  return { 'x-org-id': 'default' };
}

// Typed API methods
export const leadsApi = {
  list: (params?: Record<string, string>) => api('/leads', { params }),
  get: (id: string) => api(`/leads/${id}`),
  create: (data: any) => api('/leads', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/leads/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) => api(`/leads/${id}`, { method: 'DELETE' }),
};

export const activitiesApi = {
  list: (params?: Record<string, string>) => api('/activities', { params }),
  create: (data: any) => api('/activities', { method: 'POST', body: data }),
};

export const dashboardApi = {
  get: () => api('/dashboard'),
};
