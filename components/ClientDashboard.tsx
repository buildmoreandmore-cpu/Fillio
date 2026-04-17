/**
 * ClientDashboard — The post-login client experience.
 *
 * Replaces the landing page for logged-in non-admin users.
 * Shows progress, status, and next steps based on tier and submission state.
 */

import React, { useEffect, useState } from 'react';
import { loadClientSubmission } from '../lib/intakePersistence';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

const TIER_DISPLAY: Record<string, { label: string; color: string }> = {
  bank_ready: { label: 'Bank Ready', color: EMERALD },
  loan_ready: { label: 'Loan Ready', color: NAVY },
  approved: { label: 'Approved', color: GOLD },
};

interface ClientDashboardProps {
  userId: string;
  userName: string;
  businessName: string;
  tier: 'bank_ready' | 'loan_ready' | 'approved' | null;
  onStartScorecard: () => void;
  onContinueScorecard: () => void;
  onLogout: () => void;
  onTierClick: (tier: 'bank_ready' | 'loan_ready' | 'approved') => void;
}

// ─── SVG Icon helpers (inline, never emoji) ───

const LogoMark = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
    <rect width="64" height="64" fill="#0B2820" />
    <text x="15" y="48" fontFamily="Georgia, 'Times New Roman', serif" fontSize="42" fontWeight="bold" fill="#FFFFFF" letterSpacing="-1">B</text>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CheckCircleIcon = ({ size = 24, color = EMERALD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14.41-4.7-4.7L7.7 10.3 11 13.59l5.3-5.3 1.4 1.42L11 16.41z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={EMERALD} aria-hidden="true">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 16L6 12.5l1.41-1.41L10.5 14.17l6.09-6.09L18 9.5 10.5 17z" />
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const StarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={GOLD} aria-hidden="true">
    <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z" />
  </svg>
);

// ─── Tier selection cards for State A ───

const TIER_CARDS: { key: 'bank_ready' | 'loan_ready' | 'approved'; name: string; price: string; desc: string; color: string }[] = [
  { key: 'bank_ready', name: 'Bank Ready', price: '$297', desc: 'DIY scorecard and document builder', color: EMERALD },
  { key: 'loan_ready', name: 'Loan Ready', price: '$2,497', desc: 'Advisor-guided credit review', color: NAVY },
  { key: 'approved', name: 'Approved', price: '$7,997', desc: 'Full concierge — by application', color: GOLD },
];

// ─── Component ───

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  userId,
  userName,
  businessName,
  tier,
  onStartScorecard,
  onContinueScorecard,
  onLogout,
  onTierClick,
}) => {
  const [submission, setSubmission] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClientSubmission(userId).then((data) => {
      setSubmission(data);
      setIsLoading(false);
    });
  }, [userId]);

  const firstName = userName?.split(' ')[0] || 'there';
  const tierInfo = tier ? TIER_DISPLAY[tier] : null;

  // ─── Loading state ───

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#1D9E75] rounded-full animate-spin" />
      </div>
    );
  }

  // Determine dashboard state
  const status = submission?.status as string | undefined;
  const isAdvisorTier = tier === 'loan_ready' || tier === 'approved';
  const scorecardDone = status === 'submitted' || status === 'under_review' || status === 'confirmed' || status === 'needs_info' || status === 'report_released';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ─── Top nav ─── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              <LogoMark />
            </div>
            <span className="text-sm font-bold" style={{ color: NAVY }}>BankReadyDocs</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:block">{userName}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Main content ─── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ─── State A: No submission, no tier — new user ─── */}
        {!submission && !tier && (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: NAVY }}>
              Welcome, {firstName}
            </h1>
            <p className="text-sm text-slate-500 mb-8">
              Get started by choosing a plan that fits where you are in the lending process.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {TIER_CARDS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => onTierClick(t.key)}
                  className="bg-white rounded-xl border-2 border-slate-200 p-5 text-left hover:border-opacity-60 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ ['--hover-border' as string]: t.color }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-3"
                    style={{ backgroundColor: `${t.color}12`, color: t.color }}
                  >
                    {t.name}
                  </span>
                  <div className="text-xl font-bold mb-1" style={{ color: NAVY }}>{t.price}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: t.color }}>
                    Get started <ArrowRightIcon />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── State A variant: Has tier but no submission yet ─── */}
        {!submission && tier && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                Welcome, {firstName}
              </h1>
              {tierInfo && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}12`, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-8">
              {businessName ? `${businessName} -- ` : ''}Let's get your loan readiness scorecard started.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <button
                onClick={onStartScorecard}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: NAVY }}
              >
                <ClipboardIcon />
                Start Your Scorecard
                <ArrowRightIcon />
              </button>
            </div>
          </>
        )}

        {/* ─── State B: DIY (bank_ready) with in_progress ─── */}
        {submission && !isAdvisorTier && status === 'in_progress' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${EMERALD}12`, color: EMERALD }}
              >
                Bank Ready
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-8">
              Complete these steps to get your loan readiness report.
            </p>

            {/* 3-step vertical progress */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="space-y-0">
                {/* Step 1: Scorecard */}
                <StepItem
                  stepNumber={1}
                  title="Complete Your Scorecard"
                  description="Answer questions about your business financials so we can calculate your True Readiness Score."
                  state="current"
                  isLast={false}
                >
                  <button
                    onClick={onContinueScorecard}
                    className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: EMERALD }}
                  >
                    Continue Scorecard
                    <ArrowRightIcon />
                  </button>
                </StepItem>

                {/* Step 2: Upload docs */}
                <StepItem
                  stepNumber={2}
                  title="Upload Documents"
                  description="Tax returns, financial statements, and supporting documents."
                  state="locked"
                  isLast={false}
                />

                {/* Step 3: Report */}
                <StepItem
                  stepNumber={3}
                  title="Get Your Readiness Report"
                  description="Receive your True Readiness Score and bank-ready document package."
                  state="locked"
                  isLast={true}
                />
              </div>
            </div>
          </>
        )}

        {/* ─── State B variant: DIY scorecard submitted ─── */}
        {submission && !isAdvisorTier && scorecardDone && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${EMERALD}12`, color: EMERALD }}
              >
                Bank Ready
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-8">
              Great progress! Here's where you stand.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="space-y-0">
                <StepItem
                  stepNumber={1}
                  title="Complete Your Scorecard"
                  description="Your scorecard has been submitted."
                  state="done"
                  isLast={false}
                />
                <StepItem
                  stepNumber={2}
                  title="Upload Documents"
                  description="Tax returns, financial statements, and supporting documents."
                  state={status === 'confirmed' || status === 'report_released' ? 'done' : 'current'}
                  isLast={false}
                />
                <StepItem
                  stepNumber={3}
                  title="Get Your Readiness Report"
                  description="Receive your True Readiness Score and bank-ready document package."
                  state={status === 'report_released' ? 'done' : 'locked'}
                  isLast={true}
                />
              </div>
            </div>
          </>
        )}

        {/* ─── State C: Advisor tier, submitted ─── */}
        {submission && isAdvisorTier && status === 'submitted' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              {tierInfo && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}12`, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-8">
              Your application is being processed by our team.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${EMERALD}10` }}>
                  <ShieldIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>
                    Your File Is With Your Advisor
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your file is with your advisor. We'll reach out within 1 business day.
                  </p>
                </div>
              </div>

              {/* Visual timeline */}
              <div className="flex items-center gap-0 py-4">
                {/* Submitted */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: EMERALD }}>
                    <CheckCircleIcon size={16} color="#FFFFFF" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: EMERALD }}>Submitted</span>
                </div>
                {/* Connector */}
                <div className="h-0.5 flex-1 -mx-2" style={{ backgroundColor: EMERALD }} />
                {/* Under Review (current, pulsing) */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${GOLD}20`, border: `2px solid ${GOLD}` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: GOLD }}>Under Review</span>
                </div>
                {/* Connector */}
                <div className="h-0.5 flex-1 -mx-2 bg-slate-200" />
                {/* Decision */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-200 bg-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-2 text-slate-400">Decision</span>
                </div>
              </div>

              {/* Submitted date */}
              {submission.submitted_at && (
                <p className="text-[11px] text-slate-400 mt-4 text-center">
                  Submitted on {new Date(submission.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </>
        )}

        {/* ─── State C variant: Advisor tier, under_review ─── */}
        {submission && isAdvisorTier && status === 'under_review' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              {tierInfo && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}12`, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-8">
              Your advisor is actively reviewing your file.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${NAVY}08` }}>
                  <ShieldIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>
                    Your Advisor Is Reviewing Your File
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We'll notify you as soon as the review is complete.
                  </p>
                </div>
              </div>

              {/* Visual timeline */}
              <div className="flex items-center gap-0 py-4">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: EMERALD }}>
                    <CheckCircleIcon size={16} color="#FFFFFF" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: EMERALD }}>Submitted</span>
                </div>
                <div className="h-0.5 flex-1 -mx-2" style={{ backgroundColor: EMERALD }} />
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${EMERALD}20`, border: `2px solid ${EMERALD}` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EMERALD }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: EMERALD }}>Under Review</span>
                </div>
                <div className="h-0.5 flex-1 -mx-2 bg-slate-200" />
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-200 bg-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-2 text-slate-400">Decision</span>
                </div>
              </div>

              {submission.submitted_at && (
                <p className="text-[11px] text-slate-400 mt-4 text-center">
                  Submitted on {new Date(submission.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </>
        )}

        {/* ─── State D: Advisor tier, confirmed ─── */}
        {submission && isAdvisorTier && status === 'confirmed' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              {tierInfo && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}12`, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${EMERALD}12` }}>
                  <CheckCircleIcon size={28} color={EMERALD} />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                Your File Has Been Confirmed
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">
                Your readiness analysis is complete. Your advisor has confirmed your file. Check your email for next steps.
              </p>

              {/* Tier-specific CTA */}
              {tier === 'loan_ready' && (
                <div className="mb-6">
                  <button
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: EMERALD }}
                  >
                    Book Your Strategy Session
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline ml-2" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              {tier === 'approved' && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600 font-medium">Your advisor will be in touch within 24 hours.</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-5 text-left max-w-sm mx-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Next Steps</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${EMERALD}15` }}>
                      <CheckCircleIcon size={12} color={EMERALD} />
                    </div>
                    <span className="text-xs text-slate-600 leading-relaxed">Check your email for details from your advisor</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${EMERALD}15` }}>
                      <CheckCircleIcon size={12} color={EMERALD} />
                    </div>
                    <span className="text-xs text-slate-600 leading-relaxed">Prepare any questions about your loan package</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${EMERALD}15` }}>
                      <CheckCircleIcon size={12} color={EMERALD} />
                    </div>
                    <span className="text-xs text-slate-600 leading-relaxed">Review your readiness report when it arrives</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── State E: Advisor tier, needs_info ─── */}
        {submission && isAdvisorTier && status === 'needs_info' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              {tierInfo && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}12`, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
              )}
            </div>

            <div className="bg-white rounded-xl border-2 p-6 sm:p-8" style={{ borderColor: '#DC444430' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(220,68,68,0.08)' }}>
                  <MailIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>
                    Your Advisor Needs One More Thing
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Your advisor needs one more thing before completing your review. Check your email for details.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    If you don't see the email, check your spam folder or reach out to your advisor directly.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── State: Advisor tier, report_released ─── */}
        {submission && isAdvisorTier && status === 'report_released' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
                {businessName || `Welcome, ${firstName}`}
              </h1>
              {tierInfo && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tierInfo.color}12`, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircleIcon size={48} color={EMERALD} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>
                Your Report Is Ready
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">
                Your True Readiness Score report has been released. Check your email for the full report.
              </p>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

// ─── Step Item (vertical timeline) ───

interface StepItemProps {
  stepNumber: number;
  title: string;
  description: string;
  state: 'done' | 'current' | 'locked';
  isLast: boolean;
  children?: React.ReactNode;
}

const StepItem: React.FC<StepItemProps> = ({ stepNumber, title, description, state, isLast, children }) => {
  const circleSize = 32;

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        {state === 'done' && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: EMERALD }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {state === 'current' && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
            style={{ borderColor: EMERALD, backgroundColor: `${EMERALD}08` }}
          >
            <span className="text-xs font-bold" style={{ color: EMERALD }}>{stepNumber}</span>
          </div>
        )}
        {state === 'locked' && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-slate-200 bg-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#CBD5E1" aria-hidden="true">
              <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V6a3 3 0 0 1 3-3z" />
            </svg>
          </div>
        )}
        {/* Connector line */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[40px]"
            style={{
              backgroundColor: state === 'done' ? EMERALD : '#E2E8F0',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
        <h3
          className="text-sm font-bold mb-0.5"
          style={{ color: state === 'locked' ? '#94A3B8' : NAVY }}
        >
          {title}
        </h3>
        <p
          className="text-xs leading-relaxed"
          style={{ color: state === 'locked' ? '#CBD5E1' : '#64748B' }}
        >
          {description}
        </p>
        {children}
      </div>
    </div>
  );
};

export default ClientDashboard;
