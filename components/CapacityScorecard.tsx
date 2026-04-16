/**
 * CapacityScorecard — "Your Cash Flow" factor of the loan readiness program.
 *
 * Implements:
 *  - Tax year selection (single year, no averaging)
 *  - EBIDA inputs mapped to IRS Form 1120-S line numbers
 *  - Rent addback (owner-occupied only, Line 11)
 *  - Multi-row debt obligations (7 types + graded exceptions)
 *  - DSCR calculation + color-coded result display
 *  - SBA negative-cash-flow warning
 */

import React, { useMemo, useState } from 'react';
import { Icon } from './Icon';
import {
  type DebtObligation,
  type DebtType,
  DEBT_TYPE_LABELS,
  calculateAnnualDebtService,
  calculateTotalAnnualDebtService,
  getCalculationDescription,
  getFieldLabel,
  getRequiredField,
  supportsGraded,
} from '../lib/debtService';
import {
  type PropertySituation,
  calculateDSCR,
  calculateRentAddback,
  dscrBand,
  scoreDSCR,
} from '../lib/dscr';
import {
  calculateEBIDA,
  calculateAdjustedCashFlow,
  TAX_FIELD_MAP,
} from '../lib/ebida';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

interface CapacityScorecardProps {
  onBack: () => void;
  userTier?: 'free' | 'tier1' | 'tier2' | 'tier3';
  onUpgrade?: () => void;
}

// ─────────── Currency formatter ───────────

function fmtDollar(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

// ─────────── Inline info callout ───────────

const InfoCallout: React.FC<{ children: React.ReactNode; variant?: 'default' | 'warning' }> = ({
  children,
  variant = 'default',
}) => {
  const isWarning = variant === 'warning';
  return (
    <div
      className="flex gap-3 p-4 rounded-lg border text-sm leading-relaxed"
      style={{
        backgroundColor: isWarning ? 'rgba(220,68,68,0.04)' : '#F8FAFC',
        borderColor: isWarning ? '#DC4444' : '#E2E8F0',
        color: isWarning ? '#991B1B' : '#475569',
      }}
    >
      <Icon
        name={isWarning ? 'shield-check' : 'shield-check'}
        size={18}
        style={{ color: isWarning ? '#DC4444' : NAVY, flexShrink: 0, marginTop: 2 }}
      />
      <div>{children}</div>
    </div>
  );
};

// ─────────── Currency input with tax return guidance ───────────

const TaxCurrencyInput: React.FC<{
  label: string;
  lineRef: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, lineRef, hint, value, onChange }) => (
  <div>
    <label className="block text-sm font-bold mb-0.5" style={{ color: NAVY }}>
      {label}
      {lineRef && (
        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
          {lineRef}
        </span>
      )}
    </label>
    <p className="text-[11px] text-slate-400 mb-2">
      {hint}
    </p>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={value === 0 ? '' : value.toLocaleString('en-US')}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9-]/g, '');
          onChange(raw ? parseInt(raw, 10) : 0);
        }}
        className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
        style={{ color: NAVY }}
      />
    </div>
  </div>
);

// ─────────── Basic currency input (for debt section / rent) ───────────

const CurrencyInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder || '0'}
        value={value === 0 ? '' : value.toLocaleString('en-US')}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw ? parseInt(raw, 10) : 0);
        }}
        className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
        style={{ color: NAVY }}
      />
    </div>
  </div>
);

// ─────────── Main component ───────────

const CapacityScorecard: React.FC<CapacityScorecardProps> = ({ onBack, userTier = 'free', onUpgrade }) => {
  const isPaid = userTier !== 'free';
  const currentYear = new Date().getFullYear();

  // ── Section A: Tax Year ──
  const [taxYear, setTaxYear] = useState(currentYear - 1);

  // ── Section B: EBIDA Inputs (tax return mapped) ──
  const [netIncome, setNetIncome] = useState(0);
  const [interestExpense, setInterestExpense] = useState(0);
  const [depreciation, setDepreciation] = useState(0);
  const [amortization, setAmortization] = useState(0);

  // ── Section C: Rent Addback ──
  const [propertySituation, setPropertySituation] = useState<PropertySituation | null>(null);
  const [rentOnFinancials, setRentOnFinancials] = useState<boolean | null>(null);
  const [annualRent, setAnnualRent] = useState(0);

  // ── Section D: Debts ──
  const [debts, setDebts] = useState<DebtObligation[]>([]);

  const addDebt = () =>
    setDebts((d) => [
      ...d,
      {
        id: Math.random().toString(36).slice(2, 9),
        type: 'mortgage',
        isGraded: false,
      },
    ]);

  const updateDebt = (id: string, patch: Partial<DebtObligation>) =>
    setDebts((d) =>
      d.map((debt) =>
        debt.id === id ? { ...debt, ...patch } : debt
      )
    );

  const removeDebt = (id: string) =>
    setDebts((d) => d.filter((debt) => debt.id !== id));

  // ── State setters map (for TAX_FIELD_MAP iteration) ──
  const fieldValues: Record<string, number> = {
    netIncome,
    interestExpense,
    depreciationExpense: depreciation,
    amortizationExpense: amortization,
  };

  const fieldSetters: Record<string, (v: number) => void> = {
    netIncome: setNetIncome,
    interestExpense: setInterestExpense,
    depreciationExpense: setDepreciation,
    amortizationExpense: setAmortization,
  };

  // ── Calculations (all derived, no separate "calculate" button) ──

  const rentAddback = useMemo(
    () =>
      calculateRentAddback({
        propertySituation: propertySituation ?? 'rents',
        rentAppearsOnFinancials: rentOnFinancials ?? false,
        annualRentExpense: annualRent,
      }),
    [propertySituation, rentOnFinancials, annualRent]
  );

  const ebida = useMemo(
    () =>
      calculateEBIDA({
        netIncome,
        interestExpense,
        depreciationExpense: depreciation,
        amortizationExpense: amortization,
      }),
    [netIncome, interestExpense, depreciation, amortization]
  );

  const adjustedCashFlow = calculateAdjustedCashFlow(ebida, rentAddback);

  const totalDebtService = useMemo(
    () => calculateTotalAnnualDebtService(debts),
    [debts]
  );

  const dscr = useMemo(
    () => calculateDSCR(adjustedCashFlow, totalDebtService),
    [adjustedCashFlow, totalDebtService]
  );

  const band = dscrBand(dscr);
  const dscrPoints = scoreDSCR(dscr);
  const sbaEligible = ebida > 0;

  const hasIncome = netIncome !== 0 || depreciation > 0 || amortization > 0 || interestExpense > 0;
  const hasDebts = debts.length > 0;
  const showResults = hasIncome && hasDebts;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: NAVY }}
            >
              <Icon name="dollar" size={22} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: EMERALD }}>
                Loan Readiness Scorecard
              </div>
              <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
                Your Business Cash Flow
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
            This section calculates your Debt Service Coverage Ratio (DSCR) using your business
            tax return. DSCR tells banks whether your business generates enough cash to service
            a new loan. Goal: 1.25x or higher.
          </p>
        </div>

        {/* ── Section A: Tax Year ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-bold mb-1" style={{ color: NAVY }}>
            Which tax year are you working from?
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Use the most recent completed tax year. We calculate from a single year — no averaging.
          </p>
          <div className="flex gap-3">
            {[currentYear - 1, currentYear - 2].map((yr) => (
              <button
                key={yr}
                onClick={() => setTaxYear(yr)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold border transition-all"
                style={{
                  backgroundColor: taxYear === yr ? NAVY : '#FFFFFF',
                  color: taxYear === yr ? '#FFFFFF' : '#475569',
                  borderColor: taxYear === yr ? NAVY : '#E2E8F0',
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </section>

        {/* ── Section B: EBIDA Inputs (Tax Return Mapped) ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-bold mb-1" style={{ color: NAVY }}>
            Your Business Tax Return ({taxYear})
          </h2>
          <p className="text-xs text-slate-500 mb-1">
            Pull these figures from your {taxYear} Form 1120-S (S-Corp) tax return.
            Use Column d (end of current year) for all figures.
          </p>
          <p className="text-[11px] text-slate-400 mb-5">
            Each field shows the exact line number where you'll find it.
          </p>

          <div className="space-y-5">
            {TAX_FIELD_MAP.map((field) => (
              <TaxCurrencyInput
                key={field.key}
                label={field.label}
                lineRef={field.lineRef}
                hint={field.hint}
                value={fieldValues[field.key]}
                onChange={fieldSetters[field.key]}
              />
            ))}
          </div>

          {/* EBIDA summary line — number gated for free users */}
          {hasIncome && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Business Cash Flow (EBIDA)
              </span>
              {isPaid ? (
                <span className="text-lg font-bold" style={{ color: NAVY }}>
                  {fmtDollar(ebida)}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-200 blur-[6px] select-none" aria-hidden="true">
                    $000,000
                  </span>
                  <Icon name="lock" size={14} style={{ color: '#CBD5E1' }} />
                </div>
              )}
            </div>
          )}

          {/* Guidance callout — institutional context, gated for paid users */}
          {isPaid && (
            <div className="mt-5">
              <InfoCallout>
                <strong>Why we add back interest, depreciation, and amortization</strong>
                <br />
                Your tax return shows net income after these expenses — but interest, depreciation,
                and amortization aren't cash leaving your business the same way payroll or rent does.
                Banks add them back to get a clearer picture of the actual cash your business
                generates. We do the same.
              </InfoCallout>
            </div>
          )}

          {/* SBA negative cash flow warning — gated */}
          {isPaid && hasIncome && ebida < 0 && (
            <div className="mt-4">
              <InfoCallout variant="warning">
                <strong>Important about SBA</strong>
                <br />
                An SBA guaranty can help with collateral shortfalls, but it cannot fix negative
                cash flow. Your business cash flow must be positive to qualify for SBA programs.
                Let's focus on understanding what's driving the shortfall first.
              </InfoCallout>
            </div>
          )}
        </section>

        {/* ── Section C: Rent Addback ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-bold mb-1" style={{ color: NAVY }}>
            Property situation
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Does your business currently pay rent for its operating location?
          </p>

          <div className="space-y-2 mb-5">
            {([
              { value: 'rents' as PropertySituation, label: 'We rent/lease from a landlord' },
              { value: 'owns_same_entity' as PropertySituation, label: 'We own the building (same entity or personally)' },
              { value: 'owns_separate_entity' as PropertySituation, label: 'We own the building through a separate holding entity (e.g. LLC)' },
              { value: 'remote' as PropertySituation, label: 'We operate remotely / no physical location' },
            ]).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                style={{
                  borderColor: propertySituation === opt.value ? NAVY : '#E2E8F0',
                  backgroundColor: propertySituation === opt.value ? 'rgba(11,37,69,0.03)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="propertySituation"
                  value={opt.value}
                  checked={propertySituation === opt.value}
                  onChange={() => {
                    setPropertySituation(opt.value);
                    setRentOnFinancials(null);
                    setAnnualRent(0);
                  }}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: propertySituation === opt.value ? NAVY : '#CBD5E1' }}
                >
                  {propertySituation === opt.value && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NAVY }} />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Guidance text */}
          {propertySituation === 'rents' && (
            <InfoCallout>
              Your rent is real cash leaving the business — it stays in your expense calculation.
              No addback applies here.
            </InfoCallout>
          )}

          {propertySituation === 'owns_separate_entity' && (
            <InfoCallout>
              Even though you control both entities, the rent your operating business pays to your
              holding entity is real cash leaving the borrowing entity. Banks treat this as a genuine
              expense — no addback applies. This is the rule most people miss.
            </InfoCallout>
          )}

          {propertySituation === 'remote' && (
            <InfoCallout>
              No rent adjustment applies. We'll calculate your cash flow without it.
            </InfoCallout>
          )}

          {/* Owner follow-up: does rent appear on financials? */}
          {propertySituation === 'owns_same_entity' && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Does rent or an occupancy expense appear as a line item on your tax return?
              </p>
              <div className="space-y-2 mb-4">
                {([
                  { value: true, label: 'Yes — it shows up as an expense on our return' },
                  { value: false, label: 'No — it does not appear on our return' },
                ]).map((opt) => (
                  <label
                    key={String(opt.value)}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={{
                      borderColor: rentOnFinancials === opt.value ? NAVY : '#E2E8F0',
                      backgroundColor: rentOnFinancials === opt.value ? 'rgba(11,37,69,0.03)' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="radio"
                      name="rentOnFinancials"
                      checked={rentOnFinancials === opt.value}
                      onChange={() => setRentOnFinancials(opt.value)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: rentOnFinancials === opt.value ? NAVY : '#CBD5E1' }}
                    >
                      {rentOnFinancials === opt.value && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NAVY }} />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Annual rent input — references Line 11 */}
              {rentOnFinancials === true && (
                <div className="mb-4">
                  <CurrencyInput
                    label="Annual rent expense (Line 11 of your business tax return)"
                    value={annualRent}
                    onChange={setAnnualRent}
                  />
                </div>
              )}

              {/* Owner guidance */}
              {rentOnFinancials === true && (
                <InfoCallout>
                  Since you own your building, that rent expense isn't actually leaving your
                  business. We'll add it back to your available cash flow — this can meaningfully
                  improve your debt coverage ratio.
                </InfoCallout>
              )}

              {rentOnFinancials === false && (
                <InfoCallout>
                  No adjustment needed. Since it was never recorded as an expense, there's
                  nothing to add back.
                </InfoCallout>
              )}
            </div>
          )}

          {/* Addback summary — dollar amounts gated */}
          {rentAddback > 0 && (
            <div
              className="mt-5 p-4 rounded-lg border"
              style={{ borderColor: EMERALD, backgroundColor: 'rgba(15,138,107,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon name="check-circle" size={16} style={{ color: EMERALD }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: EMERALD }}>
                  Owner-occupied property adjustment applied
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {isPaid ? (
                  <>We added back <strong>{fmtDollar(rentAddback)}</strong> in owner-occupied rent expense to your cash flow.</>
                ) : (
                  <>Your owner-occupied rent expense has been added back to your cash flow calculation.</>
                )}
              </p>
              {isPaid && (
                <div className="mt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">
                    Adjusted Business Cash Flow
                  </span>
                  <span style={{ color: NAVY }}>{fmtDollar(adjustedCashFlow)}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Section D: Debt Obligations ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-bold mb-1" style={{ color: NAVY }}>
            Your existing debt obligations
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Add every business debt obligation — mortgages, leases, term loans, lines of credit, and business credit cards.
          </p>

          {/* Debt rows */}
          {debts.map((debt, idx) => {
            const field = getRequiredField(debt.type, debt.isGraded);
            const annual = calculateAnnualDebtService(debt);
            const showGraded = supportsGraded(debt.type);

            return (
              <div
                key={debt.id}
                className="p-4 mb-4 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Debt #{idx + 1}
                  </span>
                  <button
                    onClick={() => removeDebt(debt.id)}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Debt Type
                    </label>
                    <select
                      value={debt.type}
                      onChange={(e) =>
                        updateDebt(debt.id, {
                          type: e.target.value as DebtType,
                          isGraded: false,
                          monthlyPayment: undefined,
                          creditLimit: undefined,
                          outstandingBalance: undefined,
                        })
                      }
                      className="w-full px-3 py-3 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
                      style={{ color: NAVY }}
                    >
                      {(Object.keys(DEBT_TYPE_LABELS) as DebtType[]).map((dt) => (
                        <option key={dt} value={dt}>
                          {DEBT_TYPE_LABELS[dt]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dollar input */}
                  <CurrencyInput
                    label={getFieldLabel(field)}
                    value={debt[field] ?? 0}
                    onChange={(v) => updateDebt(debt.id, { [field]: v })}
                  />
                </div>

                {/* Graded toggle */}
                {showGraded && (
                  <div className="mt-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div
                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: debt.isGraded ? NAVY : '#CBD5E1',
                          backgroundColor: debt.isGraded ? NAVY : '#FFFFFF',
                        }}
                      >
                        {debt.isGraded && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={debt.isGraded}
                        onChange={(e) => {
                          const newGraded = e.target.checked;
                          const newField = getRequiredField(debt.type, newGraded);
                          const clearPatch: Partial<DebtObligation> = {
                            isGraded: newGraded,
                            monthlyPayment: undefined,
                            creditLimit: undefined,
                            outstandingBalance: undefined,
                          };
                          if (field === newField) {
                            clearPatch[newField] = debt[field];
                          }
                          updateDebt(debt.id, clearPatch);
                        }}
                        className="sr-only"
                      />
                      <span className="text-xs font-semibold text-slate-600">
                        This is a graded request
                      </span>
                    </label>
                    {debt.isGraded && (
                      <p className="text-[11px] text-slate-400 mt-1 pl-7">
                        A graded request uses a slightly different calculation. If you're not
                        sure whether your loan is graded, leave this unchecked.
                      </p>
                    )}
                  </div>
                )}

                {/* Inline annual calculation */}
                {(debt[field] ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {getCalculationDescription(debt)}
                    </span>
                    <span className="text-sm font-bold" style={{ color: NAVY }}>
                      {fmtDollar(annual)}/yr
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={addDebt}
            className="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add a debt obligation
          </button>

          {/* Credit limit explainer */}
          {debts.some((d) =>
            ['business_loc', 'sba_loc', 'cc_this_lender'].includes(d.type) && !d.isGraded
          ) && (
            <div className="mt-5">
              <InfoCallout>
                <strong>Why we ask about your credit limits (not your balance)</strong>
                <br />
                For most lines of credit and credit cards at this lender, banks calculate based
                on the full limit — because you could draw it all tomorrow. Credit cards at other
                lenders use your current balance. We match the method banks actually use.
              </InfoCallout>
            </div>
          )}
        </section>

        {/* ── Section E: Results ── */}
        {showResults && isPaid && (
          <section className="bg-white rounded-xl border-2 p-6 mb-6" style={{ borderColor: band.color }}>
            <h2 className="text-base font-bold mb-5" style={{ color: NAVY }}>
              Business Cash Flow Calculation
            </h2>

            {/* EBIDA visual breakdown */}
            <div className="mb-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    Net Income
                    <span className="ml-1.5 text-[10px] font-bold text-slate-400">(Schedule M-1, Line 1)</span>
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: NAVY }}>
                    {fmtDollar(netIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    + Interest
                    <span className="ml-1.5 text-[10px] font-bold text-slate-400">(Line 13)</span>
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: NAVY }}>
                    {fmtDollar(interestExpense)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    + Depreciation
                    <span className="ml-1.5 text-[10px] font-bold text-slate-400">(Line 14)</span>
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: NAVY }}>
                    {fmtDollar(depreciation)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">+ Amortization</span>
                  <span className="font-bold tabular-nums" style={{ color: NAVY }}>
                    {fmtDollar(amortization)}
                  </span>
                </div>

                {/* Rent addback line — only if applied */}
                {rentAddback > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: EMERALD }}>
                      + Rent Addback
                      <span className="ml-1.5 text-[10px] font-bold">(owner-occupied, Line 11)</span>
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: EMERALD }}>
                      +{fmtDollar(rentAddback)}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider line */}
              <div className="my-3 border-t-2 border-slate-300" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: NAVY }}>
                  {rentAddback > 0 ? 'Adjusted Business Cash Flow' : 'Business Cash Flow (EBIDA)'}
                </span>
                <span className="text-lg font-bold" style={{ color: NAVY }}>
                  {fmtDollar(adjustedCashFlow)}
                </span>
              </div>
            </div>

            {/* Debt service breakdown table */}
            <h3 className="text-sm font-bold mb-3" style={{ color: NAVY }}>
              Your Annual Debt Obligations
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                    <th className="text-left py-2 pr-4 font-bold">Debt Type</th>
                    <th className="text-left py-2 pr-4 font-bold">Calculation Used</th>
                    <th className="text-right py-2 font-bold">Annual Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((debt) => {
                    const annual = calculateAnnualDebtService(debt);
                    if (annual === 0) return null;
                    return (
                      <tr key={debt.id} className="border-b border-slate-100">
                        <td className="py-2.5 pr-4 font-semibold" style={{ color: NAVY }}>
                          {DEBT_TYPE_LABELS[debt.type]}
                          {debt.isGraded && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              (graded)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500 text-xs">
                          {getCalculationDescription(debt)}
                        </td>
                        <td className="py-2.5 text-right font-bold tabular-nums" style={{ color: NAVY }}>
                          {fmtDollar(annual)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3 font-bold" style={{ color: NAVY }}>
                      Total Annual Debt Service
                    </td>
                    <td className="py-3 text-right text-lg font-bold tabular-nums" style={{ color: NAVY }}>
                      {fmtDollar(totalDebtService)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* DSCR result */}
            <div className="text-center pt-4 border-t border-slate-200">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Debt Service Coverage Ratio
              </div>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-bold tracking-tighter" style={{ color: band.color }}>
                  {dscr.toFixed(2)}x
                </span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                style={{ backgroundColor: `${band.color}15`, color: band.color }}
              >
                <Icon name="check-circle" size={14} />
                {band.label} — {dscrPoints} pts
              </div>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {band.message}
              </p>
              <div className="mt-3 text-xs text-slate-400">
                Goal: 1.25x or higher
              </div>
            </div>

            {/* SBA warning in results (if negative cash flow) */}
            {!sbaEligible && (
              <div className="mt-6">
                <InfoCallout variant="warning">
                  <strong>Important about SBA</strong>
                  <br />
                  An SBA guaranty can help with collateral shortfalls, but it cannot fix negative
                  cash flow. Your business cash flow must be positive to qualify for SBA programs.
                  Let's focus on understanding what's driving the shortfall first.
                </InfoCallout>
              </div>
            )}

            {/* Rent addback callout (only if applied) */}
            {rentAddback > 0 && (
              <div
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(15,138,107,0.05)' }}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: EMERALD }}>
                  Owner-occupied property adjustment applied
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We added back {fmtDollar(rentAddback)} in owner-occupied rent expense to your
                  cash flow. This reflects the fact that you own your building and are not paying
                  rent to a third party.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Section E (Gated): Free user preview ── */}
        {showResults && !isPaid && (
          <section className="bg-white rounded-xl border-2 p-6 mb-6 relative overflow-hidden" style={{ borderColor: band.color }}>
            {/* Band indicator — free users see the general band but no numbers */}
            <div className="text-center mb-6">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Your Cash Flow Readiness
              </div>
              <div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${band.color}15`, color: band.color }}
              >
                <Icon name="check-circle" size={16} />
                {band.label}
              </div>
              <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
                {band.message}
              </p>
            </div>

            {/* Blurred preview of the detailed breakdown */}
            <div className="relative min-h-[280px]">
              <div className="blur-[8px] select-none pointer-events-none opacity-30" aria-hidden="true">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Net Income (Schedule M-1, Line 1)</span>
                    <span className="font-bold" style={{ color: NAVY }}>$82,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">+ Interest (Line 13)</span>
                    <span className="font-bold" style={{ color: NAVY }}>$12,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">+ Depreciation (Line 14)</span>
                    <span className="font-bold" style={{ color: NAVY }}>$18,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">+ Amortization</span>
                    <span className="font-bold" style={{ color: NAVY }}>$4,000</span>
                  </div>
                  <div className="border-t-2 border-slate-300 my-3" />
                  <div className="flex justify-between text-sm font-bold">
                    <span style={{ color: NAVY }}>Adjusted Business Cash Flow</span>
                    <span className="text-lg" style={{ color: NAVY }}>$140,000</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <span className="text-5xl font-bold tracking-tighter text-slate-400">1.46x</span>
                </div>
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="text-center max-w-sm px-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${NAVY}08` }}
                  >
                    <Icon name="lock" size={24} style={{ color: NAVY }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: NAVY }}>
                    Unlock Your Full Analysis
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                    See your exact DSCR ratio, EBIDA breakdown with tax return line mapping,
                    debt service methodology, and SBA eligibility — the same analysis
                    a bank loan officer runs internally.
                  </p>
                  {onUpgrade && (
                    <button
                      onClick={onUpgrade}
                      className="px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg"
                      style={{ backgroundColor: EMERALD, boxShadow: `0 8px 24px ${EMERALD}30` }}
                    >
                      Get Your Full Report — $297
                    </button>
                  )}
                  <p className="text-[11px] text-slate-400 mt-3">
                    Includes complete cash flow analysis + bank-ready documentation
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!showResults && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center mb-6">
            <Icon name="chart" size={32} style={{ color: '#CBD5E1' }} />
            <p className="text-sm text-slate-400 mt-3">
              Enter your tax return figures and add at least one debt obligation to see your DSCR.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapacityScorecard;
