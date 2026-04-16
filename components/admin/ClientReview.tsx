/**
 * ClientReview — Primary admin work screen for reviewing a client's scorecard.
 *
 * Sections:
 *  A. Client Overview
 *  B. Tax Return Verification (split view — Tier 2/3)
 *  C. Flag Review Queue
 *  D. Scorecard Numbers (Provisional vs Confirmed)
 *  E. Five C's Score Review
 *  F. Lender Targeting (Tier 3 only)
 *  G. Action Plan (Tier 2/3)
 *  H. Confirm & Release
 */

import React, { useState } from 'react';
import { Icon } from '../Icon';
import {
  FLAG_TYPE_LABELS,
  type AdminResolution,
} from '../../lib/adminFlags';
import {
  type AdminClientRecord,
  type ScorecardRecord,
  type FlagRecord,
  type TierKey,
  TIER_LABELS,
  TIER_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  FIVE_CS,
  LENDER_PATHS,
} from '../../lib/adminTypes';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

// ─────────── Helpers ───────────

function fmtDollar(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return n < 0 ? `-${formatted}` : formatted;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────── Section wrapper ───────────

const Section: React.FC<{
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, subtitle, badge, badgeColor, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold" style={{ color: NAVY }}>{title}</h2>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${badgeColor || EMERALD}15`, color: badgeColor || EMERALD }}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
};

// ─────────── InfoCallout ───────────

const InfoCallout: React.FC<{ children: React.ReactNode; variant?: 'default' | 'warning' | 'success' }> = ({
  children, variant = 'default',
}) => {
  const c = {
    default: { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', icon: NAVY },
    warning: { bg: 'rgba(220,68,68,0.04)', border: '#DC4444', text: '#991B1B', icon: '#DC4444' },
    success: { bg: 'rgba(15,138,107,0.04)', border: EMERALD, text: '#065F46', icon: EMERALD },
  }[variant];
  return (
    <div className="flex gap-3 p-4 rounded-lg border text-sm leading-relaxed"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}>
      <Icon name="shield-check" size={18} style={{ color: c.icon, flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  );
};

// ─────────── Tax Return Line Map (for split view) ───────────

const TAX_RETURN_LINES = [
  { key: 'netProfit', label: 'Net Income (Ordinary Business Income)', lineRef: 'Schedule M-1, Line 1' },
  { key: 'interestExpense', label: 'Interest Expense', lineRef: 'Line 13' },
  { key: 'depreciationAndAmortization', label: 'Depreciation & Amortization', lineRef: 'Line 14' },
  { key: 'rentExpense', label: 'Rent Expense', lineRef: 'Line 11' },
  { key: 'officerCompensation', label: 'Compensation of Officers', lineRef: 'Line 7' },
  { key: 'grossReceipts', label: 'Net Sales / Gross Receipts', lineRef: 'Line 1c' },
  { key: 'cogs', label: 'Cost of Goods Sold', lineRef: 'Line 2' },
  { key: 'totalDeductions', label: 'Total Deductions', lineRef: 'Line 20' },
];

// ─────────── Props ───────────

interface ClientReviewProps {
  client: AdminClientRecord;
  scorecard: ScorecardRecord;
  flags: FlagRecord[];
  onBack: () => void;
  onUpdateFlag: (flagId: string, update: {
    adminResolution: AdminResolution;
    adminNote: string;
    overrideValue?: Record<string, unknown>;
  }) => void;
  onUpdateScorecard: (updates: Partial<ScorecardRecord>) => void;
  onUpdateClient: (updates: Partial<AdminClientRecord>) => void;
  onConfirmRelease: () => void;
}

const ClientReview: React.FC<ClientReviewProps> = ({
  client,
  scorecard,
  flags,
  onBack,
  onUpdateFlag,
  onUpdateScorecard,
  onUpdateClient,
  onConfirmRelease,
}) => {
  // ── Local state for editable fields ──
  const [adminNotes, setAdminNotes] = useState(client.adminNotes || '');
  const [actionPlan, setActionPlan] = useState(client.actionPlan || '');
  const [loanAmount, setLoanAmount] = useState('');
  const [lenderPath, setLenderPath] = useState('');
  const [specificLenders, setSpecificLenders] = useState('');
  const [lenderReasoning, setLenderReasoning] = useState('');

  // Five C's override state
  const [fiveCOverrides, setFiveCOverrides] = useState<Record<string, { score: string; note: string }>>({});

  // Flag resolution state
  const [flagEdits, setFlagEdits] = useState<Record<string, { resolution: AdminResolution | ''; note: string }>>({});

  // Tax return upload
  const [taxReturnUrl, setTaxReturnUrl] = useState<string | null>(null);

  const isTier2Plus = client.tier === 'loan_ready' || client.tier === 'approved';
  const isTier3 = client.tier === 'approved';
  const unresolvedFlags = flags.filter((f) => !f.resolved);
  const allFlagsResolved = unresolvedFlags.length === 0;

  // Extract worksheet values from scorecard JSONB for the split view
  const bizData = (scorecard.businessCashFlow || {}) as Record<string, number>;

  // ── Section A: Client Overview ──
  const renderOverview = () => (
    <div className="mt-4">
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Name</div>
          <div className="text-sm font-semibold" style={{ color: NAVY }}>{client.fullName}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</div>
          <div className="text-sm text-slate-600">{client.email}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Business</div>
          <div className="text-sm font-semibold" style={{ color: NAVY }}>{client.businessName || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tier</div>
          {client.tier ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${TIER_COLORS[client.tier]}15`, color: TIER_COLORS[client.tier] }}>
              {TIER_LABELS[client.tier]}
            </span>
          ) : <span className="text-xs text-slate-400">—</span>}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${STATUS_COLORS[scorecard.status]}15`, color: STATUS_COLORS[scorecard.status] }}>
            {STATUS_LABELS[scorecard.status]}
          </span>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Submitted</div>
          <div className="text-sm text-slate-600">{fmtDate(scorecard.createdAt)}</div>
        </div>
      </div>

      {client.isPriority && (
        <div className="mb-4">
          <InfoCallout variant="warning">
            <strong>Priority client (Tier 3)</strong> — This client may have been previously declined.
            Full decline diagnosis and lender targeting required.
          </InfoCallout>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Admin Notes (not visible to client)
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          onBlur={() => onUpdateClient({ adminNotes })}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 resize-y"
          style={{ color: NAVY }}
          placeholder="Private notes about this client..."
        />
      </div>
    </div>
  );

  // ── Section B: Tax Return Verification (Tier 2/3) ──
  const renderTaxReturnVerification = () => (
    <div className="mt-4">
      <div className="mb-4">
        <InfoCallout>
          Compare the client's worksheet entries against their uploaded tax return.
          The most common errors are pulling from the wrong line number.
          Use Column d (end of current year) for all balance sheet figures.
        </InfoCallout>
      </div>

      {/* Upload area */}
      <div className="mb-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Client's Tax Return
        </label>
        {taxReturnUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <Icon name="doc-text" size={20} style={{ color: EMERALD }} />
            <span className="text-sm font-semibold" style={{ color: EMERALD }}>Tax return uploaded</span>
            <button
              onClick={() => setTaxReturnUrl(null)}
              className="ml-auto text-xs font-semibold text-slate-500 hover:text-red-500"
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition-colors"
            onClick={() => {
              // In production: open Supabase Storage file picker
              // For now: placeholder URL
              setTaxReturnUrl('placeholder');
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto mb-2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm text-slate-500 font-semibold">Upload or drag tax return (PDF)</p>
            <p className="text-[11px] text-slate-400 mt-1">Form 1120-S or equivalent</p>
          </div>
        )}
      </div>

      {/* Split view: Worksheet vs Tax Return */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Client worksheet entries */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Client Worksheet Entries
            </div>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="text-left py-2 font-bold">Field</th>
                  <th className="text-left py-2 font-bold">Line</th>
                  <th className="text-right py-2 font-bold">Entered</th>
                </tr>
              </thead>
              <tbody>
                {TAX_RETURN_LINES.map((line) => {
                  const val = bizData[line.key];
                  return (
                    <tr key={line.key} className="border-b border-slate-50">
                      <td className="py-2 text-slate-600 text-xs">{line.label}</td>
                      <td className="py-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          {line.lineRef}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold tabular-nums" style={{ color: NAVY }}>
                        {typeof val === 'number' ? fmtDollar(val) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Tax return viewer */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tax Return (Form 1120-S)
            </div>
          </div>
          <div className="p-4">
            {taxReturnUrl ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                <Icon name="doc-text" size={40} style={{ color: '#CBD5E1' }} />
                <p className="text-sm text-slate-500 mt-3 font-semibold">PDF viewer</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tax return will render here. Check each line number
                  against the client's entries on the left.
                </p>
                <p className="text-[11px] text-slate-400 mt-3">
                  Remember: Use <strong>Column d</strong> (end of current year) only.
                  Ignore Columns a, b, and c.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                <Icon name="doc-add" size={32} style={{ color: '#CBD5E1' }} />
                <p className="text-sm text-slate-400 mt-3">
                  Upload the client's tax return to compare entries side by side.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variance check guidance */}
      <div className="mt-4">
        <InfoCallout>
          <strong>What to spot-check:</strong>
          <br />
          1. Net Income must come from <strong>Schedule M-1, Line 1</strong> — not the front page of the return.
          <br />
          2. Interest, Depreciation, and Rent must match Lines 13, 14, and 11 exactly.
          <br />
          3. If values are off by more than 10%, flag for clarification before confirming.
        </InfoCallout>
      </div>
    </div>
  );

  // ── Section C: Flag Review Queue ──
  const renderFlags = () => (
    <div className="mt-4 space-y-4">
      {flags.length === 0 ? (
        <div className="text-center py-6">
          <Icon name="check-circle" size={32} style={{ color: EMERALD }} />
          <p className="text-sm text-slate-500 mt-2">No flags generated for this scorecard.</p>
        </div>
      ) : (
        flags.map((flag) => {
          const edit = flagEdits[flag.id] || { resolution: flag.adminResolution || '', note: flag.adminNote || '' };
          const isResolved = flag.resolved;

          return (
            <div
              key={flag.id}
              className="rounded-lg border p-4"
              style={{
                borderColor: isResolved ? EMERALD : '#E2E8F0',
                backgroundColor: isResolved ? 'rgba(15,138,107,0.02)' : '#FFFFFF',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: NAVY }}>
                      {FLAG_TYPE_LABELS[flag.flagType] || flag.flagType}
                    </span>
                    {isResolved && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${EMERALD}15`, color: EMERALD }}>
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{flag.flagDescription}</p>
                </div>
              </div>

              {/* Client input */}
              {flag.clientInput && Object.keys(flag.clientInput).length > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Client Input
                  </div>
                  <div className="text-sm text-slate-600">
                    {Object.entries(flag.clientInput).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k.replace(/_/g, ' ')}:</span>
                        <span className="font-semibold" style={{ color: NAVY }}>
                          {typeof v === 'number' ? fmtDollar(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution options */}
              {!isResolved && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Admin Decision
                  </div>
                  <div className="space-y-2 mb-3">
                    {([
                      { value: 'confirmed' as AdminResolution, label: 'Confirm — accept client input as-is' },
                      { value: 'override' as AdminResolution, label: 'Override — adjust the value with a note' },
                      { value: 'request_info' as AdminResolution, label: 'Request more info from client' },
                    ]).map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: edit.resolution === opt.value ? NAVY : '#CBD5E1' }}
                        >
                          {edit.resolution === opt.value && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NAVY }} />
                          )}
                        </div>
                        <input
                          type="radio"
                          name={`flag-${flag.id}`}
                          value={opt.value}
                          checked={edit.resolution === opt.value}
                          onChange={() => setFlagEdits((prev) => ({
                            ...prev,
                            [flag.id]: { ...edit, resolution: opt.value },
                          }))}
                          className="sr-only"
                        />
                        <span className="text-xs font-medium text-slate-600">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Note field */}
                  <textarea
                    value={edit.note}
                    onChange={(e) => setFlagEdits((prev) => ({
                      ...prev,
                      [flag.id]: { ...edit, note: e.target.value },
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-y mb-3"
                    style={{ color: NAVY }}
                    placeholder="Admin note (required for overrides)..."
                  />

                  <button
                    onClick={() => {
                      if (!edit.resolution) return;
                      onUpdateFlag(flag.id, {
                        adminResolution: edit.resolution as AdminResolution,
                        adminNote: edit.note,
                      });
                    }}
                    disabled={!edit.resolution}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
                    style={{ backgroundColor: NAVY }}
                  >
                    Save Resolution
                  </button>
                </div>
              )}

              {/* Already resolved display */}
              {isResolved && (
                <div className="text-xs text-slate-500">
                  <span className="font-bold">Resolution:</span> {flag.adminResolution}
                  {flag.adminNote && <span className="ml-2">— {flag.adminNote}</span>}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // ── Section D: Scorecard Numbers ──
  const renderScorecardNumbers = () => {
    const overrides = (scorecard.confirmedOverrides || {}) as Record<string, number>;

    const rows = [
      { label: 'Net Profit', key: 'netProfit', sublabel: 'Schedule M-1, Line 1' },
      { label: 'Interest Expense', key: 'interestExpense', sublabel: 'Line 13', prefix: '+' },
      { label: 'Depreciation & Amort.', key: 'depreciationAndAmortization', sublabel: 'Line 14', prefix: '+' },
      { label: 'One-time Income (@70%)', key: 'oneTimeIncomeDiscounted', prefix: '-' },
      { label: 'One-time Expenses (@70%)', key: 'oneTimeExpensesDiscounted', prefix: '+' },
      { label: 'Rent Addback (@70%)', key: 'rentAddback70pct', prefix: '+' },
      { label: 'Owner Withdrawals', key: 'ownerWithdrawals', prefix: '-' },
      { label: 'Tax Adjustment (30%)', key: 'taxAdjustment30pct', prefix: '-' },
    ];

    return (
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                <th className="text-left py-2 font-bold">Line Item</th>
                <th className="text-right py-2 font-bold">Provisional</th>
                <th className="text-right py-2 font-bold">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const provisional = typeof bizData[row.key] === 'number' ? bizData[row.key] : 0;
                const confirmed = overrides[row.key] !== undefined ? overrides[row.key] : provisional;
                const changed = overrides[row.key] !== undefined;
                return (
                  <tr key={row.key} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-600">
                      {row.prefix && <span className="text-slate-400 mr-1">{row.prefix}</span>}
                      {row.label}
                      {row.sublabel && (
                        <span className="ml-1 text-[10px] font-bold text-slate-400">{row.sublabel}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-bold tabular-nums" style={{ color: NAVY }}>
                      {fmtDollar(provisional as number)}
                    </td>
                    <td className="py-2.5 text-right font-bold tabular-nums"
                      style={{ color: changed ? EMERALD : NAVY }}>
                      {allFlagsResolved ? fmtDollar(confirmed as number) : (
                        <span className="text-xs text-slate-400 italic">Pending flags</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300">
                <td className="py-3 font-bold" style={{ color: NAVY }}>Business Cash Flow</td>
                <td className="py-3 text-right text-lg font-bold tabular-nums" style={{ color: NAVY }}>
                  {fmtDollar((bizData.total as number) || 0)}
                </td>
                <td className="py-3 text-right text-lg font-bold tabular-nums"
                  style={{ color: allFlagsResolved ? EMERALD : '#94A3B8' }}>
                  {allFlagsResolved ? fmtDollar((bizData.total as number) || 0) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* DSCR comparison */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              DSCR (Provisional)
            </div>
            <div className="text-2xl font-bold" style={{ color: GOLD }}>
              {scorecard.businessDscr > 0 ? `${scorecard.businessDscr.toFixed(2)}x` : '—'}
            </div>
          </div>
          <div className="p-4 rounded-lg border-2 text-center"
            style={{ borderColor: allFlagsResolved ? EMERALD : '#E2E8F0' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              DSCR (Confirmed)
            </div>
            <div className="text-2xl font-bold" style={{ color: allFlagsResolved ? EMERALD : '#94A3B8' }}>
              {allFlagsResolved && scorecard.businessDscr > 0
                ? `${scorecard.businessDscr.toFixed(2)}x` : 'Pending'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Section E: Five C's ──
  const renderFiveCs = () => (
    <div className="mt-4 space-y-3">
      {FIVE_CS.map((c) => {
        const score = (scorecard as Record<string, unknown>)[`${c.key}Score`] as number || 0;
        const override = fiveCOverrides[c.key] || { score: '', note: '' };
        return (
          <div key={c.key} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: NAVY }}>{c.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: NAVY }}>
                  {score}/{c.maxScore}
                </span>
              </div>
              {/* Override inputs */}
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max={c.maxScore}
                  placeholder="Override"
                  value={override.score}
                  onChange={(e) => setFiveCOverrides((prev) => ({
                    ...prev,
                    [c.key]: { ...override, score: e.target.value },
                  }))}
                  className="w-20 px-2 py-1.5 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  style={{ color: NAVY }}
                />
                <input
                  type="text"
                  placeholder="Note (required for override)"
                  value={override.note}
                  onChange={(e) => setFiveCOverrides((prev) => ({
                    ...prev,
                    [c.key]: { ...override, note: e.target.value },
                  }))}
                  className="flex-grow px-2 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  style={{ color: NAVY }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Overall score */}
      <div className="pt-3 mt-3 border-t-2 border-slate-300 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Overall Score</div>
        <div className="text-3xl font-bold" style={{ color: NAVY }}>{scorecard.overallScore}/100</div>
      </div>
    </div>
  );

  // ── Section F: Lender Targeting (Tier 3) ──
  const renderLenderTargeting = () => (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Loan Amount
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100"
            style={{ color: NAVY }}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Recommended Path
        </label>
        <div className="space-y-2">
          {LENDER_PATHS.map((path) => (
            <label key={path} className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: lenderPath === path ? NAVY : '#CBD5E1' }}>
                {lenderPath === path && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NAVY }} />
                )}
              </div>
              <input type="radio" name="lenderPath" value={path}
                checked={lenderPath === path}
                onChange={() => setLenderPath(path)}
                className="sr-only" />
              <span className="text-sm text-slate-600">{path}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Specific Lender Recommendations
        </label>
        <textarea
          value={specificLenders}
          onChange={(e) => setSpecificLenders(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-y"
          style={{ color: NAVY }}
          placeholder="Based on the full picture, recommend specific lenders..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Why This Path
        </label>
        <textarea
          value={lenderReasoning}
          onChange={(e) => setLenderReasoning(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-y"
          style={{ color: NAVY }}
          placeholder="Explain the reasoning for this recommendation..."
        />
      </div>

      <button
        onClick={() => onUpdateClient({
          lenderRecommendations: [{
            loanAmount: parseInt(loanAmount) || 0,
            recommendedPath: lenderPath,
            specificLenders,
            reasoning: lenderReasoning,
          }],
        })}
        className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
        style={{ backgroundColor: NAVY }}
      >
        Save Lender Targeting
      </button>
    </div>
  );

  // ── Section G: Action Plan ──
  const renderActionPlan = () => (
    <div className="mt-4">
      <div className="mb-3">
        <InfoCallout>
          Write the client's personalized action plan. This will be included in their confirmed report.
          Suggested sections: What's Working, What Needs Attention, Recommended Next Steps, Timeline.
        </InfoCallout>
      </div>
      <textarea
        value={actionPlan}
        onChange={(e) => setActionPlan(e.target.value)}
        onBlur={() => onUpdateClient({ actionPlan })}
        rows={12}
        className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-y"
        style={{ color: NAVY }}
        placeholder={`Action Plan for ${client.fullName}\n\n## What's Working\n\n## What Needs Attention Before You Apply\n\n## Recommended Next Steps\n1. \n2. \n3. \n\n## Timeline to Application-Ready`}
      />
    </div>
  );

  // ── Section H: Confirm & Release ──
  const renderConfirmRelease = () => {
    const checks = [
      { label: `All ${flags.length} flag${flags.length !== 1 ? 's' : ''} resolved`, done: allFlagsResolved },
      { label: 'Scorecard confirmed', done: allFlagsResolved },
      ...(isTier3 ? [
        { label: 'Lender targeting complete', done: !!lenderPath },
        { label: 'Action plan written', done: actionPlan.length > 50 },
      ] : []),
      ...(isTier2Plus && !isTier3 ? [
        { label: 'Action plan written', done: actionPlan.length > 50 },
      ] : []),
    ];
    const allDone = checks.every((c) => c.done);

    return (
      <div className="mt-4">
        <div className="space-y-2 mb-5">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center gap-2">
              {check.done ? (
                <Icon name="check-circle" size={18} style={{ color: EMERALD }} />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300" />
              )}
              <span className={`text-sm ${check.done ? 'font-semibold' : 'text-slate-400'}`}
                style={check.done ? { color: NAVY } : undefined}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        {allDone ? (
          <div>
            <button
              onClick={onConfirmRelease}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: EMERALD }}
            >
              Confirm & Release Report to Client
            </button>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              This will update the scorecard to 'confirmed', send the report email to the client,
              and unlock the confirmed report in their dashboard.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Complete all items above before releasing the report.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Back + client name header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to clients
        </button>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{client.fullName}</h1>
        <p className="text-sm text-slate-500">{client.businessName} — {client.email}</p>
      </div>

      {/* Sections */}
      <Section title="Client Overview" subtitle="Profile and admin notes">
        {renderOverview()}
      </Section>

      {isTier2Plus && (
        <Section
          title="Tax Return Verification"
          subtitle="Compare worksheet entries against the uploaded tax return"
          badge="TIER 2+"
          badgeColor="#3B82F6"
        >
          {renderTaxReturnVerification()}
        </Section>
      )}

      <Section
        title="Flag Review"
        subtitle={`${unresolvedFlags.length} unresolved flag${unresolvedFlags.length !== 1 ? 's' : ''}`}
        badge={unresolvedFlags.length > 0 ? `${unresolvedFlags.length} open` : 'Clear'}
        badgeColor={unresolvedFlags.length > 0 ? GOLD : EMERALD}
      >
        {renderFlags()}
      </Section>

      <Section title="Scorecard Numbers" subtitle="Provisional vs Confirmed values">
        {renderScorecardNumbers()}
      </Section>

      <Section title="Five C's Score Review" subtitle="Override any score with a documented note">
        {renderFiveCs()}
      </Section>

      {isTier3 && (
        <Section
          title="Lender Targeting"
          subtitle="Loan path recommendation for this client"
          badge="TIER 3"
          badgeColor={GOLD}
        >
          {renderLenderTargeting()}
        </Section>
      )}

      {isTier2Plus && (
        <Section
          title="Action Plan"
          subtitle="Personalized plan included in confirmed report"
          badge={isTier3 ? 'TIER 3' : 'TIER 2'}
          badgeColor={isTier3 ? GOLD : EMERALD}
        >
          {renderActionPlan()}
        </Section>
      )}

      <Section title="Confirm & Release" subtitle="Finalize and send the report to the client">
        {renderConfirmRelease()}
      </Section>
    </div>
  );
};

export default ClientReview;
