
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
import { useAuth } from './lib/auth';

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
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const isLoggedIn = !!user;
  const isPro = profile?.is_pro ?? false;

  const [hasPaidForDoc, setHasPaidForDoc] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [view, setView] = useState<'landing' | 'flow' | 'review' | 'paywall' | 'scorecard' | 'admin-worksheet' | 'admin'>('landing');
  const [pendingScorecardUpgrade, setPendingScorecardUpgrade] = useState(false);
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
      if (type === 'one-time') {
        setHasPaidForDoc(true);
        setView('review');
      } else if (type === 'scorecard') {
        setView('scorecard');
      }
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    // Auth state is managed by Supabase provider — just close the modal
    setAuthMode(null);
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

  // Landing page — always show the public landing page (logged in or not)
  if (view === 'landing') {
    return (
      <div className="relative">
        <LandingPage
          onGetStarted={() => setAuthMode('signup')}
          onSignIn={() => setAuthMode('signin')}
          onDocClick={selectDocument}
          onScorecard={() => setView('scorecard')}
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
