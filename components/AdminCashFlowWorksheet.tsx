/**
 * AdminCashFlowWorksheet — Complete Cash Flow Worksheet (Admin Side)
 *
 * Three connected sections:
 *  A. Business Cash Flow (Net Operating Funds Flow) — EBIDA with all adjustments
 *  B. Personal Cash Flow Available to Service Personal Debt
 *  C. Personal Debt Service + Personal Discretionary Cash Flow
 *
 * This is the exact worksheet banks use internally.
 */

import React, { useMemo, useState } from 'react';
import { Icon } from './Icon';
import {
  type EntityType,
  type BusinessCashFlowInputs,
  type BusinessDebtServiceInputs,
  type PersonalCashFlowInputs,
  type PersonalDebtServiceInputs,
  ENTITY_TYPE_LABELS,
  taxAdjustmentApplies,
  calculateBusinessCashFlow,
  calculateBusinessDebtService,
  calculateBusinessDSCR,
  calculatePersonalCashFlow,
  calculatePersonalDebtService,
  calculatePersonalDiscretionaryCashFlow,
  businessDSCRBand,
  personalCFBand,
  scoreBusinessDSCR,
  scorePersonalDiscretionaryCF,
} from '../lib/cashFlowWorksheet';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

interface AdminCashFlowWorksheetProps {
  onBack: () => void;
}

// ─────────── Helpers ───────────

function fmtDollar(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-${formatted}` : formatted;
}

// ─────────── Info callout ───────────

const InfoCallout: React.FC<{ children: React.ReactNode; variant?: 'default' | 'warning' | 'success' }> = ({
  children,
  variant = 'default',
}) => {
  const colors = {
    default: { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', icon: NAVY },
    warning: { bg: 'rgba(220,68,68,0.04)', border: '#DC4444', text: '#991B1B', icon: '#DC4444' },
    success: { bg: 'rgba(15,138,107,0.04)', border: EMERALD, text: '#065F46', icon: EMERALD },
  }[variant];

  return (
    <div
      className="flex gap-3 p-4 rounded-lg border text-sm leading-relaxed"
      style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
    >
      <Icon name="shield-check" size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  );
};

// ─────────── Currency input ───────────

const CurrencyField: React.FC<{
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  allowNegative?: boolean;
}> = ({ label, sublabel, value, onChange, allowNegative }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
      {label}
    </label>
    {sublabel && (
      <p className="text-[11px] text-slate-400 mb-1.5">{sublabel}</p>
    )}
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={value === 0 ? '' : Math.abs(value).toLocaleString('en-US')}
        onChange={(e) => {
          const raw = e.target.value.replace(allowNegative ? /[^0-9-]/g : /[^0-9]/g, '');
          onChange(raw ? parseInt(raw, 10) : 0);
        }}
        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
        style={{ color: NAVY }}
      />
    </div>
  </div>
);

// ─────────── Section header (collapsible) ───────────

const SectionHeader: React.FC<{
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  badgeColor?: string;
}> = ({ title, subtitle, isOpen, onToggle, badge, badgeColor }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
  >
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold" style={{ color: NAVY }}>{title}</h2>
        {badge && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${badgeColor || EMERALD}15`, color: badgeColor || EMERALD }}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
    <svg
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="transition-transform"
      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
);

// ─────────── Breakdown row ───────────

const BreakdownRow: React.FC<{
  label: string;
  sublabel?: string;
  value: number;
  prefix?: string;
  color?: string;
  bold?: boolean;
  divider?: boolean;
}> = ({ label, sublabel, value, prefix, color, bold, divider }) => (
  <div
    className={`flex items-center justify-between py-1.5 ${divider ? 'pt-3 mt-2 border-t-2 border-slate-300' : ''}`}
  >
    <span className={`text-sm ${bold ? 'font-bold' : 'text-slate-600'}`} style={bold ? { color: color || NAVY } : undefined}>
      {prefix && <span className="text-slate-400 mr-1">{prefix}</span>}
      {label}
      {sublabel && <span className="ml-1.5 text-[10px] font-bold text-slate-400">{sublabel}</span>}
    </span>
    <span
      className={`font-bold tabular-nums ${bold ? 'text-lg' : 'text-sm'}`}
      style={{ color: color || NAVY }}
    >
      {fmtDollar(value)}
    </span>
  </div>
);

// ─────────── Main Component ───────────

const AdminCashFlowWorksheet: React.FC<AdminCashFlowWorksheetProps> = ({ onBack }) => {
  // ── Section visibility ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    business: true,
    businessDebt: true,
    personal: false,
    personalDebt: false,
  });

  const toggle = (key: string) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // ── Section A: Business Cash Flow inputs ──
  const [entityType, setEntityType] = useState<EntityType>('scorp');
  const [netProfit, setNetProfit] = useState(0);
  const [bizInterest, setBizInterest] = useState(0);
  const [bizDA, setBizDA] = useState(0);
  const [oneTimeIncome, setOneTimeIncome] = useState(0);
  const [oneTimeExpenses, setOneTimeExpenses] = useState(0);
  const [rentExpense, setRentExpense] = useState(0);
  const [isOwnerOccupied, setIsOwnerOccupied] = useState(false);
  const [ownerWithdrawals, setOwnerWithdrawals] = useState(0);

  // ── Business Debt Service inputs ──
  const [termDebtMo, setTermDebtMo] = useState(0);
  const [bizLOCLimit, setBizLOCLimit] = useState(0);
  const [bizCCOtherBal, setBizCCOtherBal] = useState(0);
  const [bizCCThisLimit, setBizCCThisLimit] = useState(0);
  const [newLOCLimit, setNewLOCLimit] = useState(0);
  const [newTermMo, setNewTermMo] = useState(0);

  // ── Section B: Personal Cash Flow inputs (Warren Moon Rules) ──
  const [filesJointly, setFilesJointly] = useState(false);
  const [spouseIsGuarantor, setSpouseIsGuarantor] = useState(false);
  const [wages, setWages] = useState(0);                   // Line 1a — guarantor's W-2s only
  const [taxableInterest, setTaxableInterest] = useState(0);   // Line 2b — flag if >$5K
  const [ordinaryDividends, setOrdinaryDividends] = useState(0); // Line 3b — flag if >$5K
  const [iraRMD, setIraRMD] = useState(0);                 // Line 4b — RMD only, grossed up x1.25
  const [pensionAnnuity, setPensionAnnuity] = useState(0); // Line 5 — ongoing only, grossed up x1.25
  const [socialSecurity, setSocialSecurity] = useState(0); // Line 6b — guarantor's SS only, grossed up x1.25
  const [nonBorrowingScheduleC, setNonBorrowingScheduleC] = useState(0); // Schedule C Line 31, NOT borrowing entity
  const [alimony, setAlimony] = useState(0);               // Voluntary disclosure only — never prompt

  // ── Section C: Personal Debt Service inputs ──
  const [mortgageMo, setMortgageMo] = useState(0);
  const [helocBal, setHelocBal] = useState(0);
  const [personalCCBal, setPersonalCCBal] = useState(0);
  const [otherTermMo, setOtherTermMo] = useState(0);

  // ── Calculations ──

  const bizCashFlow = useMemo(() => calculateBusinessCashFlow({
    netProfit,
    interestExpense: bizInterest,
    depreciationAndAmortization: bizDA,
    oneTimeNonrecurringIncome: oneTimeIncome,
    oneTimeNonrecurringExpenses: oneTimeExpenses,
    rentExpense,
    isOwnerOccupied,
    ownerWithdrawals,
    entityType,
  }), [netProfit, bizInterest, bizDA, oneTimeIncome, oneTimeExpenses, rentExpense, isOwnerOccupied, ownerWithdrawals, entityType]);

  const bizDebtService = useMemo(() => calculateBusinessDebtService({
    termDebtMonthlyPayment: termDebtMo,
    businessLOCLimit: bizLOCLimit,
    businessCCOtherLenderBalance: bizCCOtherBal,
    businessCCThisLenderLimit: bizCCThisLimit,
    newLOCLimit,
    newTermLoanMonthlyPayment: newTermMo,
  }), [termDebtMo, bizLOCLimit, bizCCOtherBal, bizCCThisLimit, newLOCLimit, newTermMo]);

  const bizDSCR = useMemo(
    () => calculateBusinessDSCR(bizCashFlow.total, bizDebtService.total),
    [bizCashFlow.total, bizDebtService.total]
  );

  const personalCF = useMemo(() => calculatePersonalCashFlow({
    wagesLine1a: wages,
    taxableInterestLine2b: taxableInterest,
    ordinaryDividendsLine3b: ordinaryDividends,
    iraRMDLine4b: iraRMD,
    pensionAnnuityLine5: pensionAnnuity,
    socialSecurityLine6b: socialSecurity,
    nonBorrowingScheduleC,
    alimonyVoluntary: alimony,
  }), [wages, taxableInterest, ordinaryDividends, iraRMD, pensionAnnuity, socialSecurity, nonBorrowingScheduleC, alimony]);

  const personalDS = useMemo(() => calculatePersonalDebtService({
    mortgageMonthlyPayment: mortgageMo,
    homeEquityLineBalance: helocBal,
    personalCCBalance: personalCCBal,
    otherTermDebtMonthlyPayment: otherTermMo,
  }), [mortgageMo, helocBal, personalCCBal, otherTermMo]);

  const personalDiscretionary = calculatePersonalDiscretionaryCashFlow(personalCF.dividedBy2, personalDS.total);

  const bizBand = businessDSCRBand(bizDSCR);
  const persBand = personalCFBand(personalDiscretionary);

  const hasBizInputs = netProfit !== 0 || bizInterest > 0 || bizDA > 0;
  const hasBizDebt = bizDebtService.total > 0;
  const hasPersonalInputs = wages > 0 || taxableInterest > 0 || ordinaryDividends > 0 || iraRMD > 0 || pensionAnnuity > 0 || socialSecurity > 0 || nonBorrowingScheduleC > 0;
  const hasPersonalDebt = personalDS.total > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: NAVY }}>
              <Icon name="chart" size={22} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: EMERALD }}>
                Admin Worksheet
              </div>
              <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
                Complete Cash Flow Analysis
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            The exact worksheet banks use internally. Business cash flow, personal cash flow,
            and discretionary capacity — all calculated in real time.
          </p>
        </div>

        {/* Global Cash Flow Document Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Global Cash Flow Status
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center flex-shrink-0">
                <Icon name="check-circle" size={12} style={{ color: '#CBD5E1' }} />
              </div>
              <span className="text-slate-500">Personal Tax Return (1040) — <span className="text-slate-400 italic">manual entry below</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center flex-shrink-0">
                <Icon name="check-circle" size={12} style={{ color: '#CBD5E1' }} />
              </div>
              <span className="text-slate-500">Personal Financial Statement — <span className="text-slate-400 italic">manual entry below</span></span>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-2">
              <Icon name="shield-check" size={14} style={{ color: GOLD }} />
              <p className="text-xs text-amber-700 leading-relaxed">
                Global cash flow requires both the Personal Tax Return (1040) and the Personal
                Financial Statement. The True Readiness Score cannot be generated until both
                are provided and verified.
              </p>
            </div>
          </div>
        </div>

        {/* Entity Type selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Business Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
            className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            style={{ color: NAVY }}
          >
            {(Object.keys(ENTITY_TYPE_LABELS) as EntityType[]).map((et) => (
              <option key={et} value={et}>{ENTITY_TYPE_LABELS[et]}</option>
            ))}
          </select>
          {taxAdjustmentApplies(entityType) && (
            <p className="text-[11px] text-slate-400 mt-2">
              A 30% tax adjustment will be applied to normalize for pass-through entity taxation.
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION A: BUSINESS CASH FLOW
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
          <SectionHeader
            title="Business Cash Flow"
            subtitle="Net Operating Funds Flow — EBIDA with all bank adjustments"
            isOpen={openSections.business}
            onToggle={() => toggle('business')}
          />

          {openSections.business && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <CurrencyField
                  label="Net Profit"
                  sublabel="Ordinary Business Income (Schedule M-1, Line 1)"
                  value={netProfit}
                  onChange={setNetProfit}
                  allowNegative
                />
                <CurrencyField
                  label="Interest Expense"
                  sublabel="Line 13 of business tax return"
                  value={bizInterest}
                  onChange={setBizInterest}
                />
                <CurrencyField
                  label="Depreciation & Amortization"
                  sublabel="Line 14 + depreciation schedule"
                  value={bizDA}
                  onChange={setBizDA}
                />
                <CurrencyField
                  label="One-time Nonrecurring Income"
                  sublabel="Equipment sale, PPP forgiveness, etc. (discounted @70%)"
                  value={oneTimeIncome}
                  onChange={setOneTimeIncome}
                />
                <CurrencyField
                  label="One-time Nonrecurring Expenses"
                  sublabel="Legal settlement, disaster loss, etc. (added back @70%)"
                  value={oneTimeExpenses}
                  onChange={setOneTimeExpenses}
                />
                <CurrencyField
                  label="Owner Withdrawals"
                  sublabel="Cash pulled beyond compensation"
                  value={ownerWithdrawals}
                  onChange={setOwnerWithdrawals}
                />
              </div>

              {/* Owner-occupied rent */}
              <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isOwnerOccupied ? NAVY : '#CBD5E1',
                      backgroundColor: isOwnerOccupied ? NAVY : '#FFFFFF',
                    }}
                  >
                    {isOwnerOccupied && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isOwnerOccupied}
                    onChange={(e) => {
                      setIsOwnerOccupied(e.target.checked);
                      if (!e.target.checked) setRentExpense(0);
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-slate-700">Owner-occupied property (rent addback applies)</span>
                </label>

                {isOwnerOccupied && (
                  <div className="pl-7">
                    <CurrencyField
                      label="Rent Expense (Line 11)"
                      sublabel="Added back at 70% — bank's standard discount"
                      value={rentExpense}
                      onChange={setRentExpense}
                    />
                    {rentExpense > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Addback amount: {fmtDollar(rentExpense * 0.70)} (70% of {fmtDollar(rentExpense)})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Inline warnings */}
              {oneTimeIncome > 0 && (
                <div className="mt-4">
                  <InfoCallout>
                    One-time income is discounted to 70% since it won't repeat next year.
                    Full amount: {fmtDollar(oneTimeIncome)} → Adjusted: {fmtDollar(oneTimeIncome * 0.70)}
                  </InfoCallout>
                </div>
              )}

              {taxAdjustmentApplies(entityType) && netProfit !== 0 && (
                <div className="mt-4">
                  <InfoCallout>
                    Because your business is an {ENTITY_TYPE_LABELS[entityType]}, we've applied a 30%
                    tax adjustment ({fmtDollar(netProfit * 0.30)}) to normalize your cash flow for the
                    personal taxes you'll owe on business income.
                  </InfoCallout>
                </div>
              )}

              {/* Business Cash Flow Breakdown */}
              {hasBizInputs && (
                <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Business Cash Flow Breakdown
                  </div>
                  <BreakdownRow label="Net Profit" value={bizCashFlow.netProfit} />
                  <BreakdownRow label="Interest Expense" prefix="+" value={bizCashFlow.interestExpense} />
                  <BreakdownRow label="Depreciation & Amortization" prefix="+" value={bizCashFlow.depreciationAndAmortization} />
                  {bizCashFlow.oneTimeIncomeDiscounted > 0 && (
                    <BreakdownRow label="One-time Income" sublabel="(@70%)" prefix="-" value={-bizCashFlow.oneTimeIncomeDiscounted} color="#DC4444" />
                  )}
                  {bizCashFlow.oneTimeExpensesDiscounted > 0 && (
                    <BreakdownRow label="One-time Expenses" sublabel="(@70%)" prefix="+" value={bizCashFlow.oneTimeExpensesDiscounted} />
                  )}
                  {bizCashFlow.rentAddback70pct > 0 && (
                    <BreakdownRow label="Rent Addback" sublabel="(@70%)" prefix="+" value={bizCashFlow.rentAddback70pct} color={EMERALD} />
                  )}
                  {bizCashFlow.ownerWithdrawals > 0 && (
                    <BreakdownRow label="Owner Withdrawals" prefix="-" value={-bizCashFlow.ownerWithdrawals} color="#DC4444" />
                  )}
                  {bizCashFlow.taxAdjustment30pct > 0 && (
                    <BreakdownRow label="Tax Adjustment" sublabel="(30%)" prefix="-" value={-bizCashFlow.taxAdjustment30pct} color="#DC4444" />
                  )}
                  <BreakdownRow label="Business Cash Flow" value={bizCashFlow.total} bold divider color={bizCashFlow.total >= 0 ? NAVY : '#DC4444'} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BUSINESS DEBT SERVICE
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
          <SectionHeader
            title="Business Debt Service"
            subtitle="Existing obligations + proposed new loan"
            isOpen={openSections.businessDebt}
            onToggle={() => toggle('businessDebt')}
          />

          {openSections.businessDebt && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <CurrencyField
                  label="Term Debt Monthly Payment"
                  sublabel="Mortgages, equipment leases, term loans (x12)"
                  value={termDebtMo}
                  onChange={setTermDebtMo}
                />
                <CurrencyField
                  label="Business LOC Limit"
                  sublabel="Credit limit (x.24)"
                  value={bizLOCLimit}
                  onChange={setBizLOCLimit}
                />
                <CurrencyField
                  label="Business CC — Other Lenders"
                  sublabel="Outstanding balance (x.25)"
                  value={bizCCOtherBal}
                  onChange={setBizCCOtherBal}
                />
                <CurrencyField
                  label="Business CC — This Lender"
                  sublabel="Credit limit (x.25)"
                  value={bizCCThisLimit}
                  onChange={setBizCCThisLimit}
                />
              </div>

              <div className="mt-5 p-4 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/30">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-3">
                  Proposed New Debt (included in total)
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <CurrencyField
                    label="New LOC Limit"
                    sublabel="Proposed new line of credit (x.24)"
                    value={newLOCLimit}
                    onChange={setNewLOCLimit}
                  />
                  <CurrencyField
                    label="New Term Loan Monthly Pmt"
                    sublabel="Proposed new term loan (x12)"
                    value={newTermMo}
                    onChange={setNewTermMo}
                  />
                </div>
              </div>

              {/* Debt Service Breakdown */}
              {hasBizDebt && (
                <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Business Debt Service Breakdown
                  </div>
                  {bizDebtService.termDebt > 0 && (
                    <BreakdownRow label="Term Debt" sublabel={`(${fmtDollar(termDebtMo)}/mo x 12)`} value={bizDebtService.termDebt} />
                  )}
                  {bizDebtService.loc > 0 && (
                    <BreakdownRow label="Business LOC" sublabel={`(${fmtDollar(bizLOCLimit)} x .24)`} value={bizDebtService.loc} />
                  )}
                  {bizDebtService.ccOther > 0 && (
                    <BreakdownRow label="CC Other Lenders" sublabel={`(${fmtDollar(bizCCOtherBal)} bal x .25)`} value={bizDebtService.ccOther} />
                  )}
                  {bizDebtService.ccThisLender > 0 && (
                    <BreakdownRow label="CC This Lender" sublabel={`(${fmtDollar(bizCCThisLimit)} limit x .25)`} value={bizDebtService.ccThisLender} />
                  )}
                  {bizDebtService.newLoc > 0 && (
                    <BreakdownRow label="New LOC (proposed)" sublabel={`(${fmtDollar(newLOCLimit)} x .24)`} value={bizDebtService.newLoc} color="#3B82F6" />
                  )}
                  {bizDebtService.newTermLoan > 0 && (
                    <BreakdownRow label="New Term Loan (proposed)" sublabel={`(${fmtDollar(newTermMo)}/mo x 12)`} value={bizDebtService.newTermLoan} color="#3B82F6" />
                  )}
                  <BreakdownRow label="Total Business Debt Service" value={bizDebtService.total} bold divider />
                </div>
              )}

              {/* Business DSCR */}
              {hasBizInputs && hasBizDebt && (
                <div className="mt-5 p-5 rounded-lg border-2 text-center" style={{ borderColor: bizBand.color }}>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Business DSCR
                  </div>
                  <div className="text-4xl font-bold tracking-tighter mb-1" style={{ color: bizBand.color }}>
                    {bizDSCR.toFixed(2)}x
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ backgroundColor: `${bizBand.color}15`, color: bizBand.color }}
                  >
                    <Icon name="check-circle" size={12} />
                    {bizBand.label} — {scoreBusinessDSCR(bizDSCR)} pts
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">{bizBand.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION B: PERSONAL CASH FLOW
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
          <SectionHeader
            title="Personal Cash Flow"
            subtitle="Cash flow available to service personal debt"
            isOpen={openSections.personal}
            onToggle={() => toggle('personal')}
          />

          {openSections.personal && (
            <div className="px-5 pb-5 border-t border-slate-100">
              {/* Warren Moon rules callout */}
              <div className="mt-4 mb-5">
                <InfoCallout>
                  <span className="font-bold">Warren Moon (CCB HR) Rules Apply.</span>{' '}
                  Only guarantor&apos;s individual income is included. Schedule E Part II
                  (K-1 pass-through) is excluded — already in business EBIDA. Rental income
                  (Schedule E Part I) and farm income (Schedule F) are treated as business side.
                </InfoCallout>
              </div>

              {/* Joint filer notice */}
              {filesJointly && !spouseIsGuarantor && (
                <div className="mb-5">
                  <InfoCallout variant="warning">
                    <span className="font-bold">Joint Filer — Guarantor Isolation Required.</span>{' '}
                    Only use the guarantor&apos;s individual income — NOT the combined household total.
                    Review each W-2, interest, dividend, IRA, pension, and SS line to confirm
                    which income belongs to the guarantor.
                  </InfoCallout>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <CurrencyField
                  label="W-2 Wages & Salaries"
                  sublabel="Form 1040, Line 1a — guarantor only"
                  value={wages}
                  onChange={setWages}
                />
                <CurrencyField
                  label="Taxable Interest"
                  sublabel="Form 1040, Line 2b — flag if >$5K"
                  value={taxableInterest}
                  onChange={setTaxableInterest}
                />
                <CurrencyField
                  label="Ordinary Dividends"
                  sublabel="Form 1040, Line 3b — flag if >$5K"
                  value={ordinaryDividends}
                  onChange={setOrdinaryDividends}
                />
                <CurrencyField
                  label="IRA Distributions (RMD Only)"
                  sublabel="Form 1040, Line 4b — grossed up x1.25"
                  value={iraRMD}
                  onChange={setIraRMD}
                />
                <CurrencyField
                  label="Pension / Annuity (Ongoing Only)"
                  sublabel="Form 1040, Line 5 — grossed up x1.25"
                  value={pensionAnnuity}
                  onChange={setPensionAnnuity}
                />
                <CurrencyField
                  label="Social Security Benefits"
                  sublabel="Form 1040, Line 6b — grossed up x1.25"
                  value={socialSecurity}
                  onChange={setSocialSecurity}
                />
                <CurrencyField
                  label="Other Business Income (Side Hustle)"
                  sublabel="Schedule C, Line 31 — only if NOT borrowing entity"
                  value={nonBorrowingScheduleC}
                  onChange={setNonBorrowingScheduleC}
                />
                <CurrencyField
                  label="Alimony (Voluntary Only)"
                  sublabel="Schedule 1, Line 2a — only if client disclosed"
                  value={alimony}
                  onChange={setAlimony}
                />
              </div>

              {/* Inline flag warnings */}
              {taxableInterest > 5000 && (
                <div className="mt-4">
                  <InfoCallout variant="warning">
                    <span className="font-bold">Taxable interest exceeds $5,000.</span>{' '}
                    Credit officer will want to see underlying assets on PFS or proof from
                    bank/brokerage statements.
                  </InfoCallout>
                </div>
              )}
              {ordinaryDividends > 5000 && (
                <div className="mt-4">
                  <InfoCallout variant="warning">
                    <span className="font-bold">Ordinary dividends exceed $5,000.</span>{' '}
                    Verify brokerage account assets appear in Schedule B or D on the PFS.
                  </InfoCallout>
                </div>
              )}

              {/* Hard exclude reminder */}
              <div className="mt-5 p-4 rounded-lg bg-red-50/50 border border-red-100">
                <div className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-red-700 mb-1">Items NOT included in personal cash flow:</p>
                    <ul className="text-[11px] text-red-600 space-y-0.5 list-disc pl-4">
                      <li>Schedule E Part II (K-1 pass-through) — already in business EBIDA</li>
                      <li>One-time IRA withdrawals or pension payouts</li>
                      <li>Rental income (Schedule E Part I) — business side</li>
                      <li>Farm income (Schedule F) — business side</li>
                      <li>Capital gains, unemployment, gambling, cancellation of debt</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Personal Cash Flow Breakdown */}
              {hasPersonalInputs && (
                <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Personal Cash Flow Breakdown (Warren Moon Rules)
                  </div>
                  {personalCF.wagesLine1a > 0 && (
                    <BreakdownRow label="W-2 Wages" sublabel="(Line 1a)" value={personalCF.wagesLine1a} />
                  )}
                  {personalCF.taxableInterestLine2b > 0 && (
                    <BreakdownRow label="Taxable Interest" sublabel="(Line 2b)" prefix="+" value={personalCF.taxableInterestLine2b} />
                  )}
                  {personalCF.ordinaryDividendsLine3b > 0 && (
                    <BreakdownRow label="Ordinary Dividends" sublabel="(Line 3b)" prefix="+" value={personalCF.ordinaryDividendsLine3b} />
                  )}
                  {personalCF.iraRMDGrossed > 0 && (
                    <BreakdownRow label="IRA RMD" sublabel="(Line 4b @1.25x)" prefix="+" value={personalCF.iraRMDGrossed} />
                  )}
                  {personalCF.pensionAnnuityGrossed > 0 && (
                    <BreakdownRow label="Pension/Annuity" sublabel="(Line 5 @1.25x)" prefix="+" value={personalCF.pensionAnnuityGrossed} />
                  )}
                  {personalCF.socialSecurityGrossed > 0 && (
                    <BreakdownRow label="Social Security" sublabel="(Line 6b @1.25x)" prefix="+" value={personalCF.socialSecurityGrossed} />
                  )}
                  {personalCF.nonBorrowingScheduleC > 0 && (
                    <BreakdownRow label="Schedule C (Side Hustle)" sublabel="(Line 31)" prefix="+" value={personalCF.nonBorrowingScheduleC} />
                  )}
                  {personalCF.alimonyVoluntary > 0 && (
                    <BreakdownRow label="Alimony (Voluntary)" prefix="+" value={personalCF.alimonyVoluntary} />
                  )}
                  <BreakdownRow label="Total Income" value={personalCF.totalIncome} bold divider />
                  <div className="flex items-center justify-between py-1.5 mt-1">
                    <span className="text-sm text-slate-500">Divided by 2 (bank normalization)</span>
                    <span className="text-sm text-slate-400">&divide; 2</span>
                  </div>
                  <BreakdownRow label="Personal Cash Flow Available" value={personalCF.dividedBy2} bold divider color={NAVY} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION C: PERSONAL DEBT SERVICE + DISCRETIONARY CF
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
          <SectionHeader
            title="Personal Debt Service"
            subtitle="Personal obligations + discretionary cash flow"
            isOpen={openSections.personalDebt}
            onToggle={() => toggle('personalDebt')}
          />

          {openSections.personalDebt && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <CurrencyField
                  label="Mortgage Monthly Payment"
                  sublabel="Principal + interest (x12)"
                  value={mortgageMo}
                  onChange={setMortgageMo}
                />
                <CurrencyField
                  label="Home Equity Line Balance"
                  sublabel="Outstanding balance (x.12 — NOT .24)"
                  value={helocBal}
                  onChange={setHelocBal}
                />
                <CurrencyField
                  label="Personal Credit Card Balance"
                  sublabel="Outstanding balance (x.25)"
                  value={personalCCBal}
                  onChange={setPersonalCCBal}
                />
                <CurrencyField
                  label="Other Term Debt Monthly Pmt"
                  sublabel="Car loans, student loans, etc. (x12)"
                  value={otherTermMo}
                  onChange={setOtherTermMo}
                />
              </div>

              {/* Personal Debt + Discretionary Breakdown */}
              {(hasPersonalDebt || hasPersonalInputs) && (
                <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Personal Debt Service Breakdown
                  </div>
                  {personalDS.mortgage > 0 && (
                    <BreakdownRow label="Mortgage" sublabel={`(${fmtDollar(mortgageMo)}/mo x 12)`} value={personalDS.mortgage} />
                  )}
                  {personalDS.heloc > 0 && (
                    <BreakdownRow label="HELOC" sublabel={`(${fmtDollar(helocBal)} bal x .12)`} value={personalDS.heloc} />
                  )}
                  {personalDS.personalCC > 0 && (
                    <BreakdownRow label="Personal Credit Cards" sublabel={`(${fmtDollar(personalCCBal)} bal x .25)`} value={personalDS.personalCC} />
                  )}
                  {personalDS.otherTermDebt > 0 && (
                    <BreakdownRow label="Other Term Debt" sublabel={`(${fmtDollar(otherTermMo)}/mo x 12)`} value={personalDS.otherTermDebt} />
                  )}
                  <BreakdownRow label="Total Personal Debt Service" value={personalDS.total} bold divider />
                </div>
              )}

              {/* Personal Discretionary Cash Flow */}
              {hasPersonalInputs && (
                <div className="mt-5 p-5 rounded-lg border-2 text-center" style={{ borderColor: persBand.color }}>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Personal Discretionary Cash Flow
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    {fmtDollar(personalCF.dividedBy2)} available - {fmtDollar(personalDS.total)} debt service
                  </div>
                  <div className="text-4xl font-bold tracking-tighter mb-1" style={{ color: persBand.color }}>
                    {fmtDollar(personalDiscretionary)}
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ backgroundColor: `${persBand.color}15`, color: persBand.color }}
                  >
                    <Icon name="check-circle" size={12} />
                    {persBand.label} — {scorePersonalDiscretionaryCF(personalDiscretionary)} pts
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">{persBand.message}</p>
                </div>
              )}

              {/* Negative discretionary warning */}
              {hasPersonalInputs && personalDiscretionary < 0 && (
                <div className="mt-4">
                  <InfoCallout variant="warning">
                    <strong>Personal cash flow shortfall</strong>
                    <br />
                    Your personal obligations exceed your personal income after normalization.
                    This is a risk flag. Banks will want to understand how personal expenses
                    are being covered.
                  </InfoCallout>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SUMMARY — only shown when both sides have data
            ═══════════════════════════════════════════════════════════════ */}
        {hasBizInputs && hasBizDebt && hasPersonalInputs && (
          <div className="bg-white rounded-xl border-2 p-6 mb-6" style={{ borderColor: NAVY }}>
            <h2 className="text-base font-bold mb-5" style={{ color: NAVY }}>
              Complete Capacity Summary
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Business side */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Business</div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Cash Flow</span>
                  <span className="font-bold" style={{ color: NAVY }}>{fmtDollar(bizCashFlow.total)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Debt Service</span>
                  <span className="font-bold" style={{ color: NAVY }}>{fmtDollar(bizDebtService.total)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-slate-200">
                  <span className="font-bold" style={{ color: NAVY }}>DSCR</span>
                  <span className="font-bold text-lg" style={{ color: bizBand.color }}>{bizDSCR.toFixed(2)}x</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: bizBand.color }}>
                    {bizBand.label} — {scoreBusinessDSCR(bizDSCR)} pts
                  </span>
                </div>
              </div>

              {/* Personal side */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Personal</div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Cash Flow Available</span>
                  <span className="font-bold" style={{ color: NAVY }}>{fmtDollar(personalCF.dividedBy2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Debt Service</span>
                  <span className="font-bold" style={{ color: NAVY }}>{fmtDollar(personalDS.total)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-slate-200">
                  <span className="font-bold" style={{ color: NAVY }}>Discretionary CF</span>
                  <span className="font-bold text-lg" style={{ color: persBand.color }}>{fmtDollar(personalDiscretionary)}</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: persBand.color }}>
                    {persBand.label} — {scorePersonalDiscretionaryCF(personalDiscretionary)} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Combined score */}
            <div className="mt-5 pt-5 border-t border-slate-200 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Combined Capacity Score
              </div>
              <div className="text-3xl font-bold" style={{ color: NAVY }}>
                {scoreBusinessDSCR(bizDSCR) + scorePersonalDiscretionaryCF(personalDiscretionary)} pts
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Business DSCR ({scoreBusinessDSCR(bizDSCR)}) + Personal ({scorePersonalDiscretionaryCF(personalDiscretionary)})
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCashFlowWorksheet;
