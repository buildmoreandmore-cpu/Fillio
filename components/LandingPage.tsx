
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
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{doc.title} — Sample</h3>
            <p className="text-slate-500 text-sm font-medium">Lender-approved layout. Yours will look identical.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <span className="iconify text-3xl" data-icon="solar:close-circle-bold-duotone"></span>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto bg-slate-50 p-12 flex justify-center">
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
               <div className="space-y-6 text-slate-100">
                  <div className="h-8 bg-slate-900 w-48 rounded"></div>
                  <div className="space-y-3">
                     {[...Array(6)].map((_, i) => (
                       <div key={i} className="flex justify-between border-b border-slate-100 pb-2">
                         <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                         <div className="h-3 bg-slate-100 rounded w-24"></div>
                       </div>
                     ))}
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
            Start Building Your Doc →
          </button>
        </div>
      </div>
    </div>
  );
};

const ShowcaseCard: React.FC<{ doc: any; onSelect: (type: DocumentType) => void; onPreview: (type: DocumentType) => void }> = ({ doc, onSelect, onPreview }) => {
  return (
    <div 
      className="group flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-4 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] hover:-translate-y-2 cursor-pointer h-full"
      onClick={() => onSelect(doc.type)}
    >
      <div className="relative h-56 bg-slate-50 rounded-[2rem] mb-6 overflow-hidden flex items-center justify-center p-6 group-hover:bg-blue-50/50 transition-colors">
        <div className="w-[120px] h-[160px] bg-white rounded-lg shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 p-4 flex flex-col gap-2 transform -rotate-2 group-hover:rotate-1 group-hover:scale-110 transition-all duration-700 ease-out z-10">
           <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center mb-1">
              <span className="iconify text-blue-600 text-xs" data-icon={doc.logo}></span>
           </div>
           <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
           <div className="w-3/4 h-1.5 bg-slate-50 rounded-full mb-2"></div>
           <div className="space-y-1">
              <div className="h-1 bg-slate-50 rounded-full w-full"></div>
              <div className="h-1 bg-slate-50 rounded-full w-2/3"></div>
           </div>
        </div>
        <div className="absolute w-[120px] h-[160px] bg-black/5 rounded-lg transform translate-x-4 translate-y-4 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="px-4 pb-4 flex flex-col flex-grow space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{doc.title}</h3>
          {doc.isPopular && (
            <span className="inline-block bg-amber-400 text-amber-950 text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/10">
              ⭐ MOST POPULAR
            </span>
          )}
        </div>
        
        <p className="text-slate-500 text-xs font-medium leading-relaxed flex-grow">
          {doc.outcomeDescription}
        </p>

        <div className="space-y-3 pt-4 border-t border-slate-50">
           <button 
             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/10 transition-all active:scale-95"
           >
             Start Building
           </button>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                <span className="iconify text-blue-500" data-icon="solar:clock-circle-bold-duotone"></span>
                {doc.timeEstimate}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onPreview(doc.type); }}
                className="text-slate-400 hover:text-blue-600 text-[9px] font-black uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
              >
                View Sample
                <span className="iconify" data-icon="solar:eye-bold-duotone"></span>
              </button>
           </div>
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
      <header className="h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <span className="iconify text-xl" data-icon="solar:wallet-bold-duotone"></span>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">Fillio</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <a href="#templates" className="hover:text-blue-600 transition-colors">Templates</a>
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
      <section className="pt-16 pb-24 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-100">
           Free to Build • Pay to Download
        </div>
        <h1 className="text-5xl md:text-7xl font-[900] text-slate-900 mb-8 tracking-[-0.05em] leading-[0.9]">
          Professional financial <br/><span className="text-blue-600">documents in minutes.</span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
          Skip the spreadsheets. Use our guided multi-step flow to create lender-ready PDFs. No signup required to start.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/40 transition-all active:scale-95"
          >
            Start Your First Doc →
          </button>
        </div>
      </section>

      {/* Document Showcase - One Line Grid */}
      <section id="templates" className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-[900] text-slate-900 mb-4 tracking-tighter uppercase leading-none">
              Bank-Ready <span className="text-blue-600">Templates</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium">Select a document below to start your guided builder immediately.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DOC_OPTIONS.map((doc) => (
              <ShowcaseCard 
                key={doc.type} 
                doc={doc} 
                onSelect={onDocClick} 
                onPreview={setPreviewDoc} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer & CTA Section */}
      <section className="bg-slate-900 py-24 px-6 text-center text-white">
          <div className="max-w-3xl mx-auto space-y-12">
             <div className="pt-12 flex flex-col items-center gap-8">
                <button 
                   onClick={onGetStarted}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[2rem] text-[14px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
                >
                   Create Your Document Now
                </button>
                <div className="flex gap-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                   <a href="#" className="hover:text-white transition-colors">Privacy</a>
                   <a href="#" className="hover:text-white transition-colors">Terms</a>
                   <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.25em]">© 2024 Fillio. Bank-Ready. Always.</p>
             </div>
          </div>
      </section>

      {/* Lightbox Modal */}
      <ExampleModal 
        type={previewDoc} 
        onClose={() => setPreviewDoc(null)} 
        onAction={() => { setPreviewDoc(null); onDocClick(previewDoc!); }}
      />
    </div>
  );
};

export default LandingPage;
