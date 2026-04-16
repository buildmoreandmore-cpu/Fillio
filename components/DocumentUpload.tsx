/**
 * DocumentUpload — File upload component for tax returns and financial documents.
 *
 * Uploads to Supabase Storage (client-documents bucket) and records in
 * document_uploads table. Integrates with document gate to show which
 * documents are required and which have been uploaded.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from './Icon';
import { supabase } from '../lib/supabase';
import {
  checkGlobalCashFlowEligibility,
  type RequiredDocument,
} from '../lib/documentGate';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

type UploadDocType =
  | 'business_tax_return'
  | 'personal_tax_return_1040'
  | 'personal_financial_statement'
  | 'business_tax_return_prior_year'
  | 'personal_tax_return_prior_year'
  | 'debt_schedule'
  | 'other';

interface DocumentSlot {
  type: UploadDocType;
  label: string;
  required: boolean;
  hint: string;
}

const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: 'business_tax_return',
    label: 'Business Tax Return (Current Year)',
    required: true,
    hint: 'Form 1120-S, 1065, or 1120 — most recent year filed',
  },
  {
    type: 'personal_tax_return_1040',
    label: 'Personal Tax Return (1040)',
    required: true,
    hint: 'Form 1040 — guarantor\'s most recent year filed',
  },
  {
    type: 'personal_financial_statement',
    label: 'Personal Financial Statement',
    required: false,
    hint: 'Required for full global cash flow analysis',
  },
  {
    type: 'business_tax_return_prior_year',
    label: 'Business Tax Return (Prior Year)',
    required: false,
    hint: 'Recommended for year-over-year comparison',
  },
  {
    type: 'personal_tax_return_prior_year',
    label: 'Personal Tax Return (Prior Year)',
    required: false,
    hint: 'Recommended for income trend analysis',
  },
  {
    type: 'debt_schedule',
    label: 'Debt Schedule',
    required: false,
    hint: 'List of all business obligations with terms',
  },
];

interface UploadedDoc {
  id: string;
  documentType: UploadDocType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  verified: boolean;
}

interface DocumentUploadProps {
  userId: string;
  submissionId: string | null;
  onGateStatusChange?: (eligible: boolean) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ userId, submissionId, onGateStatusChange }) => {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing uploads
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const query = (supabase as any)
        .from('document_uploads')
        .select('*')
        .eq('user_id', userId);

      if (submissionId) {
        query.eq('submission_id', submissionId);
      }

      const { data } = await query.order('uploaded_at', { ascending: false });
      if (data) {
        setUploadedDocs(
          data.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            documentType: row.document_type as UploadDocType,
            fileName: row.file_name as string,
            fileSize: Number(row.file_size) || 0,
            uploadedAt: row.uploaded_at as string,
            verified: (row.verified as boolean) || false,
          }))
        );
      }
    };
    load();
  }, [userId, submissionId]);

  // Check document gate when uploads change
  useEffect(() => {
    if (!onGateStatusChange) return;
    const docTypes = uploadedDocs.map(d => d.documentType) as RequiredDocument[];
    const { eligible } = checkGlobalCashFlowEligibility(docTypes);
    onGateStatusChange(eligible);
  }, [uploadedDocs, onGateStatusChange]);

  const handleUpload = useCallback(async (file: File, documentType: UploadDocType) => {
    if (!userId) return;
    setUploading(documentType);
    setError(null);

    const filePath = `${userId}/${submissionId || 'unsorted'}/${documentType}/${file.name}`;

    // Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, { upsert: true });

    if (storageError) {
      setError(`Upload failed: ${storageError.message}`);
      setUploading(null);
      return;
    }

    // Record in database
    const { data, error: dbError } = await (supabase as any)
      .from('document_uploads')
      .insert({
        user_id: userId,
        submission_id: submissionId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
      })
      .select('*')
      .single();

    if (dbError) {
      setError(`Record failed: ${dbError.message}`);
      setUploading(null);
      return;
    }

    // Add to local state
    setUploadedDocs(prev => [
      {
        id: data.id,
        documentType: data.document_type,
        fileName: data.file_name,
        fileSize: Number(data.file_size) || 0,
        uploadedAt: data.uploaded_at,
        verified: false,
      },
      ...prev,
    ]);
    setUploading(null);
  }, [userId, submissionId]);

  const getUploadForType = (type: UploadDocType): UploadedDoc | undefined => {
    return uploadedDocs.find(d => d.documentType === type);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="bank" size={18} style={{ color: NAVY }} />
        <h3 className="text-sm font-bold" style={{ color: NAVY }}>
          Required Documents
        </h3>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 mb-3">
          {error}
        </div>
      )}

      {DOCUMENT_SLOTS.map((slot) => {
        const uploaded = getUploadForType(slot.type);
        const isUploading = uploading === slot.type;

        return (
          <div
            key={slot.type}
            className="border rounded-lg p-4 transition-all"
            style={{
              borderColor: uploaded ? `${EMERALD}40` : '#E2E8F0',
              backgroundColor: uploaded ? `${EMERALD}04` : '#FFFFFF',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {uploaded ? (
                    <Icon name="check-circle" size={16} style={{ color: EMERALD }} />
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: slot.required ? NAVY : '#CBD5E1' }}
                    />
                  )}
                  <span className="text-sm font-bold" style={{ color: NAVY }}>
                    {slot.label}
                  </span>
                  {slot.required && !uploaded && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-500">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 ml-6">
                  {slot.hint}
                </p>
                {uploaded && (
                  <div className="flex items-center gap-2 ml-6 mt-2">
                    <span className="text-[11px] text-slate-500 font-medium">{uploaded.fileName}</span>
                    <span className="text-[10px] text-slate-400">({formatFileSize(uploaded.fileSize)})</span>
                    {uploaded.verified && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${EMERALD}15`, color: EMERALD }}
                      >
                        Verified
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Upload button */}
              {!uploaded && (
                <label
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all hover:opacity-80"
                  style={{
                    backgroundColor: isUploading ? '#F1F5F9' : `${NAVY}08`,
                    color: isUploading ? '#94A3B8' : NAVY,
                  }}
                >
                  {isUploading ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                  {isUploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, slot.type);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}

              {/* Replace uploaded file */}
              {uploaded && (
                <label
                  className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                >
                  Replace
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, slot.type);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        );
      })}

      {/* Document gate status */}
      {(() => {
        const docTypes = uploadedDocs.map(d => d.documentType) as RequiredDocument[];
        const { eligible, missing } = checkGlobalCashFlowEligibility(docTypes);
        const requiredUploaded = DOCUMENT_SLOTS.filter(s => s.required && getUploadForType(s.type)).length;
        const requiredTotal = DOCUMENT_SLOTS.filter(s => s.required).length;

        return (
          <div
            className="mt-4 p-4 rounded-lg border text-sm"
            style={{
              backgroundColor: eligible ? `${EMERALD}06` : '#FFFBEB',
              borderColor: eligible ? `${EMERALD}30` : '#FDE68A',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon
                name={eligible ? 'check-circle' : 'shield-check'}
                size={16}
                style={{ color: eligible ? EMERALD : GOLD }}
              />
              <span className="font-bold text-xs" style={{ color: eligible ? EMERALD : GOLD }}>
                {eligible
                  ? 'All required documents uploaded'
                  : `${requiredUploaded} of ${requiredTotal} required documents uploaded`}
              </span>
            </div>
            {!eligible && missing.length > 0 && (
              <p className="text-[11px] text-slate-500 ml-6">
                Still needed: {missing.map(m => m.label).join(', ')}
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default DocumentUpload;
