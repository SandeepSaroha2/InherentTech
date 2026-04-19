/**
 * KudoDoc API Client Helper
 * Provides type-safe wrapper functions for all API endpoints
 */

import { getSupabaseBrowserClient } from '@inherenttech/ui';

const BASE_URL = '/api';

/**
 * Get auth headers from Supabase session
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'x-org-id': session.user?.user_metadata?.org_id || 'default',
        'x-user-id': session.user?.id || 'system',
        'x-user-email': session.user?.email || 'system@inherenttech.ai',
      };
    }
  } catch {
    // Fall through
  }
  return {
    'x-org-id': 'default',
    'x-user-id': 'system',
    'x-user-email': 'system@inherenttech.ai',
  };
}

/**
 * Generic API request function with automatic header injection
 */
async function api<T = any>(
  path: string,
  options: {
    method?: string;
    body?: any;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${BASE_URL}${path}`;

  // Add query parameters
  if (params) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        sp.append(key, String(value));
      }
    }
    const queryString = sp.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const authHeaders = await getAuthHeaders();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Templates API
 */
export const templatesApi = {
  /**
   * List templates with optional filtering
   */
  list: (params?: { category?: string; active?: boolean; search?: string; page?: number; limit?: number }) =>
    api('/templates', { params }),

  /**
   * Get single template by ID
   */
  get: (id: string) => api(`/templates/${id}`),

  /**
   * Create new template
   */
  create: (data: {
    name: string;
    content: string;
    description?: string;
    fields?: any;
    category?: string;
  }) => api('/templates', { method: 'POST', body: data }),

  /**
   * Update template
   */
  update: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      content?: string;
      fields?: any;
      category?: string | null;
      isActive?: boolean;
    }
  ) => api(`/templates/${id}`, { method: 'PATCH', body: data }),

  /**
   * Soft delete template
   */
  delete: (id: string) => api(`/templates/${id}`, { method: 'DELETE' }),
};

/**
 * Documents API
 */
export const documentsApi = {
  /**
   * List documents with optional filtering
   */
  list: (params?: {
    status?: string;
    templateId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api('/documents', { params }),

  /**
   * Get single document by ID with full details
   */
  get: (id: string) => api(`/documents/${id}`),

  /**
   * Create new document
   */
  create: (data: {
    title: string;
    content?: string;
    templateId?: string;
    fieldValues?: Record<string, any>;
    expiresAt?: string | Date;
    fileUrl?: string;
    createdByName?: string;
  }) => api('/documents', { method: 'POST', body: data }),

  /**
   * Update document
   */
  update: (
    id: string,
    data: {
      title?: string;
      content?: string;
      status?: 'DRAFT' | 'PENDING_SIGNATURE' | 'PARTIALLY_SIGNED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
      expiresAt?: string | Date | null;
      updatedByName?: string;
    }
  ) => api(`/documents/${id}`, { method: 'PATCH', body: data }),

  /**
   * Delete document (only if DRAFT)
   */
  delete: (id: string) => api(`/documents/${id}`, { method: 'DELETE' }),
};

/**
 * Signatures API
 */
export const signaturesApi = {
  /**
   * List signature requests with optional filtering
   */
  list: (params?: {
    status?: string;
    documentId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api('/signatures', { params }),

  /**
   * Get single signature request by ID
   */
  get: (id: string) => api(`/signatures/${id}`),

  /**
   * Create signature requests for a document
   */
  requestSignatures: (data: {
    documentId: string;
    signers: Array<{
      email: string;
      name?: string;
      userId?: string;
      order?: number;
    }>;
    requestedByName?: string;
  }) => api('/signatures', { method: 'POST', body: data }),

  /**
   * Sign a document
   */
  sign: (
    id: string,
    data: {
      status: 'SIGNED' | 'DECLINED' | 'VIEWED';
      signatureImageUrl?: string;
      declineReason?: string;
      signerEmail?: string;
    }
  ) => api(`/signatures/${id}`, { method: 'PATCH', body: data }),

  /**
   * Verify document signatures and get full audit trail
   */
  verify: (documentId: string) =>
    api('/signatures/verify', {
      method: 'POST',
      body: { documentId },
    }),
};

/**
 * Dashboard API
 */
export const dashboardApi = {
  /**
   * Get dashboard KPIs and metrics
   */
  get: () => api('/dashboard'),
};

/**
 * Export all API clients
 */
export default {
  templatesApi,
  documentsApi,
  signaturesApi,
  dashboardApi,
};
