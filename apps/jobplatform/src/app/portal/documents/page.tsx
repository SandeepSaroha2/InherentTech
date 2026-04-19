'use client';

import { useState } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'Signed' | 'Pending' | 'Expired';
  uploadedDate: string;
  dueDate: string;
}

export default function DocumentsPage() {
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Offer Letter - Tech Solutions Inc.',
      type: 'Offer Letter',
      status: 'Signed',
      uploadedDate: '2026-03-01',
      dueDate: '2026-03-10',
    },
    {
      id: '2',
      name: 'Non-Disclosure Agreement',
      type: 'NDA',
      status: 'Pending',
      uploadedDate: '2026-03-20',
      dueDate: '2026-03-30',
    },
    {
      id: '3',
      name: 'W-4 Form',
      type: 'Tax Form',
      status: 'Signed',
      uploadedDate: '2026-02-15',
      dueDate: '2026-02-28',
    },
    {
      id: '4',
      name: 'I-9 Verification',
      type: 'Employment Authorization',
      status: 'Signed',
      uploadedDate: '2026-02-10',
      dueDate: '2026-02-25',
    },
    {
      id: '5',
      name: 'Direct Deposit Authorization',
      type: 'Banking Form',
      status: 'Pending',
      uploadedDate: '2026-03-15',
      dueDate: '2026-03-28',
    },
    {
      id: '6',
      name: 'Employee Handbook Acknowledgment',
      type: 'Policy Document',
      status: 'Expired',
      uploadedDate: '2025-12-01',
      dueDate: '2025-12-15',
    },
  ]);

  const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      Signed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
      Pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      Expired: { bg: '#fee2e2', text: '#7f1d1d', border: '#fca5a5' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
  };

  const handleSign = (docId: string): void => {
    console.log('Sign document:', docId);
    alert('Document signing flow would open here');
  };

  const handleView = (docId: string): void => {
    console.log('View document:', docId);
    alert('Document viewer would open here');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
          Documents
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
          View and sign employment documents
        </p>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {documents.filter((d) => d.status === 'Signed').length}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Signed</p>
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {documents.filter((d) => d.status === 'Pending').length}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Pending</p>
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {documents.filter((d) => d.status === 'Expired').length}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Expired</p>
        </div>
      </div>

      {/* Documents Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Document
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Uploaded
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: typeof documents[0]) => {
                const statusColor = getStatusColor(doc.status);
                return (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'transparent';
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '500' }}>
                      {doc.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{doc.type}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {new Date(doc.uploadedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {new Date(doc.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: `1px solid ${statusColor.border}`,
                        }}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleView(doc.id)}
                        style={{
                          padding: '4px 8px',
                          marginRight: '4px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            '#3b82f6';
                        }}
                      >
                        View
                      </button>
                      {doc.status === 'Pending' && (
                        <button
                          onClick={() => handleSign(doc.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              '#059669';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              '#10b981';
                          }}
                        >
                          Sign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
