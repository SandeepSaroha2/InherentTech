'use client';

import React, { useState } from 'react';

// Mock templates
const TEMPLATES = [
  {
    id: 'employment',
    name: 'Employment Agreement',
    description: 'Full-time or contract employment agreement',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'InherentTech Solutions LLC' },
      { name: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'Alex Johnson' },
      { name: 'position', label: 'Position', type: 'text', placeholder: 'Senior Java Developer' },
      { name: 'hourlyRate', label: 'Hourly Rate', type: 'text', placeholder: '$85.00' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'term', label: 'Term (months)', type: 'text', placeholder: '6' },
    ],
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement (NDA)',
    description: 'Protect confidential business information',
    fields: [
      { name: 'disclosingParty', label: 'Disclosing Party', type: 'text', placeholder: 'Company Name' },
      { name: 'receivingParty', label: 'Receiving Party', type: 'text', placeholder: 'Individual/Company Name' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { name: 'termYears', label: 'Term (years)', type: 'text', placeholder: '3' },
    ],
  },
  {
    id: 'sow',
    name: 'Statement of Work (SOW)',
    description: 'Define project scope, deliverables, and timeline',
    fields: [
      { name: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Client Organization' },
      { name: 'vendorName', label: 'Vendor Name', type: 'text', placeholder: 'Service Provider' },
      { name: 'projectTitle', label: 'Project Title', type: 'text', placeholder: 'Web App Development' },
      { name: 'projectValue', label: 'Project Value', type: 'text', placeholder: '$50,000' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
    ],
  },
  {
    id: 'offer',
    name: 'Offer Letter',
    description: 'Job offer with terms and conditions',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'InherentTech Solutions LLC' },
      { name: 'candidateName', label: 'Candidate Name', type: 'text', placeholder: 'Jane Smith' },
      { name: 'position', label: 'Position', type: 'text', placeholder: 'Senior Product Manager' },
      { name: 'salary', label: 'Annual Salary', type: 'text', placeholder: '$150,000' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'reportingTo', label: 'Reporting To', type: 'text', placeholder: 'VP Engineering' },
    ],
  },
];

// Mock document previews
const TEMPLATE_PREVIEWS: Record<string, string> = {
  employment: `<h1>Employment Agreement</h1>
<p>This Employment Agreement ("Agreement") is entered into as of <strong>[START_DATE]</strong>, by and between:</p>
<p><strong>[COMPANY_NAME]</strong> ("Company"), and<br/><strong>[EMPLOYEE_NAME]</strong> ("Employee").</p>
<h2>1. Position & Duties</h2>
<p>Employee shall serve as <strong>[POSITION]</strong> and shall perform duties as assigned by the Company.</p>
<h2>2. Compensation</h2>
<p>Employee shall be compensated at a rate of <strong>[HOURLY_RATE]</strong>, paid bi-weekly.</p>
<h2>3. Term</h2>
<p>This Agreement shall commence on <strong>[START_DATE]</strong> and continue for a period of <strong>[TERM]</strong> months.</p>`,
  nda: `<h1>Non-Disclosure Agreement</h1>
<p>This NDA is entered into as of <strong>[EFFECTIVE_DATE]</strong>, between:</p>
<p><strong>[DISCLOSING_PARTY]</strong> ("Discloser") and <strong>[RECEIVING_PARTY]</strong> ("Recipient").</p>
<h2>1. Confidential Information</h2>
<p>Recipient agrees to maintain the confidentiality of all information disclosed by Discloser.</p>
<h2>2. Term</h2>
<p>This Agreement shall remain in effect for <strong>[TERM_YEARS]</strong> years from the Effective Date.</p>`,
  sow: `<h1>Statement of Work</h1>
<p>This SOW is entered into as of [EFFECTIVE_DATE], between:</p>
<p><strong>[VENDOR_NAME]</strong> ("Vendor") and <strong>[CLIENT_NAME]</strong> ("Client").</p>
<h2>1. Project Overview</h2>
<p>Project: <strong>[PROJECT_TITLE]</strong></p>
<p>Project Value: <strong>[PROJECT_VALUE]</strong></p>
<h2>2. Timeline</h2>
<p>Start Date: <strong>[START_DATE]</strong><br/>End Date: <strong>[END_DATE]</strong></p>`,
  offer: `<h1>Offer Letter</h1>
<p>Dear [CANDIDATE_NAME],</p>
<p><strong>[COMPANY_NAME]</strong> is pleased to extend an offer of employment for the position of <strong>[POSITION]</strong>.</p>
<h2>1. Compensation</h2>
<p>Annual Salary: <strong>[SALARY]</strong></p>
<h2>2. Employment Terms</h2>
<p>Start Date: <strong>[START_DATE]</strong><br/>Reporting To: <strong>[REPORTING_TO]</strong></p>`,
};

type Step = 'method' | 'template-select' | 'template-fields' | 'preview' | 'signers';

export default function DocumentNewPage() {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<'template' | 'blank' | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [signers, setSigners] = useState<Array<{ id: string; name: string; email: string; order: number }>>([
    { id: '1', name: '', email: '', order: 0 },
  ]);

  const handleMethodSelect = (m: 'template' | 'blank') => {
    setMethod(m);
    if (m === 'template') {
      setStep('template-select');
    } else {
      setStep('signers');
    }
  };

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setFormData({});
    template.fields.forEach(f => {
      setFormData(prev => ({ ...prev, [f.name]: '' }));
    });
    setStep('template-fields');
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFieldsComplete = () => {
    setStep('preview');
  };

  const handleSignerChange = (id: string, field: 'name' | 'email', value: string) => {
    setSigners(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSignerOrderChange = (id: string, newOrder: number) => {
    setSigners(prev => prev.map(s => s.id === id ? { ...s, order: newOrder } : s));
  };

  const addSigner = () => {
    setSigners(prev => [...prev, { id: String(Date.now()), name: '', email: '', order: prev.length }]);
  };

  const removeSigner = (id: string) => {
    setSigners(prev => prev.filter(s => s.id !== id));
  };

  const handleCreate = () => {
    const validSigners = signers.filter(s => s.name && s.email);
    if (validSigners.length === 0) {
      alert('Please add at least one signer with name and email');
      return;
    }
    alert(`Document created with ${validSigners.length} signer(s) and sent for signature!`);
    // In a real app, would call API to create document
  };

  // Step 1: Choose Method
  if (step === 'method') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>Create New Document</h1>
          <p style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 48 }}>Choose how you'd like to create your document</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Template Button */}
            <button
              onClick={() => handleMethodSelect('template')}
              style={{
                padding: 32,
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                const el = e.currentTarget;
                el.style.borderColor = '#3b82f6';
                el.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
              }}
              onMouseOut={e => {
                const el = e.currentTarget;
                el.style.borderColor = '#e5e7eb';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>From Template</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Use a pre-built template to get started quickly</div>
            </button>

            {/* Blank Document Button */}
            <button
              onClick={() => handleMethodSelect('blank')}
              style={{
                padding: 32,
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                const el = e.currentTarget;
                el.style.borderColor = '#3b82f6';
                el.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
              }}
              onMouseOut={e => {
                const el = e.currentTarget;
                el.style.borderColor = '#e5e7eb';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Blank Document</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Start with a blank canvas and customize it</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Template Selection
  if (step === 'template-select') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <button onClick={() => setStep('method')} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: 'transparent', marginBottom: 24 }}>← Back</button>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Choose a Template</h1>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 48 }}>Select a template to get started</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  padding: 24,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#3b82f6';
                  el.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
                }}
                onMouseOut={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#e5e7eb';
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>{template.name}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Template Fields
  if (step === 'template-fields' && selectedTemplate) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <button onClick={() => setStep('template-select')} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: 'transparent', marginBottom: 24 }}>← Back</button>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Fill in {selectedTemplate.name}</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Complete the form to customize your document</p>

          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 32, border: '1px solid #e5e7eb' }}>
            {selectedTemplate.fields.map(field => (
              <div key={field.name} style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <button
              onClick={handleFieldsComplete}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 24,
              }}
            >
              Continue to Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Preview
  if (step === 'preview' && selectedTemplate) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => setStep('template-fields')} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: 'transparent', marginBottom: 24 }}>← Back</button>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Preview Document</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Review your document before adding signers</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Document Preview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 32,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <div dangerouslySetInnerHTML={{
                __html: TEMPLATE_PREVIEWS[selectedTemplate.id]
                  .replace(/\[START_DATE\]/g, formData['startDate'] || '[START_DATE]')
                  .replace(/\[COMPANY_NAME\]/g, formData['companyName'] || '[COMPANY_NAME]')
                  .replace(/\[EMPLOYEE_NAME\]/g, formData['employeeName'] || '[EMPLOYEE_NAME]')
                  .replace(/\[POSITION\]/g, formData['position'] || '[POSITION]')
                  .replace(/\[HOURLY_RATE\]/g, formData['hourlyRate'] || '[HOURLY_RATE]')
                  .replace(/\[TERM\]/g, formData['term'] || '[TERM]')
                  .replace(/\[EFFECTIVE_DATE\]/g, formData['effectiveDate'] || '[EFFECTIVE_DATE]')
                  .replace(/\[DISCLOSING_PARTY\]/g, formData['disclosingParty'] || '[DISCLOSING_PARTY]')
                  .replace(/\[RECEIVING_PARTY\]/g, formData['receivingParty'] || '[RECEIVING_PARTY]')
                  .replace(/\[TERM_YEARS\]/g, formData['termYears'] || '[TERM_YEARS]')
                  .replace(/\[VENDOR_NAME\]/g, formData['vendorName'] || '[VENDOR_NAME]')
                  .replace(/\[CLIENT_NAME\]/g, formData['clientName'] || '[CLIENT_NAME]')
                  .replace(/\[PROJECT_TITLE\]/g, formData['projectTitle'] || '[PROJECT_TITLE]')
                  .replace(/\[PROJECT_VALUE\]/g, formData['projectValue'] || '[PROJECT_VALUE]')
                  .replace(/\[END_DATE\]/g, formData['endDate'] || '[END_DATE]')
                  .replace(/\[CANDIDATE_NAME\]/g, formData['candidateName'] || '[CANDIDATE_NAME]')
                  .replace(/\[SALARY\]/g, formData['salary'] || '[SALARY]')
                  .replace(/\[REPORTING_TO\]/g, formData['reportingTo'] || '[REPORTING_TO]')
              }} style={{ fontSize: 13, lineHeight: 1.6, color: '#374151' }} />
            </div>

            {/* Actions Panel */}
            <div>
              <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, margin: 0 }}>Document Preview</h3>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>TEMPLATE</div>
                  <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 500 }}>{selectedTemplate.name}</div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>FILLED FIELDS</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    {selectedTemplate.fields.map(f => (
                      <div key={f.name} style={{ paddingTop: 6, paddingBottom: 6 }}>
                        <span style={{ color: '#6b7280' }}>{f.label}:</span> {formData[f.name] || '—'}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep('signers')}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Continue to Signers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Signers
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '48px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <button onClick={() => setStep(step === 'signers' && method === 'blank' ? 'method' : 'preview')} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: 'transparent', marginBottom: 24 }}>← Back</button>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Add Signers</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Who needs to sign this document?</p>

        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 32, border: '1px solid #e5e7eb' }}>
          {signers.map((signer, idx) => (
            <div key={signer.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: idx < signers.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', flex: '0 0 auto' }}>Signer #{idx + 1}</div>
                {signers.length > 1 && (
                  <button
                    onClick={() => removeSigner(signer.id)}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 12px',
                      border: '1px solid #ef4444',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={signer.name}
                  onChange={(e) => handleSignerChange(signer.id, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={signer.email}
                  onChange={(e) => handleSignerChange(signer.id, 'email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Signing Order</label>
                <select
                  value={signer.order}
                  onChange={(e) => handleSignerOrderChange(signer.id, parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  {signers.map((_, i) => (
                    <option key={i} value={i}>
                      Signer #{i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={addSigner}
            style={{
              width: '100%',
              padding: '12px 24px',
              border: '2px dashed #3b82f6',
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 32,
            }}
          >
            + Add Signer
          </button>

          <button
            onClick={handleCreate}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✍️ Create & Send for Signature
          </button>
        </div>
      </div>
    </div>
  );
}
