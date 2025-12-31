
import React, { useState } from 'react';
import { DocumentType, PFSData, AppState } from './types';
import { DOC_OPTIONS, PFS_STEPS } from './constants';
import Layout from './components/Layout';
import StepFlow from './components/StepFlow';
import Summary from './components/Summary';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [view, setView] = useState<'landing' | 'flow' | 'review'>('landing');
  const [search, setSearch] = useState('');
  const [state, setState] = useState<AppState>({
    selectedDoc: null,
    currentStep: 0,
    data: INITIAL_PFS_DATA
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    setAuthMode(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('landing');
  };

  const selectDocument = (type: DocumentType) => {
    if (!isLoggedIn) {
      setAuthMode('signup');
      return;
    }
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

  if (!isLoggedIn) {
    return (
      <div className="relative">
        <LandingPage 
          onGetStarted={() => setAuthMode('signup')} 
          onSignIn={() => setAuthMode('signin')}
          onDocClick={selectDocument}
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

  return (
    <Layout 
      currentView={view} 
      onHomeClick={() => setView('landing')}
      onLogout={handleLogout}
    >
      <div className="fade-in h-full bg-[#F8FAFC]">
        {view === 'landing' && (
          <div className="flex h-full">
            <div className="flex-grow overflow-y-auto px-6 md:px-12 lg:px-20 py-16 lg:py-24">
              <div className="max-w-6xl mx-auto">
                <div className="mb-20 text-left max-w-3xl">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-6">
                    <span className="iconify text-lg" data-icon="solar:verified-check-bold-duotone"></span>
                    Workspace Active
                  </div>
                  <h1 className="text-5xl md:text-7xl font-[900] text-slate-900 mb-6 tracking-[-0.04em] leading-[0.95]">
                    Select a document <br/>
                    <span className="text-blue-600">template.</span>
                  </h1>
                  
                  <div className="relative group max-w-2xl mt-12">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <span className="iconify text-slate-300 text-2xl" data-icon="solar:magnifer-linear"></span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search documents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border-none rounded-[1.5rem] py-6 pl-16 pr-8 text-lg focus:ring-[12px] focus:ring-blue-100/50 outline-none transition-all placeholder:text-slate-300 font-semibold shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
                  {DOC_OPTIONS.filter(doc => 
                    doc.title.toLowerCase().includes(search.toLowerCase()) ||
                    doc.outcomeDescription.toLowerCase().includes(search.toLowerCase())
                  ).map((doc) => (
                    <div 
                      key={doc.type} 
                      onClick={() => selectDocument(doc.type)}
                      className={`group relative flex flex-col bg-white border-2 cursor-pointer ${doc.isPopular ? 'border-blue-50 ring-8 ring-blue-50/30' : 'border-transparent'} rounded-[3rem] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] hover:-translate-y-3`}
                    >
                      <div className="h-64 bg-slate-50/80 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50/50 transition-colors duration-500">
                        <div className="w-[190px] h-[260px] bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-5 flex flex-col gap-3 transform -rotate-1 group-hover:rotate-2 group-hover:scale-110 transition-all duration-700 ease-out z-10">
                           <div className="flex justify-between items-center mb-1">
                              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                                 <span className="iconify text-blue-600 text-lg" data-icon={doc.logo}></span>
                              </div>
                              <div className="w-14 h-2.5 bg-slate-50 rounded-full"></div>
                           </div>
                           <div className="w-full h-4 bg-slate-100 rounded-lg mb-1"></div>
                           <div className="w-2/3 h-4 bg-slate-50 rounded-lg mb-4"></div>
                           <div className="space-y-3">
                              <div className="flex justify-between items-center"><div className="w-1/2 h-2 bg-slate-50 rounded-full"></div><div className="w-6 h-2 bg-slate-100 rounded-full"></div></div>
                              <div className="flex justify-between items-center"><div className="w-1/3 h-2 bg-slate-50 rounded-full"></div><div className="w-10 h-2 bg-blue-100 rounded-full"></div></div>
                           </div>
                           <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                              <div className="w-14 h-3 bg-blue-50 rounded-full"></div>
                              <div className="w-10 h-4 bg-blue-600 rounded-lg"></div>
                           </div>
                        </div>
                      </div>
                      <div className="p-10 flex flex-col flex-grow bg-white">
                        <h3 className="text-2xl font-[900] text-slate-900 tracking-tight leading-none mb-4">{doc.title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 flex-grow">{doc.outcomeDescription}</p>
                        <div className="flex items-center justify-between text-blue-600 font-bold text-xs uppercase tracking-widest">
                           <span>{doc.timeEstimate} completion</span>
                           <span className="iconify text-xl" data-icon="solar:alt-arrow-right-bold-duotone"></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
              onEdit={() => setView('flow')}
              onReset={() => {
                setState(prev => ({ ...prev, data: INITIAL_PFS_DATA, currentStep: 0 }));
                setView('landing');
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
