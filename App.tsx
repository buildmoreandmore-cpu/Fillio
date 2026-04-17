
import React, { useState, useEffect, useCallback } from 'react';
import { DocumentType, PFSData, AppState } from './types';
import { DOC_OPTIONS, PFS_STEPS } from './constants';
import Layout from './components/Layout';
import StepFlow from './components/StepFlow';
import Summary from './components/Summary';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Paywall from './components/Paywall';
import CapacityScorecard from './components/CapacityScorecard';
import AdminCashFlowWorksheet from './components/AdminCashFlowWorksheet';
import AdminShell from './components/admin/AdminShell';
import SubmissionStatus from './components/SubmissionStatus';
import ClientDashboard from './components/ClientDashboard';
import IntakeQuestionnaire, { type IntakeAnswers } from './components/IntakeQuestionnaire';
import Tier3ApplicationModal from './components/Tier3ApplicationModal';
import { useAuth } from './lib/auth';
import { saveIntakeSubmission, activateProfile } from './lib/intakePersistence';

const INITIAL_PFS_DATA: PFSData = {
  fullName: '',
  asOfDate: new Date().toISOString().split('T')[0],
  cashAssets: [],
  realEstateAssets: [],
  investmentAssets: [],
  realEstateLiabilities: [],
  otherLiabilities: []
};

const App: React.FC = () => {
  const { user, profile, signOut, refreshProfile, isLoading: authLoading } = useAuth();
  const isLoggedIn = !!user;
  const isPro = profile?.is_pro ?? false;

  const [hasPaidForDoc, setHasPaidForDoc] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [view, setView] = useState<'landing' | 'flow' | 'review' | 'paywall' | 'scorecard' | 'admin-worksheet' | 'admin' | 'dashboard'>('landing');
  const [pendingScorecardUpgrade, setPendingScorecardUpgrade] = useState(false);
  const [intakeTier, setIntakeTier] = useState<'bank_ready' | 'loan_ready' | 'approved' | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeAnswers | null>(null);
  const [showTier3Modal, setShowTier3Modal] = useState(false);
  const [pendingTierPurchase, setPendingTierPurchase] = useState(false);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<AppState>({
    selectedDoc: null,
    currentStep: 0,
    data: INITIAL_PFS_DATA
  });

  // Handle Stripe checkout return — detect ?checkout=success on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const type = params.get('type');
      const sessionId = params.get('session_id') || '';
      if (type === 'one-time') {
        setHasPaidForDoc(true);
        setView('review');
      } else if (type === 'scorecard') {
        setView('scorecard');
      } else if (type === 'tier_purchase') {
        // Returning from tier payment — restore intake data from localStorage
        const stored = localStorage.getItem('brd_intake');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < 3600000) {
              setIntakeAnswers(parsed.answers);
            }
          } catch { /* ignore parse errors */ }
        }
        // Store session ID for linking after signup
        if (sessionId) {
          localStorage.setItem('brd_stripe_session', sessionId);
        }
        // Mark that we're coming from a tier purchase
        setPendingTierPurchase(true);
        // Open signup form — payment is already done
        setAuthMode('signup');
      }
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    // Auth state is managed by Supabase provider — just close the modal
    setAuthMode(null);
  };

  const handleTierClick = (tier: 'bank_ready' | 'loan_ready' | 'approved') => {
    if (isLoggedIn && profile?.has_paid) {
      // Already logged in and paid — go straight to dashboard
      setView('dashboard');
    } else if (tier === 'approved') {
      // Tier 3 — show intake first, then application modal
      setIntakeTier(tier);
    } else {
      // Tier 1/2 — show intake first, then Stripe checkout
      setIntakeTier(tier);
    }
  };

  const handleIntakeComplete = async (answers: IntakeAnswers) => {
    setIntakeAnswers(answers);
    setIntakeTier(null);

    if (answers.selectedTier === 'approved') {
      // Tier 3 — application only, no direct checkout
      setShowTier3Modal(true);
      return;
    }

    // Tier 1 or 2 — persist intake data to localStorage, then redirect to Stripe
    localStorage.setItem('brd_intake', JSON.stringify({
      answers,
      tier: answers.selectedTier,
      timestamp: Date.now(),
    }));

    try {
      const priceType = `tier_${answers.selectedTier}`;
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType,
          userId: user?.id || 'pending',
          successUrl: `${window.location.origin}?checkout=success`,
          cancelUrl: window.location.origin,
        }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch {
      // Checkout failed — clean up and let user retry
      localStorage.removeItem('brd_intake');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setHasPaidForDoc(false);
    setView('landing');
  };

  const selectDocument = (type: DocumentType) => {
    setState(prev => ({ ...prev, selectedDoc: type, currentStep: 0 }));
    setView('flow');
  };

  const handleNext = () => {
    if (state.currentStep < PFS_STEPS.length - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      setView('review');
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    } else {
      setView('landing');
    }
  };

  const updateData = (newData: Partial<PFSData>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...newData }
    }));
  };

  const handleExportRequested = () => {
    if (isPro || hasPaidForDoc) {
      return;
    }
    setView('paywall');
  };

  const handlePaymentSuccess = (type: 'one-time' | 'subscription') => {
    if (type === 'one-time') {
      setHasPaidForDoc(true);
    }
    setView('review');
    if (!isLoggedIn) {
      setAuthMode('signup');
    }
  };

  const triggerScorecardCheckout = useCallback(async () => {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType: 'scorecard',
          userId: user?.id || null,
          successUrl: `${window.location.origin}?checkout=success&type=scorecard`,
          cancelUrl: `${window.location.origin}?checkout=cancelled`
        })
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch {
      // Checkout creation failed — stay on page
    }
  }, [user]);

  const handleScorecardUpgrade = async () => {
    if (!isLoggedIn) {
      setPendingScorecardUpgrade(true);
      setAuthMode('signup');
      return;
    }
    await triggerScorecardCheckout();
  };

  // After login, auto-trigger pending scorecard checkout
  useEffect(() => {
    if (isLoggedIn && pendingScorecardUpgrade) {
      setPendingScorecardUpgrade(false);
      triggerScorecardCheckout();
    }
  }, [isLoggedIn, pendingScorecardUpgrade, triggerScorecardCheckout]);

  // After login, auto-navigate admin users to the admin dashboard
  useEffect(() => {
    if (isLoggedIn && profile?.is_admin && view === 'landing') {
      setView('admin');
    }
  }, [isLoggedIn, profile?.is_admin]);

  // After login, route paid non-admin users to their dashboard
  useEffect(() => {
    if (isLoggedIn && !profile?.is_admin && profile?.has_paid && view === 'landing') {
      setView('dashboard');
    }
  }, [isLoggedIn, profile?.is_admin, profile?.has_paid]);

  // After signup following tier purchase — save intake + activate profile
  useEffect(() => {
    if (isLoggedIn && pendingTierPurchase && intakeAnswers && user?.id) {
      const stripeSessionId = localStorage.getItem('brd_stripe_session') || undefined;
      Promise.all([
        saveIntakeSubmission(user.id, intakeAnswers),
        activateProfile(user.id, intakeAnswers, stripeSessionId),
      ]).then(() => {
        localStorage.removeItem('brd_intake');
        localStorage.removeItem('brd_stripe_session');
        setIntakeAnswers(null);
        setPendingTierPurchase(false);
        refreshProfile();
        setView('dashboard');
      });
    }
  }, [isLoggedIn, pendingTierPurchase, intakeAnswers, user?.id]);

  // Derive scorecard tier from profile
  const scorecardTier = profile?.tier === 'bank_ready' ? 'tier1' : 'free';

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#1D9E75] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Admin dashboard — requires authentication + admin flag
  if (view === 'admin') {
    if (!isLoggedIn || !profile?.is_admin) {
      setView('landing');
      if (!isLoggedIn) setAuthMode('signin');
      return null;
    }
    return (
      <AdminShell onExit={() => setView('landing')} />
    );
  }

  // Admin worksheet — requires authentication
  if (view === 'admin-worksheet') {
    if (!isLoggedIn) {
      setView('landing');
      setAuthMode('signin');
      return null;
    }
    return (
      <AdminCashFlowWorksheet onBack={() => setView('landing')} />
    );
  }

  // Scorecard is accessible regardless of auth state (free tool)
  // Detailed breakdown (EBIDA, DSCR, methodology) is gated behind Tier 1+
  if (view === 'scorecard') {
    return (
      <>
        <CapacityScorecard
          onBack={() => setView('landing')}
          userTier={scorecardTier as any}
          onUpgrade={handleScorecardUpgrade}
          intakeAnswers={intakeAnswers}
        />
        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => { setAuthMode(null); setPendingScorecardUpgrade(false); }}
            onSuccess={handleLogin}
            setMode={setAuthMode}
          />
        )}
      </>
    );
  }

  // Client dashboard — logged-in, paid, non-admin users only
  if (view === 'dashboard') {
    if (!isLoggedIn || !profile?.has_paid) {
      setView('landing');
      return null;
    }
    return (
      <div className="relative">
        <ClientDashboard
          userId={user!.id}
          userName={profile?.full_name || 'User'}
          businessName={profile?.business_name || ''}
          tier={(profile?.tier as 'bank_ready' | 'loan_ready' | 'approved') || null}
          onStartScorecard={() => setView('scorecard')}
          onContinueScorecard={() => setView('scorecard')}
          onLogout={handleLogout}
          onTierClick={handleTierClick}
        />
        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSuccess={handleLogin}
            setMode={setAuthMode}
          />
        )}
      </div>
    );
  }

  // Landing page — always show the public landing page (logged in or not)
  if (view === 'landing') {
    return (
      <div className="relative">
        {/* Client submission status banner (logged-in non-admin users) */}
        {isLoggedIn && user?.id && !profile?.is_admin && (
          <div className="max-w-4xl mx-auto px-4 pt-20">
            <SubmissionStatus
              userId={user.id}
              onContinueScorecard={() => setView('scorecard')}
              onViewReport={() => setView('scorecard')}
            />
          </div>
        )}
        <LandingPage
          onGetStarted={() => setAuthMode('signup')}
          onSignIn={() => setAuthMode('signin')}
          onDocClick={selectDocument}
          onScorecard={() => setView('scorecard')}
          onTierClick={handleTierClick}
          user={isLoggedIn ? { name: profile?.full_name || 'User', email: user?.email || '', isAdmin: profile?.is_admin ?? false } : null}
          onLogout={handleLogout}
          onAdminDashboard={() => setView('admin')}
        />
        {intakeTier && (
          <IntakeQuestionnaire
            tier={intakeTier}
            onComplete={handleIntakeComplete}
            onClose={() => setIntakeTier(null)}
          />
        )}
        {showTier3Modal && (
          <Tier3ApplicationModal
            onClose={() => setShowTier3Modal(false)}
            onSubmitted={() => setShowTier3Modal(false)}
            prefillBusinessName={intakeAnswers?.businessName}
          />
        )}
        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSuccess={handleLogin}
            setMode={setAuthMode}
          />
        )}
      </div>
    );
  }

  // Build real user data from Supabase profile
  const currentUser = isLoggedIn ? {
    name: profile?.full_name || state.data.fullName || 'User',
    email: user?.email || '',
    isPro: isPro
  } : null;

  return (
    <Layout
      currentView={view}
      onHomeClick={() => setView('landing')}
      onLogout={handleLogout}
      onSignIn={() => setAuthMode('signin')}
      user={currentUser}
      documents={[]}
    >
      <div className="fade-in h-full bg-[#F8FAFC]">
        {view === 'flow' && (
          <div className="h-full bg-white">
            <StepFlow
              state={state}
              onNext={handleNext}
              onBack={handleBack}
              onUpdate={updateData}
            />
          </div>
        )}

        {view === 'review' && (
          <div className="h-full bg-[#F8FAFC]">
            <Summary
              data={state.data}
              isLocked={!isPro && !hasPaidForDoc}
              onExportRequested={handleExportRequested}
              onEdit={() => setView('flow')}
              onReset={() => {
                setState(prev => ({ ...prev, data: INITIAL_PFS_DATA, currentStep: 0 }));
                setHasPaidForDoc(false);
                setView('landing');
              }}
            />
          </div>
        )}

        {view === 'paywall' && (
          <div className="h-full bg-[#F8FAFC]">
            <Paywall
              data={state.data}
              onBack={() => setView('review')}
              onSuccess={handlePaymentSuccess}
              onSignup={() => setAuthMode('signup')}
            />
          </div>
        )}
      </div>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={handleLogin}
          setMode={setAuthMode}
        />
      )}
    </Layout>
  );
};

export default App;
