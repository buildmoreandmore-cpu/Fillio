
import React from 'react';
import { PFSData } from '../types';
import PDFPreview from './PDFPreview';

interface PaywallProps {
  data: PFSData;
  onBack: () => void;
  onSuccess: (type: 'one-time' | 'subscription') => void;
  onSignup: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ data, onBack, onSuccess, onSignup }) => {
  return (
    <div className="min-h-full py-20 px-6 flex flex-col items-center max-w-7xl mx-auto fade-in">
      <div className="text-center mb-16 max-w-2xl">
        <h2 className="text-5xl font-[900] text-slate-900 mb-6 tracking-tighter uppercase leading-none">Your document <span className="text-blue-600">is ready 🎉</span></h2>
        <p className="text-slate-500 text-xl font-medium leading-relaxed">
          Download your bank-ready Personal Financial Statement. Join thousands of pros securing better deals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-start">
        {/* Left Side: Blurred Preview */}
        <div className="relative group">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[700px]">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Preview</span>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              </div>
            </div>
            <div className="p-8 origin-top scale-[0.8] transform-gpu filter blur-[4px] grayscale-[0.5] opacity-60">
              <PDFPreview 
                data={data} 
                totalAssets={1250000} 
                totalLiabilities={450000} 
                netWorth={800000} 
              />
            </div>
            {/* Watermark overlay */}
            <div className="absolute inset-0 flex items-center justify-center rotate-[-25deg] pointer-events-none opacity-[0.05]">
              <span className="text-9xl font-black text-slate-900 uppercase">FILLIO</span>
            </div>
          </div>
        </div>

        {/* Right Side: Pricing Options */}
        <div className="space-y-8">
          <div 
            onClick={() => onSuccess('one-time')}
            className="group relative bg-white border-2 border-slate-100 hover:border-blue-100 rounded-[2.5rem] p-10 cursor-pointer transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">One-time download</h3>
                <p className="text-slate-500 font-medium text-sm">Download this document only.</p>
              </div>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">$9</div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span className="iconify text-blue-600 text-lg" data-icon="solar:check-circle-bold-duotone"></span>
                Clean, no-watermark PDF
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span className="iconify text-blue-600 text-lg" data-icon="solar:check-circle-bold-duotone"></span>
                24-hour edit window
              </li>
            </ul>
            <button className="w-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all">
              Choose Single Download
            </button>
          </div>

          <div 
            onClick={() => onSuccess('subscription')}
            className="group relative bg-white border-2 border-blue-600 ring-8 ring-blue-50/50 rounded-[2.5rem] p-10 cursor-pointer transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            <div className="absolute -top-4 right-10 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-lg">
              ⭐ Best Value
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Unlimited Pro</h3>
                <p className="text-slate-500 font-medium text-sm">Unlimited docs + all features.</p>
              </div>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">$12<span className="text-base text-slate-400">/mo</span></div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span className="iconify text-blue-600 text-lg" data-icon="solar:bolt-circle-bold-duotone"></span>
                Unlimited document exports
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span className="iconify text-blue-600 text-lg" data-icon="solar:plug-bold-duotone"></span>
                Bank sync (5 min &rarr; 30 sec)
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span className="iconify text-blue-600 text-lg" data-icon="solar:cloud-bold-duotone"></span>
                Cloud save & multi-device sync
              </li>
            </ul>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all">
              Get Unlimited Pro
            </button>
          </div>

          <div className="pt-8 text-center border-t border-slate-100">
             <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-4">Secure payment via Stripe</p>
             <button 
              onClick={onBack}
              className="text-slate-400 hover:text-slate-900 font-black text-[11px] uppercase tracking-widest"
             >
               &larr; Back to review
             </button>
          </div>
        </div>
      </div>

      <div className="mt-24 p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center gap-8 max-w-4xl w-full">
         <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <span className="iconify text-3xl text-blue-600" data-icon="solar:shield-keyhole-bold-duotone"></span>
         </div>
         <div className="flex-grow text-center md:text-left">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Want to save your work?</h4>
            <p className="text-slate-500 font-medium text-sm">Create a free account to save this document as a draft and finish it later. Your document will be waiting.</p>
         </div>
         <button 
           onClick={onSignup}
           className="whitespace-nowrap bg-white border-2 border-blue-600 text-blue-600 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all"
         >
           Create Free Account
         </button>
      </div>
    </div>
  );
};

export default Paywall;
