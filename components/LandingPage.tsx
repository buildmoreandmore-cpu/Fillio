
import React from 'react';
import { DOC_OPTIONS } from '../constants';
import { DocumentType } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onDocClick: (type: DocumentType) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, onDocClick }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white">
            <span className="iconify text-lg" data-icon="solar:document-text-bold"></span>
          </div>
          <span className="text-lg font-bold text-slate-800">Fillio</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-full hover:border-slate-300 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] rounded-full hover:bg-[#162d4a] transition-colors"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Professional financial<br/>
          <span className="text-[#3b82f6]">documents in minutes.</span>
        </h1>
        <p className="text-slate-500 text-base md:text-lg font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
          Skip the spreadsheets. Use our guided multi-step flow to create lender-ready PDFs. No signup required to start.
        </p>
        <button
          onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8 py-4 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          Start Your First Doc
          <span className="iconify" data-icon="solar:arrow-right-linear"></span>
        </button>
      </section>

      {/* Bank-Ready Templates */}
      <section id="templates" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Bank-Ready <span className="text-[#3b82f6]">Templates</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DOC_OPTIONS.map((doc) => (
              <div
                key={doc.type}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border border-slate-100"
                onClick={() => onDocClick(doc.type)}
              >
                {/* Document Preview Icon */}
                <div className="h-40 bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-xl mb-5 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="iconify text-[#3b82f6] text-2xl" data-icon={doc.logo}></span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-slate-900 mb-2">{doc.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-5 min-h-[48px]">
                  {doc.outcomeDescription}
                </p>

                {/* Button */}
                <button
                  className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white py-3 rounded-lg text-xs font-semibold transition-colors"
                >
                  Start Building
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-100">
        <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">
          © 2024 FILLIO. PROFESSIONAL. ALWAYS.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
