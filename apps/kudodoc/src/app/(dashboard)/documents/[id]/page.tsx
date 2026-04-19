'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Bell,
  Edit3,
  Send,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  Calendar,
  Activity,
  PenTool,
  X,
} from 'lucide-react';

// --- Mock Data ---
const MOCK_DOCUMENT = {
  id: 'doc-1',
  title: 'Employment Agreement - Alex Johnson',
  status: 'PENDING_SIGNATURE',
  template: { name: 'Employment Agreement' },
  createdBy: { name: 'Sarah Davis' },
  createdAt: '2026-03-25T10:00:00Z',
  updatedAt: '2026-03-25T10:00:00Z',
  content: `<h1>Employment Agreement</h1>
<p>This Employment Agreement ("Agreement") is entered into as of <strong>March 27, 2026</strong>, by and between:</p>
<p><strong>InherentTech Solutions LLC</strong> ("Company"), and<br/><strong>Alex Johnson</strong> ("Employee").</p>
<h2>1. Position & Duties</h2>
<p>Employee shall serve as <strong>Senior Java Developer</strong> and shall perform duties as assigned by the Company, including but not limited to software development, code review, and technical leadership.</p>
<h2>2. Compensation</h2>
<p>Employee shall be compensated at a rate of <strong>$85.00 per hour</strong>, paid bi-weekly. Overtime shall be compensated at 1.5x the regular rate for hours exceeding 40 per week.</p>
<h2>3. Term</h2>
<p>This Agreement shall commence on <strong>April 1, 2026</strong> and continue for a period of <strong>6 months</strong>, unless terminated earlier in accordance with Section 6.</p>
<h2>4. Benefits</h2>
<p>Employee shall be eligible for health insurance, 401(k), and paid time off as outlined in the Company's benefits package.</p>
<h2>5. Confidentiality</h2>
<p>Employee agrees to maintain the confidentiality of all proprietary information and trade secrets of the Company and its clients.</p>
<h2>6. Termination</h2>
<p>Either party may terminate this Agreement with 14 days written notice. The Company may terminate immediately for cause.</p>
<h2>7. Governing Law</h2>
<p>This Agreement shall be governed by the laws of the State of Texas.</p>`,
  signatureRequests: [
    { id: 'sig-1', signerName: 'Alex Johnson', signerEmail: 'alex@email.com', status: 'PENDING', order: 1, signedAt: null },
    { id: 'sig-2', signerName: 'Sandeep Saroha', signerEmail: 'sandeep@inherenttech.com', status: 'SIGNED', order: 0, signedAt: '2026-03-25T11:00:00Z' },
  ],
  auditTrail: [
    { action: 'Document created', actorName: 'Sarah Davis', createdAt: '2026-03-25T10:00:00Z', metadata: {} },
    { action: 'Sent for signature to Alex Johnson, Sandeep Saroha', actorName: 'Sarah Davis', createdAt: '2026-03-25T10:05:00Z', metadata: {} },
    { action: 'Document signed', actorName: 'Sandeep Saroha', createdAt: '2026-03-25T11:00:00Z', metadata: { ipAddress: '192.168.1.100' } },
    { action: 'Reminder sent to Alex Johnson', actorName: 'System', createdAt: '2026-03-26T09:00:00Z', metadata: {} },
  ],
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_SIGNATURE: 'bg-amber-100 text-amber-700',
  PARTIALLY_SIGNED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  PARTIALLY_SIGNED: 'Partially Signed',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'document' | 'signatures' | 'audit'>('document');
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('type');
  const [typedSignature, setTypedSignature] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doc = MOCK_DOCUMENT;
  const pendingSignatures = doc.signatureRequests.filter((s) => s.status === 'PENDING');
  const completedSignatures = doc.signatureRequests.filter((s) => s.status === 'SIGNED');

  const handleSign = () => {
    if (!consentChecked) return;
    setSigned(true);
    setShowSignDialog(false);
    setTypedSignature('');
    setConsentChecked(false);
    setSignatureType('type');
  };

  const handleCanvasStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1f2937';
      ctx.stroke();
    }
  };

  const handleCanvasEnd = () => setIsDrawing(false);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/documents')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Bell className="w-4 h-4" />
              Send Reminder
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Shield className="w-4 h-4" />
              Verify
            </button>
            {doc.status === 'DRAFT' && (
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <Send className="w-4 h-4" />
                Send for Signature
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document content (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 min-h-[500px]">
            <div
              className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: doc.content }}
            />

            {signed && (
              <div className="mt-12 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl italic font-serif text-gray-900 mb-2">
                    {typedSignature || 'Alex Johnson'}
                  </p>
                  <p className="text-xs text-gray-500">Alex Johnson</p>
                  <p className="text-xs text-gray-400">Signed: {formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sign button */}
          {!signed && pendingSignatures.length > 0 && (
            <button
              onClick={() => setShowSignDialog(true)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              Sign Now
            </button>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['document', 'signatures', 'audit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors text-center
                  ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab === 'document' ? 'Details' : tab === 'signatures' ? 'Signatures' : 'Audit Trail'}
              </button>
            ))}
          </div>

          {/* Details */}
          {activeTab === 'document' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              <DetailRow icon={FileText} label="Template" value={doc.template.name} />
              <DetailRow icon={User} label="Created By" value={doc.createdBy.name} />
              <DetailRow icon={Calendar} label="Created" value={formatDate(doc.createdAt)} />
              <DetailRow icon={Clock} label="Last Updated" value={formatDate(doc.updatedAt)} />
            </div>
          )}

          {/* Signatures */}
          {activeTab === 'signatures' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              {completedSignatures.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Signed</p>
                  <div className="space-y-3">
                    {completedSignatures.map((sig) => (
                      <div key={sig.id} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sig.signerName}</p>
                          <p className="text-xs text-gray-500">{sig.signerEmail}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            Signed {formatDate(sig.signedAt!)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pendingSignatures.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending</p>
                  <div className="space-y-3">
                    {pendingSignatures.map((sig) => (
                      <div key={sig.id} className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sig.signerName}</p>
                          <p className="text-xs text-gray-500">{sig.signerEmail}</p>
                          <p className="text-xs text-amber-600 font-medium mt-0.5">Awaiting signature</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="space-y-0">
                {doc.auditTrail.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                          entry.action.toLowerCase().includes('signed')
                            ? 'bg-emerald-500'
                            : entry.action.toLowerCase().includes('reminder')
                            ? 'bg-amber-400'
                            : 'bg-blue-500'
                        }`}
                      />
                      {idx < doc.auditTrail.length - 1 && (
                        <div className="w-px h-10 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">by {entry.actorName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Dialog Modal */}
      {showSignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Sign Document</h3>
              <button
                onClick={() => setShowSignDialog(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Signature type tabs */}
            <div className="flex gap-2 mb-6">
              {(['type', 'draw', 'upload'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSignatureType(type);
                    if (type === 'draw') clearCanvas();
                  }}
                  className={`
                    flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors
                    ${
                      signatureType === type
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }
                  `}
                >
                  {type === 'type' ? 'Type' : type === 'draw' ? 'Draw' : 'Upload'}
                </button>
              ))}
            </div>

            {/* Type */}
            {signatureType === 'type' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {typedSignature && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <p className="text-3xl italic font-serif text-gray-900">{typedSignature}</p>
                  </div>
                )}
              </div>
            )}

            {/* Draw */}
            {signatureType === 'draw' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Draw Your Signature</label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  onMouseDown={handleCanvasStart}
                  onMouseMove={handleCanvasMove}
                  onMouseUp={handleCanvasEnd}
                  onMouseLeave={handleCanvasEnd}
                  className="w-full border-2 border-gray-200 rounded-lg bg-gray-50 cursor-crosshair"
                />
                <button
                  onClick={clearCanvas}
                  className="mt-3 px-4 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Upload */}
            {signatureType === 'upload' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Signature Image</label>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Click to upload or drag and drop
                </button>
              </div>
            )}

            {/* Consent */}
            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                I agree that this constitutes my legal signature for this document. This signature is
                equivalent to my handwritten signature.
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignDialog(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={!consentChecked || (signatureType === 'type' && !typedSignature)}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2
                  ${
                    !consentChecked || (signatureType === 'type' && !typedSignature)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }
                `}
              >
                <PenTool className="w-4 h-4" />
                Sign Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {signed && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl shadow-lg text-sm font-semibold animate-pulse">
          <CheckCircle2 className="w-5 h-5" />
          Document signed successfully!
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
