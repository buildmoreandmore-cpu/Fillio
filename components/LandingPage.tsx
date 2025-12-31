
import React, { useState } from 'react';
import { DOC_OPTIONS } from '../constants';
import { DocumentType } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onDocClick: (type: DocumentType) => void;
}

const ExampleModal: React.FC<{ type: DocumentType | null; onClose: () => void; onAction: () => void }> = ({ type, onClose, onAction }) => {
  if (!type) return null;
  const doc = DOC_OPTIONS.find(d => d.type === type);
  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{doc.title} — Example</h3>
            <p className="text-slate-500 text-sm font-medium">This is exactly what lenders and partners receive.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <span className="iconify text-3xl" data-icon="solar:close-circle-bold-duotone"></span>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto bg-slate-50 p-12 flex justify-center">
          {/* Mock PDF Content */}
          <div className="w-full max-w-[800px] bg-white shadow-2xl p-16 border border-slate-100 min-h-[1000px]">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">{doc.title}</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Strictly Confidential</p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-blue-600 rounded-xl ml-auto mb-4"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sample Report v1.0</p>
              </div>
            </div>
            
            <div className="space-y-12">
               <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                    <div className="h-4 bg-slate-50 rounded-full w-1/2"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-4 bg-slate-50 rounded-full w-2/3"></div>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="h-8 bg-slate-900 w-48 rounded"></div>
                  <div className="space-y-3">
                     {[...Array(8)].map((_, i) => (
                       <div key={i} className="flex justify-between border-b border-slate-100 pb-2">
                         <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                         <div className="h-3 bg-slate-100 rounded w-24"></div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="pt-12 border-t-2 border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-400 rounded w-32"></div>
                    <div className="h-6 bg-blue-600 rounded w-48"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-center sticky bottom-0 z-10">
          <button 
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
          >
            Create Your Own →
          </button>
        </div>
      </div>
    </div>
  );
};

const ShowcaseCard: React.FC<{ doc: any; onSelect: (type: DocumentType) => void; onPreview: (type: DocumentType) => void }> = ({ doc, onSelect, onPreview }) => {
  return (
    <div 
      className="group flex flex-col bg-white border border-slate-100 rounded-[3rem] p-4 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] hover:-translate-y-2 cursor-pointer"
      onClick={() => onSelect(doc.type)}
    >
      {/* Realistic Preview Mockup */}
      <div className="relative h-72 bg-slate-50 rounded-[2.5rem] mb-8 overflow-hidden flex items-center justify-center p-8 group-hover:bg-blue-50/50 transition-colors">
        <div className="w-[180px] h-[240px] bg-white rounded-lg shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 p-5 flex flex-col gap-3 transform -rotate-2 group-hover:rotate-1 group-hover:scale-110 transition-all duration-700 ease-out z-10">
           <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center mb-1">
              <span className="iconify text-blue-600 text-sm" data-icon={doc.logo}></span>
           </div>
           <div className="w-full h-3 bg-slate-100 rounded-full"></div>
           <div className="w-3/4 h-3 bg-slate-50 rounded-full mb-4"></div>
           <div className="space-y-2">
              <div className="h-1.5 bg-slate-50 rounded-full w-full"></div>
              <div className="h-1.5 bg-slate-50 rounded-full w-2/3"></div>
              <div className="h-1.5 bg-slate-50 rounded-full w-5/6"></div>
           </div>
           <div className="mt-auto h-3 bg-blue-100 rounded-full w-12 ml-auto"></div>
        </div>
        {/* Shadow layer for depth */}
        <div className="absolute w-[180px] h-[240px] bg-black/5 rounded-lg transform translate-x-4 translate-y-4 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{doc.title}</h3>
          {doc.isPopular && (
            <span className="bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
              ⭐ Most Popular
            </span>
          )}
        </div>
        
        <p className="text-slate-500 text-sm font-medium leading-relaxed">
          {doc.outcomeDescription}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
            <span className="iconify text-blue-600" data-icon="solar:clock-circle-bold-duotone"></span>
            {doc.timeEstimate}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onPreview(doc.type); }}
            className="text-blue-600 text-[12px] font-black uppercase tracking-[0.15em] hover:underline flex items-center gap-1 group/link"
          >
            See Example 
            <span className="iconify group-hover/link:translate-x-1 transition-transform" data-icon="solar:alt-arrow-right-bold"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, onDocClick }) => {
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <span className="iconify text-xl" data-icon="solar:wallet-bold-duotone"></span>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">Fillio</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <a href="#how" className="hover:text-blue-600 transition-colors">How it works</a>
          <a href="#showcase" className="hover:text-blue-600 transition-colors">Documents</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-8">
          <button onClick={onSignIn} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Sign In</button>
          <button 
            onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-40 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-sm border border-blue-100">
          <span className="iconify text-lg" data-icon="solar:verified-check-bold-duotone"></span>
          Bank-Ready Statements in Minutes
        </div>
        <h1 className="text-6xl md:text-8xl font-[900] text-slate-900 mb-10 tracking-[-0.05em] leading-[0.9]">
          Everything you need to look <br/><span className="text-blue-600">financially prepared.</span>
        </h1>
        <p className="text-slate-500 text-xl md:text-2xl font-medium leading-relaxed mb-14 max-w-3xl mx-auto">
          Professional documents that lenders, partners, and landlords actually want to see. Secure, verified, and ready for any deal.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-[2rem] text-[15px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/40 transition-all active:scale-95"
          >
            Get Started Free
          </button>
          <button className="w-full sm:w-auto px-12 py-6 rounded-[2rem] text-[15px] font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest">
            See How it Works
          </button>
        </div>
      </section>

      {/* Document Showcase */}
      <section id="showcase" className="py-40 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-24">
            <h2 className="text-4xl md:text-5xl font-[900] text-slate-900 mb-6 tracking-tighter uppercase leading-none">
              Financial documents <br/>
              <span className="text-blue-600">for every professional need.</span>
            </h2>
            <div className="w-24 h-2 bg-blue-600 mb-8 rounded-full"></div>
            <p className="text-slate-500 text-xl font-medium leading-relaxed">
              Standardized reports that eliminate uncertainty. Built for lenders, investors, and real estate professionals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {DOC_OPTIONS.slice(0, 3).map((doc) => (
              <ShowcaseCard 
                key={doc.type} 
                doc={doc} 
                onSelect={onDocClick} 
                onPreview={setPreviewDoc} 
              />
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             <div className="lg:col-start-2">
                <ShowcaseCard 
                  doc={DOC_OPTIONS[3]} 
                  onSelect={onDocClick} 
                  onPreview={setPreviewDoc} 
                />
             </div>
          </div>

          <div className="mt-32 text-center">
            <button 
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-14 py-6 rounded-[2rem] text-[14px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
            >
              Get Started Free — Create Your First Document →
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Testimonials */}
      <section className="py-40 border-t border-slate-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="flex justify-center gap-1.5 mb-10">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="iconify text-2xl text-amber-400" data-icon="solar:star-bold"></span>
            ))}
          </div>
          <blockquote className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-12 italic">
            "Finally, a tool that doesn't require an accounting degree. My lender had never seen a cleaner Personal Financial Statement."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
             <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 font-black text-lg">SK</div>
             <div className="text-left">
                <p className="text-slate-900 font-black uppercase tracking-widest text-sm">Sarah K.</p>
                <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px]">Real Estate Investor</p>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-32 bg-slate-900 text-white text-center px-6">
        <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-none">Ready to look prepared?</h2>
        <p className="text-slate-400 text-xl font-medium mb-12 max-w-xl mx-auto">Join thousands of professionals securing better deals with bank-ready documents.</p>
        <button 
          onClick={onGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white px-14 py-6 rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
        >
          Create Your Free Document
        </button>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <span className="iconify text-xl" data-icon="solar:wallet-bold-duotone"></span>
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">Fillio</span>
            </div>
            <p className="text-slate-400 font-medium max-w-sm leading-relaxed text-sm">
              The professional standard for financial documentation. Empowring individuals to showcase their financial health with clarity and confidence.
            </p>
          </div>
          
          <div className="space-y-6">
             <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Platform</h4>
             <nav className="flex flex-col gap-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
               <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Templates</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
             </nav>
          </div>

          <div className="space-y-6">
             <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Legal</h4>
             <nav className="flex flex-col gap-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
               <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Security</a>
             </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">© 2024 Fillio. Bank-Ready. Always.</p>
           <div className="flex gap-6 text-slate-300">
              <span className="iconify text-2xl hover:text-blue-600 cursor-pointer transition-colors" data-icon="simple-icons:linkedin"></span>
              <span className="iconify text-2xl hover:text-blue-600 cursor-pointer transition-colors" data-icon="simple-icons:twitter"></span>
           </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <ExampleModal 
        type={previewDoc} 
        onClose={() => setPreviewDoc(null)} 
        onAction={() => { setPreviewDoc(null); onGetStarted(); }}
      />
    </div>
  );
};

export default LandingPage;
