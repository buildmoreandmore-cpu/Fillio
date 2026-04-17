/**
 * Tier3ApplicationModal — Application form for the Approved ($7,997) tier.
 *
 * This tier is "by application only." The client fills out a short form,
 * and the admin reviews and manually sends a Stripe payment link if accepted.
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

interface Tier3ApplicationModalProps {
  onClose: () => void;
  onSubmitted: () => void;
  prefillBusinessName?: string;
}

const Tier3ApplicationModal: React.FC<Tier3ApplicationModalProps> = ({
  onClose,
  onSubmitted,
  prefillBusinessName = '',
}) => {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState(prefillBusinessName);
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [previouslyDeclined, setPreviouslyDeclined] = useState<boolean | null>(null);
  const [declinedBy, setDeclinedBy] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    fullName.trim().length >= 2 &&
    businessName.trim().length >= 2 &&
    contactValue.trim().length >= 3 &&
    (previouslyDeclined === null || previouslyDeclined === false || declinedBy.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const { error: dbError } = await (supabase as any)
      .from('tier3_applications')
      .insert({
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        annual_revenue: annualRevenue || null,
        loan_amount: loanAmount || null,
        previously_declined: previouslyDeclined ?? false,
        declined_by: previouslyDeclined ? declinedBy.trim() : null,
        contact_method: contactMethod,
        contact_value: contactValue.trim(),
      });

    setIsSubmitting(false);

    if (dbError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => onSubmitted(), 2000);
  };

  const REVENUE_OPTIONS = [
    'Under $250K',
    '$250K - $500K',
    '$500K - $1M',
    '$1M - $5M',
    'Over $5M',
  ];

  const LOAN_OPTIONS = [
    'Under $100K',
    '$100K - $250K',
    '$250K - $500K',
    '$500K - $1M',
    'Over $1M',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(7,30,23,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
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
                style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
              >
                Approved
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

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${EMERALD}12` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={EMERALD} aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14.41-4.7-4.7L7.7 10.3 11 13.59l5.3-5.3 1.4 1.42L11 16.41z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>Application Submitted</h2>
              <p className="text-sm text-slate-500">We'll review your application and reach out within 1 business day.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>
                Apply for the Approved Package
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                $7,997 full concierge engagement. Tell us about your situation and we'll reach out to discuss.
              </p>
            </>
          )}
        </div>

        {/* Form */}
        {!submitted && (
          <div className="px-8 pb-8 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {/* Full Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
                style={{ color: NAVY }}
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Business Name</label>
              <input
                type="text"
                placeholder="Acme Construction LLC"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
                style={{ color: NAVY }}
              />
            </div>

            {/* Annual Revenue */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Annual Revenue (approximate)</label>
              <div className="flex flex-wrap gap-2">
                {REVENUE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnnualRevenue(opt)}
                    className="px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                    style={{
                      borderColor: annualRevenue === opt ? EMERALD : '#E2E8F0',
                      backgroundColor: annualRevenue === opt ? `${EMERALD}06` : '#FFFFFF',
                      color: NAVY,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Loan Amount Needed</label>
              <div className="flex flex-wrap gap-2">
                {LOAN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLoanAmount(opt)}
                    className="px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                    style={{
                      borderColor: loanAmount === opt ? EMERALD : '#E2E8F0',
                      backgroundColor: loanAmount === opt ? `${EMERALD}06` : '#FFFFFF',
                      color: NAVY,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Previously Declined */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Were you previously declined?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviouslyDeclined(true)}
                  className="px-4 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all flex-1"
                  style={{
                    borderColor: previouslyDeclined === true ? EMERALD : '#E2E8F0',
                    backgroundColor: previouslyDeclined === true ? `${EMERALD}06` : '#FFFFFF',
                    color: NAVY,
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => { setPreviouslyDeclined(false); setDeclinedBy(''); }}
                  className="px-4 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all flex-1"
                  style={{
                    borderColor: previouslyDeclined === false ? EMERALD : '#E2E8F0',
                    backgroundColor: previouslyDeclined === false ? `${EMERALD}06` : '#FFFFFF',
                    color: NAVY,
                  }}
                >
                  No
                </button>
              </div>
              {previouslyDeclined === true && (
                <input
                  type="text"
                  placeholder="Declined by whom? (e.g. Chase, Wells Fargo)"
                  value={declinedBy}
                  onChange={(e) => setDeclinedBy(e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
                  style={{ color: NAVY }}
                />
              )}
            </div>

            {/* Contact Method */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Best way to reach you</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setContactMethod('email')}
                  className="px-4 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all flex-1"
                  style={{
                    borderColor: contactMethod === 'email' ? EMERALD : '#E2E8F0',
                    backgroundColor: contactMethod === 'email' ? `${EMERALD}06` : '#FFFFFF',
                    color: NAVY,
                  }}
                >
                  Email
                </button>
                <button
                  onClick={() => setContactMethod('phone')}
                  className="px-4 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all flex-1"
                  style={{
                    borderColor: contactMethod === 'phone' ? EMERALD : '#E2E8F0',
                    backgroundColor: contactMethod === 'phone' ? `${EMERALD}06` : '#FFFFFF',
                    color: NAVY,
                  }}
                >
                  Phone
                </button>
              </div>
              <input
                type={contactMethod === 'email' ? 'email' : 'tel'}
                placeholder={contactMethod === 'email' ? 'your@email.com' : '(555) 123-4567'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
                style={{ color: NAVY }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
              style={{ backgroundColor: canSubmit && !isSubmitting ? NAVY : '#94A3B8' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tier3ApplicationModal;
