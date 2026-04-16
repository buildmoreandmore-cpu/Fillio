/**
 * IntakeQuestionnaire — Quick 5-question intake before signup.
 *
 * Captures qualifying info so the user has invested 30 seconds before
 * hitting the signup/payment wall. Answers pre-populate their scorecard.
 */

import React, { useState } from 'react';
const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

export interface IntakeAnswers {
  selectedTier: 'bank_ready' | 'loan_ready' | 'approved';
  businessName: string;
  timeInBusiness: string;
  financingType: string;
  loanAmount: string;
  declinedBefore: boolean | null;
}

interface IntakeQuestionnaireProps {
  tier: 'bank_ready' | 'loan_ready' | 'approved';
  onComplete: (answers: IntakeAnswers) => void;
  onClose: () => void;
}

const TIER_NAMES: Record<string, string> = {
  bank_ready: 'Bank Ready',
  loan_ready: 'Loan Ready',
  approved: 'Approved',
};

const TIME_OPTIONS = [
  { value: 'pre_revenue', label: 'Pre-revenue / Startup' },
  { value: 'under_2', label: 'Less than 2 years' },
  { value: '2_to_5', label: '2 - 5 years' },
  { value: '5_plus', label: '5+ years' },
];

const FINANCING_OPTIONS = [
  { value: 'line_of_credit', label: 'Line of Credit' },
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'sba_loan', label: 'SBA Loan' },
  { value: 'equipment', label: 'Equipment Financing' },
  { value: 'real_estate', label: 'Commercial Real Estate' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const AMOUNT_OPTIONS = [
  { value: 'under_50k', label: 'Under $50,000' },
  { value: '50k_100k', label: '$50,000 - $100,000' },
  { value: '100k_250k', label: '$100,000 - $250,000' },
  { value: '250k_500k', label: '$250,000 - $500,000' },
  { value: '500k_1m', label: '$500,000 - $1,000,000' },
  { value: 'over_1m', label: '$1,000,000+' },
];

const IntakeQuestionnaire: React.FC<IntakeQuestionnaireProps> = ({
  tier,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [timeInBusiness, setTimeInBusiness] = useState('');
  const [financingType, setFinancingType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [declinedBefore, setDeclinedBefore] = useState<boolean | null>(null);

  const totalSteps = 5;

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return businessName.trim().length >= 2;
      case 1: return timeInBusiness !== '';
      case 2: return financingType !== '';
      case 3: return loanAmount !== '';
      case 4: return declinedBefore !== null;
      default: return false;
    }
  };

  const advance = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        selectedTier: tier,
        businessName: businessName.trim(),
        timeInBusiness,
        financingType,
        loanAmount,
        declinedBefore,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canAdvance()) advance();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(7,30,23,0.6)' }}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: NAVY }}>
                <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
                  <rect width="64" height="64" fill={NAVY} />
                  <text x="15" y="48" fontFamily="Georgia, 'Times New Roman', serif" fontSize="42" fontWeight="bold" fill="#FFFFFF" letterSpacing="-1">B</text>
                </svg>
              </div>
              <span className="text-sm font-bold" style={{ color: NAVY }}>BankReadyDocs</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: tier === 'approved' ? `${GOLD}15` : `${EMERALD}15`,
                  color: tier === 'approved' ? GOLD : EMERALD,
                }}
              >
                {TIER_NAMES[tier]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full flex-1 transition-all"
                style={{
                  backgroundColor: i <= step ? EMERALD : '#E2E8F0',
                }}
              />
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Question {step + 1} of {totalSteps}
          </p>
        </div>

        {/* Questions */}
        <div className="px-8 pb-8" style={{ minHeight: 220 }}>
          {/* Q1: Business Name */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                What's your business name?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                We'll use this to set up your loan readiness workspace.
              </p>
              <input
                type="text"
                placeholder="e.g. Acme Construction LLC"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 text-base font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
                style={{ color: NAVY }}
              />
            </div>
          )}

          {/* Q2: Time in Business */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                How long has your business been operating?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Banks weigh time in business heavily — this helps us calibrate.
              </p>
              <div className="space-y-2.5">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimeInBusiness(opt.value);
                      setTimeout(() => setStep(2), 200);
                    }}
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: timeInBusiness === opt.value ? EMERALD : '#E2E8F0',
                      backgroundColor: timeInBusiness === opt.value ? `${EMERALD}06` : '#FFFFFF',
                      color: NAVY,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q3: Financing Type */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                What type of financing are you looking for?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Different loan types require different documentation.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {FINANCING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFinancingType(opt.value);
                      setTimeout(() => setStep(3), 200);
                    }}
                    className="text-left px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: financingType === opt.value ? EMERALD : '#E2E8F0',
                      backgroundColor: financingType === opt.value ? `${EMERALD}06` : '#FFFFFF',
                      color: NAVY,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q4: Loan Amount */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                How much financing do you need?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                An estimate is fine — this helps us match the right approach.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {AMOUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setLoanAmount(opt.value);
                      setTimeout(() => setStep(4), 200);
                    }}
                    className="text-left px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: loanAmount === opt.value ? EMERALD : '#E2E8F0',
                      backgroundColor: loanAmount === opt.value ? `${EMERALD}06` : '#FFFFFF',
                      color: NAVY,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q5: Previously Declined */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                Have you been declined for a business loan before?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                No judgment — this helps us know where to focus your preparation.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => setDeclinedBefore(true)}
                  className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: declinedBefore === true ? EMERALD : '#E2E8F0',
                    backgroundColor: declinedBefore === true ? `${EMERALD}06` : '#FFFFFF',
                    color: NAVY,
                  }}
                >
                  Yes — I want to understand what went wrong
                </button>
                <button
                  onClick={() => setDeclinedBefore(false)}
                  className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: declinedBefore === false ? EMERALD : '#E2E8F0',
                    backgroundColor: declinedBefore === false ? `${EMERALD}06` : '#FFFFFF',
                    color: NAVY,
                  }}
                >
                  No — this is my first time applying
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with nav buttons */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            {step > 0 ? 'Back' : 'Cancel'}
          </button>

          <button
            onClick={advance}
            disabled={!canAdvance()}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-2"
            style={{ backgroundColor: canAdvance() ? NAVY : '#94A3B8' }}
          >
            {step === totalSteps - 1 ? 'Create My Account' : 'Continue'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntakeQuestionnaire;
