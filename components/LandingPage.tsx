
import React, { useEffect, useMemo, useState } from 'react';
import { DocumentType } from '../types';
import { Icon, type IconName } from './Icon';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onDocClick: (type: DocumentType) => void;
  onScorecard?: () => void;
  onAdmin?: () => void;
  onTierClick?: (tier: 'bank_ready' | 'loan_ready' | 'approved') => void;
  user?: { name: string; email: string; isAdmin?: boolean } | null;
  onLogout?: () => void;
  onAdminDashboard?: () => void;
}

// Editorial fintech palette.
// Deep forest green = institutional trust. Action green = approval/growth. Amber = premium moments only.
const NAVY = '#0B2820';
const NAVY_DEEP = '#071E17';
const NAVY_HOVER = '#0E3329';
const EMERALD = '#1D9E75';
const GOLD = '#BA7517';

type TierKey = 'bank_ready' | 'loan_ready' | 'approved';


interface Tier {
  key: TierKey;
  name: string;
  price: string;
  cadence: string;
  priceNote?: string;
  tagline: string;
  badge?: string;
  ctaLabel: string;
  keyFeatures: string[];
  extraFeatures: string[];
  highlight?: boolean;
  premium?: boolean;
}

const TIERS: Tier[] = [
  {
    key: 'bank_ready',
    name: 'Bank Ready',
    price: '$297',
    cadence: 'one-time',
    priceNote: 'Instant access. No expiration.',
    tagline: 'The DIY package banks actually want to see.',
    ctaLabel: 'Get Bank Ready',
    keyFeatures: [
      'Full loan document package generator',
      'Five C\'s loan readiness scorecard',
      '"What Banks Look For" institutional guide (PDF)'
    ],
    extraFeatures: [
      'Business cash flow calculator (EBIDA)',
      'Collateral worksheet with LTV rates'
    ]
  },
  {
    key: 'loan_ready',
    name: 'Loan Ready',
    price: '$2,497',
    cadence: 'one-time',
    priceNote: 'Most clients recoup this in the first month of approved financing.',
    tagline: 'Every Bank Ready feature — plus a banker in your corner.',
    badge: 'MOST POPULAR',
    ctaLabel: 'Get Loan Ready',
    highlight: true,
    keyFeatures: [
      'Everything in Bank Ready',
      'Lender-side financial review — we read your numbers the way a credit analyst does',
      '60-minute 1:1 strategy session with a packaging specialist'
    ],
    extraFeatures: [
      'Leverage ratio analysis + debt service verification',
      'Personal cash flow review (what banks see on your personal return)'
    ]
  },
  {
    key: 'approved',
    name: 'Approved',
    price: '$7,997',
    cadence: 'engagement',
    priceNote: 'By application only. Limited availability.',
    tagline: 'For founders who were already declined — and refuse to be again.',
    badge: 'PRIORITY',
    ctaLabel: 'Apply Now',
    premium: true,
    keyFeatures: [
      'Everything in Loan Ready',
      'Decline diagnosis — forensic map of exactly what killed your last application',
      'Lender targeting matched to your loan size, industry, and credit profile'
    ],
    extraFeatures: [
      'Full document build-out — we build everything, you review and sign',
      '30-day support window from application submission to decision'
    ]
  }
];

const PROOF_POINTS = [
  { label: 'Built on the framework', value: 'banks actually score on' },
  { label: 'Save hours of prep', value: 'bank-ready in 15 minutes' },
  { label: 'Used by founders in', value: 'all 50 states' },
  { label: 'Learn to position', value: 'your business like a banker' }
];

const HOW_IT_WORKS: { n: string; icon: IconName; title: string; body: string; accent: string }[] = [
  {
    n: '01',
    icon: 'doc-add',
    title: 'Answer a few guided questions',
    body: 'No blank spreadsheets. Our guided flow asks only what banks care about — you learn what matters as you go. Most finish in under 15 minutes.',
    accent: 'Save hours of prep'
  },
  {
    n: '02',
    icon: 'chart',
    title: 'Learn how a bank sees you',
    body: 'We score you on the same five factors credit analysts use. You walk away understanding your strengths, your gaps, and why each one matters.',
    accent: 'Education built in'
  },
  {
    n: '03',
    icon: 'verified',
    title: 'Get a clear action plan',
    body: "Not ready yet? We show you exactly what to work on and why — so you know how to position your business before you apply. Already strong? We confirm it.",
    accent: 'Position yourself to win'
  },
  {
    n: '04',
    icon: 'lock',
    title: 'Apply with bank-ready documents',
    body: 'Walk in prepared with documents formatted the way underwriters expect. You understand your numbers, you know the story, and there are no surprises.',
    accent: 'Confidence, not hope'
  }
];

const FIVE_FACTORS: { icon: IconName; category: string; label: string; body: string; question: string }[] = [
  {
    icon: 'user-id',
    category: 'Character',
    label: 'Your Credit Profile',
    body: 'Personal credit, public records, banking relationships. Your history tells the bank whether you honor obligations when things get tight.',
    question: 'Are you the kind of borrower a bank can trust to repay?'
  },
  {
    icon: 'dollar',
    category: 'Capacity',
    label: 'Your Cash Flow',
    body: 'Revenue trajectory, debt-service coverage, and the loan purpose itself. Cash — not collateral — is what actually repays a loan.',
    question: 'Can the business afford the payment?'
  },
  {
    icon: 'wallet',
    category: 'Capital',
    label: 'Your Financial Position',
    body: 'Leverage ratio, retained earnings, profitability history. Is the balance sheet strong enough to absorb the new debt without becoming fragile?',
    question: 'Is the business financially resilient?'
  },
  {
    icon: 'home',
    category: 'Collateral',
    label: 'Your Assets',
    body: 'Real estate, equipment, receivables, personal guarantees. Collateral is a secondary source of repayment — not a substitute for cash flow.',
    question: 'What can the bank fall back on if things go wrong?'
  },
  {
    icon: 'globe',
    category: 'Conditions',
    label: 'Your Business Environment',
    body: 'Industry health, geographic market, economic climate. Forces often outside your control — but still scored.',
    question: 'Does the world the business operates in support repayment?'
  }
];

// ─────────── Interactive hero scorecard data ───────────

interface ScoreFactor {
  key: string;
  label: string;
  question: string;
  tooltip?: string;
  choices: { label: string; points: number }[];
}

const HERO_FACTORS: ScoreFactor[] = [
  {
    key: 'credit',
    label: 'Credit Profile',
    question: 'Personal credit score',
    choices: [
      { label: '750+', points: 100 },
      { label: '700–749', points: 80 },
      { label: '650–699', points: 55 },
      { label: 'Under 650', points: 25 }
    ]
  },
  {
    key: 'cashflow',
    label: 'Cash Flow',
    question: 'Annual revenue',
    tooltip: 'Revenue trajectory, debt-service coverage, and the loan purpose itself. Can the business afford the payment?',
    choices: [
      { label: '> $500K', points: 100 },
      { label: '$250K–$500K', points: 75 },
      { label: '$100K–$250K', points: 55 },
      { label: '< $100K', points: 30 }
    ]
  },
  {
    key: 'position',
    label: 'Financial Position',
    question: 'Years profitable',
    tooltip: 'Leverage ratio, retained earnings, profitability history. Is the balance sheet strong enough to absorb new debt?',
    choices: [
      { label: '3+ years', points: 100 },
      { label: '1–2 years', points: 70 },
      { label: 'Break-even', points: 45 },
      { label: 'Losing money', points: 20 }
    ]
  },
  {
    key: 'assets',
    label: 'Assets',
    question: 'Best collateral available',
    tooltip: 'Real estate, equipment, receivables, personal guarantees. What can the bank fall back on if things go wrong?',
    choices: [
      { label: 'Real estate', points: 100 },
      { label: 'Equipment', points: 75 },
      { label: 'Receivables only', points: 50 },
      { label: 'None', points: 25 }
    ]
  },
  {
    key: 'environment',
    label: 'Business Environment',
    question: 'Time in business',
    tooltip: 'Industry health, geographic market, economic climate. Forces outside your control — but still scored by the bank.',
    choices: [
      { label: '5+ years', points: 100 },
      { label: '2–5 years', points: 75 },
      { label: '1–2 years', points: 50 },
      { label: 'Under 1 year', points: 25 }
    ]
  }
];

interface ScoreBand {
  label: string;
  message: string;
  color: string;
}

function getBand(score: number): ScoreBand {
  if (score >= 80) return { label: 'STRONG', message: "You're likely to qualify.", color: '#1D9E75' };
  if (score >= 60) return { label: 'GOOD', message: 'A few gaps to address.', color: '#BA7517' };
  if (score >= 40) return { label: 'FAIR', message: 'You can qualify with prep.', color: '#E89B3C' };
  return { label: 'NEEDS WORK', message: "Let's identify the blockers.", color: '#DC4444' };
}

function barColor(points: number): string {
  if (points >= 80) return '#1D9E75';
  if (points >= 60) return '#BA7517';
  if (points >= 40) return '#E89B3C';
  return '#DC4444';
}

// Animated count-up for the score number
function useCountUp(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const start = value;
    const delta = target - start;
    if (delta === 0) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(start + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

const HeroScoreCard: React.FC<{ onCTAClick: () => void }> = ({ onCTAClick }) => {
  const [picks, setPicks] = useState<Record<string, number>>({});

  const { score, answered } = useMemo(() => {
    const values = HERO_FACTORS.map((f) => picks[f.key]).filter((v): v is number => v !== undefined);
    if (values.length === 0) return { score: 0, answered: 0 };
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return { score: avg, answered: values.length };
  }, [picks]);

  const animatedScore = useCountUp(score, 450);
  const band = getBand(score);
  const isComplete = answered === HERO_FACTORS.length;
  const showResults = answered > 0;

  return (
    <div className="relative">
      {/* Gold corner accent */}
      <div
        className="absolute -top-3 -right-3 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-lg z-10"
        style={{ backgroundColor: '#BA7517', color: '#FFFFFF' }}
      >
        Loan Readiness Score
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-7 border-t-4" style={{ borderTopColor: showResults ? band.color : '#1D9E75' }}>
        {/* Header / score */}
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {showResults ? 'Your readiness' : 'Score yourself in 30 seconds'}
          </div>
          {showResults && (
            <div
              className="text-[11px] font-bold tracking-wider transition-colors"
              style={{ color: band.color }}
            >
              {band.label}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <div
            className="text-[42px] sm:text-[56px] md:text-[68px] font-bold tracking-tighter leading-none transition-colors"
            style={{ color: showResults ? '#0B2820' : '#CBD5E1' }}
          >
            {showResults ? animatedScore : '—'}
          </div>
          <div className="text-2xl font-bold text-slate-300">/100</div>
        </div>

        <div className="text-xs text-slate-500 mb-5 min-h-[18px]">
          {showResults
            ? band.message
            : `Answer ${HERO_FACTORS.length} quick questions to see your score.`}
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-5">
          {HERO_FACTORS.map((f) => {
            const selectedPoints = picks[f.key];
            return (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{f.label}</div>
                    {f.tooltip && (
                      <div className="relative group/tip">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="cursor-help hover:stroke-slate-600 transition-colors"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg bg-slate-800 text-[10px] text-white leading-relaxed opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
                          {f.tooltip}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedPoints !== undefined && (
                    <div
                      className="text-[10px] font-bold transition-colors"
                      style={{ color: barColor(selectedPoints) }}
                    >
                      {selectedPoints}
                    </div>
                  )}
                </div>

                {/* Bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${selectedPoints || 0}%`,
                      backgroundColor: selectedPoints !== undefined ? barColor(selectedPoints) : 'transparent'
                    }}
                  />
                </div>

                {/* Choice chips */}
                <div className="flex flex-wrap gap-1.5">
                  {f.choices.map((c) => {
                    const active = selectedPoints === c.points;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setPicks((p) => ({ ...p, [f.key]: c.points }))}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border"
                        style={{
                          backgroundColor: active ? '#0B2820' : '#FFFFFF',
                          color: active ? '#FFFFFF' : '#475569',
                          borderColor: active ? '#0B2820' : '#E2E8F0'
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={onCTAClick}
          disabled={!isComplete}
          className="w-full py-3.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isComplete ? band.color : '#E2E8F0',
            color: isComplete ? '#FFFFFF' : '#94A3B8'
          }}
        >
          {isComplete ? 'See your full breakdown' : `${HERO_FACTORS.length - answered} questions left`}
          {isComplete && <Icon name="arrow-right" size={16} />}
        </button>

        <div className="mt-3 text-center text-[10px] text-slate-400 uppercase tracking-wider">
          No email required to score
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, onDocClick, onScorecard, onAdmin, onTierClick, user, onLogout, onAdminDashboard }) => {
  const [expandedTiers, setExpandedTiers] = useState<Record<TierKey, boolean>>({
    bank_ready: false,
    loan_ready: false,
    approved: false
  });

  const toggleTier = (key: TierKey) =>
    setExpandedTiers((s) => ({ ...s, [key]: !s[key] }));

  const handleTierClick = (tier: TierKey) => {
    if (onTierClick) {
      // Route all tiers through the intake questionnaire
      onTierClick(tier);
    } else if (tier === 'bank_ready' && onScorecard) {
      onScorecard();
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ─────────── Top trust strip ─────────── */}
      <div className="hidden md:block border-b border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <Icon name="shield-check" size={16} style={{ color: EMERALD }} />
            Bank-grade document standards
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Icon name="lock" size={16} style={{ color: NAVY }} />
              SOC-aligned data handling
            </span>
            <span className="flex items-center gap-2">
              <Icon name="verified" size={16} style={{ color: NAVY }} />
              SBA, conventional & SBLC ready
            </span>
          </div>
        </div>
      </div>

      {/* ─────────── Header ─────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: NAVY }}
            >
              <Icon name="bank" size={18} style={{ color: '#5DDBA8' }} />
            </div>
            <div className="leading-none">
              <div className="text-sm sm:text-lg font-bold tracking-tight" style={{ color: NAVY }}>
                BankReady<span className="font-extrabold">Docs</span>
              </div>
              <div className="hidden sm:block text-[9px] font-semibold tracking-[0.15em] text-slate-400 uppercase mt-0.5">
                Know Before You Apply
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#not-for" className="hover:text-slate-900 transition-colors">Who it's for</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={onScorecard || onGetStarted}
              className="hidden sm:block px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all hover:shadow-md"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              Score Yourself <span className="ml-0.5">&rarr;</span>
            </button>
            {user ? (
              <>
                {user.isAdmin && onAdminDashboard && (
                  <button
                    onClick={onAdminDashboard}
                    className="hidden sm:block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all hover:shadow-md"
                    style={{ backgroundColor: NAVY, color: '#5DDBA8' }}
                  >
                    Admin
                  </button>
                )}
                <span className="hidden sm:block text-xs sm:text-sm font-semibold text-slate-600 truncate max-w-[120px]">
                  {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={onLogout}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={onGetStarted}
                  className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: NAVY }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = NAVY_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: NAVY_DEEP }}>
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Top accent bar — emerald + gold pinstripe (very bank) */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1" style={{ backgroundColor: EMERALD }}></div>
          <div className="w-32" style={{ backgroundColor: GOLD }}></div>
          <div className="flex-1" style={{ backgroundColor: EMERALD }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-12 sm:pt-24 pb-16 sm:pb-32">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] mb-8"
                style={{ backgroundColor: 'rgba(15, 138, 107, 0.15)', color: '#5EE2B8' }}
              >
                <Icon name="medal" size={14} />
                The Loan Readiness Program — Now Available
              </div>

              <h1 className="font-serif-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.08] tracking-tight mb-4 sm:mb-6">
                Learn what banks look for.<br />
                Build your file{' '}
                <span style={{ color: '#5DDBA8' }}>in minutes</span>.
              </h1>

              <p className="text-sm sm:text-lg md:text-xl text-slate-300 leading-relaxed mb-6 sm:mb-10 max-w-2xl">
                Banks score every application on five factors — but they never share the framework.
                BankReadyDocs teaches you what those factors are, shows you exactly where your
                business stands on each one, and generates bank-ready documents while you learn.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-bold text-white shadow-2xl transition-all hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                  style={{ backgroundColor: EMERALD }}
                >
                  See the Program
                  <Icon name="arrow-right" size={20} />
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-bold text-white border border-white/20 hover:bg-white/5 transition-all"
                >
                  How it works
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Icon name="check-circle" size={18} style={{ color: '#5DDBA8' }} />
                  No credit pull
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check-circle" size={18} style={{ color: '#5DDBA8' }} />
                  No bank required
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check-circle" size={18} style={{ color: '#5DDBA8' }} />
                  Start in 5 minutes
                </div>
              </div>
            </div>

            {/* Interactive hero scorecard */}
            <div className="lg:col-span-5">
              <HeroScoreCard onCTAClick={onScorecard || onGetStarted} />
            </div>
          </div>
        </div>

        {/* Bottom proof strip */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4 sm:py-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {PROOF_POINTS.map((p) => (
              <div key={p.label} className="text-center">
                <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1">{p.label}</div>
                <div className="text-sm font-bold text-white">{p.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Origin story ─────────── */}
      <section className="py-10 sm:py-20 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-3">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: EMERALD }}
              >
                Why we exist
              </div>
              <div
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: GOLD }}
              ></div>
            </div>
            <div className="md:col-span-9">
              <h2
                className="font-serif-display text-3xl md:text-4xl font-normal leading-tight mb-8"
                style={{ color: NAVY }}
              >
                Banks train their staff on <em style={{ color: EMERALD, fontStyle: 'italic' }}>exactly</em> what
                qualifies a business for a loan.<br />
                Business owners never see that training.
              </h2>
              <div className="space-y-5 text-base text-slate-600 leading-relaxed">
                <p>
                  I've sat on the banker's side of the table. I've seen the frameworks, the
                  scoring models, the five factors every application gets evaluated against. I
                  know what a credit analyst is looking for when they open your file — and I know
                  that most business owners have no idea.
                </p>
                <p>
                  That's not the business owner's fault. That information lives inside bank
                  training programs. It doesn't get shared. So founders apply blind — they submit
                  what they <em>think</em> the bank wants, get declined or countered, and never fully
                  understand why.
                </p>
                <p>
                  BankReadyDocs exists to close that gap.{' '}
                  <strong style={{ color: NAVY }}>Not to guarantee you get approved — that's the bank's decision.</strong>{' '}
                  But to make sure that when you apply, you understand your own financial picture
                  the way a credit analyst sees it — and you can build the documents to match in
                  minutes, not weeks. No surprises. No guessing. Just clarity.
                </p>
              </div>

              {/* Testimonial */}
              <div
                className="mt-8 p-6 rounded-xl bg-slate-50"
                style={{ borderLeft: `4px solid ${GOLD}` }}
              >
                <p className="text-base text-slate-700 leading-relaxed italic">
                  "Definitely a timesaver, and also great education on how to place your business
                  in the best position."
                </p>
                <p className="text-sm text-slate-400 mt-2 font-semibold">— BankReadyDocs client</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Program intro ─────────── */}
      <section id="program" className="py-12 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* Heading block */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: EMERALD }}>
              The BankReadyDocs Program
            </div>
            <h2 className="font-serif-display text-4xl md:text-5xl font-normal tracking-tight mb-6" style={{ color: NAVY }}>
              You can't fix what<br />you can't <span style={{ color: EMERALD }}>see</span>.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-3">
              Most applicants walk into a bank without knowing how their file will be read.
              BankReadyDocs shows you exactly what a credit analyst sees — before you apply.
            </p>
            <p className="text-sm text-slate-400 italic">
              We don't make you a borrower banks say yes to. We make sure you understand your own
              picture clearly enough to know if you're ready to apply.
            </p>
          </div>

          {/* Explainer paragraph */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-base text-slate-600 leading-relaxed">
              Most loan-document tools hand you a template and disappear. BankReadyDocs walks you
              through the <strong style={{ color: NAVY }}>same five-factor framework banks use</strong> when
              they evaluate every application — so you know where you're strong, where you're weak,
              and what to address before you sit across the desk from a banker.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-20">
            {[
              { value: '5', text: 'factors every bank scores on every application' },
              { value: '1 in 3', text: 'small business loan applications are declined — most without a clear explanation' },
              { value: '15 min', text: 'to see your readiness score across all five factors' },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: NAVY }}>{stat.value}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{stat.text}</div>
              </div>
            ))}
          </div>

          {/* Five C's section label */}
          <div className="text-center mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              The five things every bank looks at — most applicants don't know all five
            </div>
          </div>

          {/* Five factors — 2-column grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {FIVE_FACTORS.slice(0, 4).map((f) => (
              <div
                key={f.label}
                className="bg-white rounded-xl p-7 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(27, 67, 50, 0.06)' }}
                  >
                    <Icon name={f.icon} size={24} style={{ color: NAVY }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: EMERALD }}>
                      {f.category}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: NAVY }}>{f.label}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{f.body}</p>
                <p className="text-sm italic" style={{ color: EMERALD }}>{f.question}</p>
              </div>
            ))}
          </div>

          {/* Fifth factor — standalone centered card */}
          {(() => {
            const f = FIVE_FACTORS[4];
            return (
              <div className="max-w-md mx-auto mb-16">
                <div className="bg-white rounded-xl p-7 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(27, 67, 50, 0.06)' }}
                    >
                      <Icon name={f.icon} size={24} style={{ color: NAVY }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: EMERALD }}>
                        {f.category}
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: NAVY }}>{f.label}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{f.body}</p>
                  <p className="text-sm italic" style={{ color: EMERALD }}>{f.question}</p>
                </div>
              </div>
            );
          })()}

          {/* "What BankReadyDocs actually does" callout */}
          <div className="max-w-4xl mx-auto">
            <div
              className="rounded-2xl p-8 bg-white border border-slate-200"
              style={{ borderLeft: `4px solid ${EMERALD}` }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: EMERALD }}>
                What BankReadyDocs Actually Does
              </div>
              <p className="text-base text-slate-700 leading-relaxed">
                We score you on all five factors <strong style={{ color: NAVY }}>before you apply</strong> — the
                same way a credit analyst would. If you're strong across the board, you'll know it. If there's
                a gap, you'll know exactly what it is and what to do about it.{' '}
                <strong style={{ color: NAVY }}>No template. No disappearing act.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── How it works ─────────── */}
      <section id="how-it-works" className="py-12 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: EMERALD }}>
              How it works
            </div>
            <h2 className="font-serif-display text-4xl md:text-5xl font-normal tracking-tight mb-6" style={{ color: NAVY }}>
              Skip the guesswork.<br /><em style={{ color: EMERALD, fontStyle: 'italic' }}>Learn what banks look for.</em>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-3">
              Hours of research, scattered templates, confusing requirements — replaced by a
              guided process that teaches you what matters as you build your file. Most
              founders finish in one sitting.
            </p>
            <p className="text-sm text-slate-400 italic">
              Not just a timesaver — an education on how to position your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(27, 67, 50, 0.06)' }}
                  >
                    <Icon name={step.icon} size={28} style={{ color: NAVY }} />
                  </div>
                  <div className="text-5xl font-bold opacity-[0.07]" style={{ color: NAVY }}>
                    {step.n}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: NAVY }}>{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{step.body}</p>
                <div className="mt-5 text-sm font-semibold" style={{ color: EMERALD }}>
                  {step.accent} <span className="inline-block ml-0.5">&rarr;</span>
                </div>
              </div>
            ))}
          </div>

          {/* The Honest Truth callout */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="border border-slate-200 rounded-2xl p-8 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: EMERALD }}>
                What Our Clients Say
              </div>
              <p className="text-base text-slate-700 leading-relaxed italic">
                "Definitely a timesaver, and also great education on how to place your business
                in the best position."
              </p>
              <p className="text-sm text-slate-400 mt-2 font-semibold">— BankReadyDocs client</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Pricing / Tiers ─────────── */}
      <section id="pricing" className="py-12 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: EMERALD }}>
              Choose your level
            </div>
            <h2 className="font-serif-display text-4xl md:text-5xl font-normal tracking-tight mb-6" style={{ color: NAVY }}>
              Save time. Learn the process.<br /><em style={{ color: EMERALD, fontStyle: 'italic' }}>Apply prepared.</em>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Every tier gives you the same education on how banks evaluate your business —
              pick the level of hands-on support that matches where you are.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {TIERS.map((tier) => {
              const isHighlight = tier.highlight;
              const isPremium = tier.premium;
              const cardBg = isPremium ? NAVY_DEEP : '#FFFFFF';
              const textColor = isPremium ? '#FFFFFF' : NAVY;
              const subTextColor = isPremium ? '#94A3B8' : '#64748B';

              return (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl p-8 transition-all hover:-translate-y-1 ${
                    isHighlight ? 'shadow-2xl scale-105 lg:scale-105 z-10' : 'shadow-md hover:shadow-xl'
                  }`}
                  style={{
                    backgroundColor: cardBg,
                    border: isHighlight ? `2px solid ${EMERALD}` : isPremium ? `1px solid ${GOLD}` : '1px solid #E2E8F0'
                  }}
                >
                  {tier.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase shadow-lg whitespace-nowrap"
                      style={{
                        backgroundColor: isPremium ? GOLD : EMERALD,
                        color: isPremium ? NAVY_DEEP : '#FFFFFF'
                      }}
                    >
                      {tier.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: isPremium ? GOLD : EMERALD }}>
                      Tier {tier.key === 'bank_ready' ? '01' : tier.key === 'loan_ready' ? '02' : '03'}
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>{tier.name}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: subTextColor }}>{tier.tagline}</p>
                  </div>

                  <div className="mb-8 pb-8 border-b" style={{ borderColor: isPremium ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter" style={{ color: textColor }}>{tier.price}</span>
                      <span className="text-sm font-semibold" style={{ color: subTextColor }}>{tier.cadence}</span>
                    </div>
                    {tier.priceNote && (
                      <div className="mt-2 text-xs italic" style={{ color: subTextColor }}>{tier.priceNote}</div>
                    )}
                  </div>

                  {(() => {
                    const isExpanded = expandedTiers[tier.key];
                    const visible = isExpanded
                      ? [...tier.keyFeatures, ...tier.extraFeatures]
                      : tier.keyFeatures;
                    return (
                      <div className="mb-6">
                        <ul className="space-y-3">
                          {visible.map((feat) => (
                            <li
                              key={feat}
                              className="flex items-start gap-3 text-sm"
                              style={{ color: isPremium ? '#E2E8F0' : '#475569' }}
                            >
                              <Icon
                                name="check-circle"
                                size={18}
                                style={{
                                  color: isPremium ? GOLD : EMERALD,
                                  flexShrink: 0,
                                  marginTop: 2
                                }}
                              />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                        {tier.extraFeatures.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleTier(tier.key)}
                            className="mt-4 text-xs font-bold uppercase tracking-wider transition-colors"
                            style={{ color: isPremium ? GOLD : EMERALD }}
                          >
                            {isExpanded
                              ? '− Hide full feature list'
                              : `+ See ${tier.extraFeatures.length} more features`}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => handleTierClick(tier.key)}
                    className="w-full py-4 rounded-lg text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: isPremium ? GOLD : isHighlight ? EMERALD : NAVY,
                      color: isPremium ? NAVY_DEEP : '#FFFFFF'
                    }}
                  >
                    {tier.ctaLabel}
                    <Icon name="arrow-right" size={16} />
                  </button>

                  {isPremium && (
                    <div className="mt-4 text-center text-[11px] uppercase tracking-wider font-semibold" style={{ color: GOLD }}>
                      By application only
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center text-sm text-slate-500">
            All tiers include lifetime access to your document workspace.
            Questions? <button onClick={onGetStarted} className="font-semibold underline" style={{ color: NAVY }}>Talk to our team</button>.
          </div>
        </div>
      </section>

      {/* ─────────── Who this isn't for ─────────── */}
      <section id="not-for" className="py-10 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: '#94A3B8' }}
            >
              Honest disclosure
            </div>
            <h2
              className="font-serif-display text-3xl md:text-4xl font-normal tracking-tight mb-4"
              style={{ color: NAVY }}
            >
              Who BankReadyDocs <em>isn't</em> for.
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto">
              We'd rather lose a sale than waste your money. If any of this sounds like you,
              we're not the right fit — and we'll tell you that before you check out.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              {
                title: 'Pre-revenue startups',
                body: "Banks don't lend to ideas. If you have zero revenue, no contracts in hand, and no collateral, our scorecard will be brutally honest with you. Save your money — go build the revenue first."
              },
              {
                title: "Founders looking for unsecured lines under $25K",
                body: "For small unsecured needs, a credit-card stacking service or a CDFI microloan is faster and cheaper than what we do. We're built for $50K+ secured/term-loan applications."
              },
              {
                title: "Anyone wanting a yes without doing the work",
                body: "We don't fabricate financials. We don't coach you to lie. If your DSCR is 0.6 and you want us to make it look like 1.4, we're going to decline you — and so will the bank."
              },
              {
                title: "Founders who already have a banker on retainer",
                body: "If your existing banker is already packaging your file and walking it through underwriting, you don't need us layered on top. Stick with the relationship."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                    style={{ backgroundColor: '#94A3B8' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold leading-snug" style={{ color: NAVY }}>
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed pl-9">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Still not sure?{' '}
              <button
                onClick={onGetStarted}
                className="font-semibold underline"
                style={{ color: NAVY }}
              >
                Run the scorecard
              </button>{' '}
              — if you don't qualify for any tier, we'll tell you.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── Documents section ─────────── */}
      <section id="documents" className="py-12 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: EMERALD }}>
              Document Generator
            </div>
            <h2 className="font-serif-display text-4xl md:text-5xl font-normal tracking-tight mb-4" style={{ color: NAVY }}>
              The documents banks actually ask for.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Not templates. Guided builders that ask the right questions and output documents
              formatted the way underwriters expect to receive them.
            </p>
          </div>

          {/* First 4 documents — 2-column grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[
              {
                type: DocumentType.PFS,
                icon: 'user-id' as IconName,
                title: 'Personal Financial Statement',
                badge: 'Most Used',
                badgeColor: EMERALD,
                body: 'Required on almost every application over $250K. Banks use this to see your full personal picture — assets, liabilities, and net worth — alongside the business.',
                link: 'Lenders require this',
              },
              {
                type: DocumentType.DEBT_SCHEDULE,
                icon: 'doc-text' as IconName,
                title: 'Debt Schedule',
                badge: 'Required',
                badgeColor: EMERALD,
                body: 'A complete list of all business obligations — balances, monthly payments, maturity dates. Banks use this to calculate your debt service before they run your DSCR.',
                link: 'Feeds your DSCR calculation',
              },
              {
                type: DocumentType.INCOME_STATEMENT,
                icon: 'chart' as IconName,
                title: 'Income Statement',
                badge: 'Required',
                badgeColor: EMERALD,
                body: 'Your P&L shows the bank your revenue trend and true profitability. This is where EBIDA is calculated — the number banks use to measure your repayment capacity.',
                link: 'Where EBIDA lives',
              },
              {
                type: DocumentType.BALANCE_SHEET,
                icon: 'wallet' as IconName,
                title: 'Balance Sheet',
                badge: 'Required',
                badgeColor: EMERALD,
                body: 'A snapshot of what the business owns and owes at a point in time. Banks use this to calculate your leverage ratio and assess capital strength.',
                link: 'Leverage ratio source',
              },
            ].map((doc) => (
              <div
                key={doc.type}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all group"
              >
                {/* Dark header */}
                <div
                  className="px-6 py-5 flex items-center justify-between"
                  style={{ backgroundColor: NAVY }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Icon name={doc.icon} size={22} style={{ color: '#5DDBA8' }} />
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: doc.badgeColor, color: '#FFFFFF' }}
                  >
                    {doc.badge}
                  </div>
                </div>
                {/* Body */}
                <div className="px-6 py-6">
                  <h3 className="text-lg font-bold mb-3" style={{ color: NAVY }}>{doc.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{doc.body}</p>
                  <p className="text-sm italic mb-5" style={{ color: EMERALD }}>
                    &larr; {doc.link}
                  </p>
                  <button
                    onClick={() => onDocClick(doc.type)}
                    className="w-full py-3 rounded-lg text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 hover:shadow-md"
                    style={{ borderColor: NAVY, color: NAVY }}
                  >
                    Start Building <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cash Flow Projection — featured standalone card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <div
              className="px-8 py-6 flex items-center justify-between"
              style={{ backgroundColor: NAVY }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Icon name="chart" size={24} style={{ color: '#5DDBA8' }} />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-0.5">
                    Most Critical for SBA
                  </div>
                  <h3 className="text-xl font-bold text-white">Cash Flow Projection</h3>
                </div>
              </div>
              <div
                className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ backgroundColor: EMERALD, color: '#FFFFFF' }}
              >
                SBA Required
              </div>
            </div>
            <div className="px-8 py-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Required for most SBA 7(a) and 504 applications. This document shows the bank{' '}
                <strong style={{ color: NAVY }}>how the business will generate enough cash to service the new debt going forward</strong> —
                not just historically, but projected. Banks treat a weak projection as a red flag.
                A well-built one is one of the strongest things in your file.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['SBA 7(a)', 'SBA 504', 'Conventional term loans', 'Line of credit renewals'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onDocClick(DocumentType.CASH_FLOW_PROJECTION)}
                className="py-3 px-6 rounded-lg text-sm font-bold border-2 transition-all flex items-center gap-2 hover:shadow-md"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                Start Building <span className="text-lg leading-none">+</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Final CTA ─────────── */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: NAVY_DEEP }}>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        ></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] mb-8"
            style={{ backgroundColor: 'rgba(197, 165, 114, 0.15)', color: GOLD }}>
            <Icon name="shield-check" size={14} />
            Know Before You Apply
          </div>
          <h2 className="font-serif-display text-2xl sm:text-4xl md:text-6xl font-normal text-white tracking-tight mb-4 sm:mb-6 leading-[1.08]">
            Stop guessing. Start <em style={{ color: '#5DDBA8', fontStyle: 'italic' }}>knowing.</em>
          </h2>
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2 sm:px-0">
            Save hours of prep. Learn exactly how banks evaluate your business. Build your file
            in minutes — and walk in knowing where you stand.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base font-bold transition-colors"
              style={{ color: '#5DDBA8' }}
            >
              See Your Readiness — From $297 <span className="ml-1">&rarr;</span>
            </button>
            <button
              onClick={onScorecard || onGetStarted}
              className="text-base font-bold text-slate-400 hover:text-white transition-colors"
            >
              Explore the Scorecard <span className="ml-1">&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
                style={{ backgroundColor: NAVY }}
              >
                <Icon name="bank" size={20} style={{ color: '#5DDBA8' }} />
              </div>
              <div>
                <div className="text-base font-bold" style={{ color: NAVY }}>
                  BankReady<span style={{ color: EMERALD }}>Docs</span>
                </div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-[0.15em]">
                  Know Before You Apply
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-600">
              <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
              <a href="#pricing" className="hover:text-slate-900">Pricing</a>
              <a href="#not-for" className="hover:text-slate-900">Who it's for</a>
              <a href="#documents" className="hover:text-slate-900">Documents</a>
              <button onClick={onSignIn} className="hover:text-slate-900">Log in</button>
            </nav>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>© {new Date().getFullYear()} BankReadyDocs. All rights reserved.</div>
            <div className="flex items-center gap-2">
              <Icon name="shield-check" size={16} style={{ color: EMERALD }} />
              Bank-grade document standards · SOC-aligned data handling
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
