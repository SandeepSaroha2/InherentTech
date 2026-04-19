/**
 * KudoDoc Type Definitions
 * Central location for all API response and request types
 */

/**
 * Document Status Enum
 */
export type DocumentStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'PARTIALLY_SIGNED' | 'SIGNED' | 'EXPIRED';

/**
 * Signature Status Enum
 */
export type SignatureStatus = 'PENDING' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'EXPIRED';

/**
 * Document Template
 */
export interface DocumentTemplate {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  content: string;
  fields: TemplateField[] | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy: User;
  _count: {
    documents: number;
  };
}

/**
 * Template Field Definition
 */
export interface TemplateField {
  name: string;
  type: 'text' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox';
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

/**
 * Document Instance
 */
export interface Document {
  id: string;
  orgId: string;
  templateId: string | null;
  title: string;
  content: string;
  status: DocumentStatus;
  fileUrl: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy: User;
  template: DocumentTemplate | null;
  signatureRequests?: SignatureRequest[];
  documentAuditTrail?: DocumentAuditTrail[];
  _count?: {
    signatureRequests: number;
    documentAuditTrail: number;
  };
}

/**
 * Signature Request
 */
export interface SignatureRequest {
  id: string;
  orgId: string;
  documentId: string;
  signerEmail: string;
  signerName: string | null;
  signerId: string | null;
  order: number;
  status: SignatureStatus;
  signedAt: Date | null;
  ipAddress: string | null;
  signatureImageUrl: string | null;
  createdAt: Date;
  document?: Document;
  signer?: User;
}

/**
 * Document Audit Trail Entry
 */
export interface DocumentAuditTrail {
  id: string;
  documentId: string;
  action: string;
  actorEmail: string;
  actorName: string | null;
  ipAddress: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

/**
 * User Reference
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * Pagination Info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * List Response
 */
export interface ListResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Template Request Body
 */
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  content: string;
  fields?: TemplateField[];
  category?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string | null;
  content?: string;
  fields?: TemplateField[];
  category?: string | null;
  isActive?: boolean;
}

/**
 * Document Request Body
 */
export interface CreateDocumentRequest {
  title: string;
  content?: string;
  templateId?: string;
  fieldValues?: Record<string, any>;
  expiresAt?: string | Date;
  fileUrl?: string;
  createdByName?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  status?: DocumentStatus;
  expiresAt?: string | Date | null;
  updatedByName?: string;
}

/**
 * Signature Request Body
 */
export interface CreateSignatureRequestRequest {
  documentId: string;
  signers: SignerInput[];
  requestedByName?: string;
}

export interface SignerInput {
  email: string;
  name?: string;
  userId?: string;
  order?: number;
}

export interface UpdateSignatureRequestRequest {
  status: SignatureStatus;
  signatureImageUrl?: string;
  declineReason?: string;
  signerEmail?: string;
}

/**
 * Dashboard Response
 */
export interface DashboardResponse {
  kpis: {
    totalDocuments: number;
    pendingSignatures: number;
    completedToday: number;
    totalTemplates: number;
    signatureCompletionRate: number;
    totalSignatureRequests: number;
    completedSignatures: number;
  };
  breakdown: {
    byStatus: Record<DocumentStatus, number>;
    byCategory: Record<string, number>;
  };
  recent: {
    documents: Array<{
      id: string;
      title: string;
      status: DocumentStatus;
      createdAt: Date;
      createdBy: User;
      _count: { signatureRequests: number };
    }>;
    pendingSignatures: Array<{
      id: string;
      signerEmail: string;
      signerName: string | null;
      status: SignatureStatus;
      createdAt: Date;
      document: {
        id: string;
        title: string;
      };
    }>;
  };
  timestamp: Date;
}

/**
 * Signature Verification Response
 */
export interface VerifySignaturesResponse {
  document: Document;
  signatureRequests: SignatureRequest[];
  auditTrail: DocumentAuditTrail[];
  integrityCheck: {
    documentId: string;
    documentTitle: string;
    documentStatus: DocumentStatus;
    createdAt: Date;
    lastModified: Date;
    createdBy: User;
    totalSignersRequired: number;
    signersCompleted: number;
    signersPending: number;
    signersDeclined: number;
    signatureChainValid: boolean;
    completionDate: Date | null;
    firstSignedAt: Date | null;
    lastSignedAt: Date | null;
  };
  signatureChain: Array<{
    order: number;
    signer: string;
    email: string;
    signedAt: Date | null;
    ipAddress: string | null;
    sequenceValid: boolean;
  }>;
  verification: {
    isComplete: boolean;
    isPartiallyComplete: boolean;
    chainValid: boolean;
    allSignersIdentified: boolean;
    hasDeclines: boolean;
  };
}

/**
 * Error Response
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, any>;
}

/**
 * Success Response
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * API Error Class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Type Guards
 */
export function isDocument(obj: any): obj is Document {
  return obj && typeof obj === 'object' && 'id' in obj && 'title' in obj && 'status' in obj;
}

export function isSignatureRequest(obj: any): obj is SignatureRequest {
  return obj && typeof obj === 'object' && 'id' in obj && 'signerEmail' in obj && 'status' in obj;
}

export function isDocumentTemplate(obj: any): obj is DocumentTemplate {
  return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj && 'content' in obj;
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && typeof obj === 'object' && 'error' in obj;
}
