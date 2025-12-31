import React, { useEffect, useRef } from 'react';
import { AppState, PFSData, FinancialItem } from '../types';
import { PFS_STEPS } from '../constants';

interface StepFlowProps {
  state: AppState;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: Partial<PFSData>) => void;
}

const StepFlow: React.FC<StepFlowProps> = ({ state, onNext, onBack, onUpdate }) => {
  const currentStepDef = PFS_STEPS[state.currentStep];
  const progress = ((state.currentStep + 1) / PFS_STEPS.length) * 100;

  useEffect(() => {
    const listFields: (keyof PFSData)[] = [
      'cashAssets', 'investmentAssets', 'realEstateAssets', 
      'realEstateLiabilities', 'otherLiabilities'
    ];

    let updated = false;
    const newData: Partial<PFSData> = {};

    listFields.forEach(field => {
      const list = state.data[field];
      if (Array.isArray(list)) {
        if (list.length === 0 || (list[list.length - 1].description !== '' || list[list.length - 1].value !== 0)) {
          newData[field] = [
            ...list,
            { id: Math.random().toString(36).substr(2, 9), description: '', value: 0 }
          ] as any;
          updated = true;
        }
      }
    });

    if (updated) {
      onUpdate(newData);
    }
  }, [state.data, onUpdate]);

  const handleUpdateItem = (field: keyof PFSData, id: string, updates: Partial<FinancialItem>) => {
    const currentList = state.data[field] as FinancialItem[];
    const newList = currentList.map(item => item.id === id ? { ...item, ...updates } : item);
    onUpdate({ [field]: newList });
  };

  const handleRemoveItem = (field: keyof PFSData, id: string) => {
    const currentList = state.data[field] as FinancialItem[];
    if (currentList.length <= 1) return;
    const newList = currentList.filter(item => item.id !== id);
    onUpdate({ [field]: newList });
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: keyof PFSData, index: number, isAmount: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentList = state.data[field] as FinancialItem[];
      
      if (!isAmount) {
        const nextInput = (e.target as HTMLElement).parentElement?.nextElementSibling?.querySelector('input');
        (nextInput as HTMLInputElement)?.focus();
      } else {
        if (index < currentList.length - 1) {
          const nextRow = (e.target as HTMLElement).parentElement?.parentElement?.nextElementSibling;
          const nextDescInput = nextRow?.querySelector('input');
          (nextDescInput as HTMLInputElement)?.focus();
        } else if (state.currentStep < PFS_STEPS.length - 1) {
          onNext();
        }
      }
    }
  };

  const renderFinancialList = (field: keyof PFSData, label: string) => {
    const list = (state.data[field] as FinancialItem[]) || [];
    
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</h4>
          <span className="text-[11px] text-emerald-600 font-[900] uppercase tracking-widest italic flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full">
            <span className="iconify" data-icon="solar:check-circle-bold-duotone"></span> Verified
          </span>
        </div>
        
        <div className="space-y-2">
          {list.map((item, index) => {
            const isEmpty = !item.description && !item.value;
            const isLast = index === list.length - 1;

            return (
              <div key={item.id} className="flex gap-6 items-center group transition-all">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder={isLast ? "Describe item (e.g. Chase Savings)..." : "Description"}
                    value={item.description}
                    onKeyDown={(e) => handleKeyDown(e, field, index, false)}
                    onChange={(e) => handleUpdateItem(field, item.id, { description: e.target.value })}
                    className="w-full bg-transparent border-none py-4 px-4 outline-none transition-all text-base font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-slate-50 focus:rounded-2xl"
                  />
                </div>
                <div className="w-36 md:w-56 relative">
                  <span className="absolute left-4 top-4 text-slate-300 font-bold text-base">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.value || ''}
                    onKeyDown={(e) => handleKeyDown(e, field, index, true)}
                    onChange={(e) => handleUpdateItem(field, item.id, { value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-transparent border-none py-4 pl-9 pr-4 outline-none transition-all text-base font-black text-slate-900 text-right placeholder:text-slate-200 focus:bg-slate-50 focus:rounded-2xl"
                  />
                </div>
                <div className="w-10 flex justify-center">
                  {!isEmpty && (
                    <button
                      onClick={() => handleRemoveItem(field, item.id)}
                      className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-3"
                    >
                      <span className="iconify text-xl" data-icon="solar:trash-bin-trash-bold-duotone"></span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-24 px-8 fade-in">
      <div className="mb-16">
        <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
          <span className="text-blue-600">Document Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-[900] text-slate-900 mb-4 tracking-[-0.03em]">{currentStepDef.title}</h2>
        <p className="text-slate-500 text-lg font-medium leading-relaxed">{currentStepDef.description}</p>
      </div>

      <div className="bg-white p-12 rounded-[3rem] border-2 border-slate-50 shadow-2xl shadow-slate-200/40">
        {state.currentStep === 0 && (
          <div className="space-y-10">
            <div className="flex flex-col gap-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Name</label>
              <input
                type="text"
                autoFocus
                value={state.data.fullName}
                onKeyDown={(e) => e.key === 'Enter' && onNext()}
                onChange={(e) => onUpdate({ fullName: e.target.value })}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl px-8 py-6 outline-none transition-all text-xl font-bold text-slate-900 placeholder:text-slate-300"
                placeholder="Full Name as per ID"
              />
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">As-of Date</label>
              <input
                type="date"
                value={state.data.asOfDate}
                onKeyDown={(e) => e.key === 'Enter' && onNext()}
                onChange={(e) => onUpdate({ asOfDate: e.target.value })}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl px-8 py-6 outline-none transition-all text-xl font-bold text-slate-900"
              />
            </div>
          </div>
        )}

        {state.currentStep === 1 && renderFinancialList('cashAssets', 'Cash & Liquid Equivalents')}
        {state.currentStep === 2 && renderFinancialList('investmentAssets', 'Stock & Bond Investments')}
        {state.currentStep === 3 && renderFinancialList('realEstateAssets', 'Real Estate Portfolio')}
        {state.currentStep === 4 && renderFinancialList('realEstateLiabilities', 'Property Liabilities')}
        {state.currentStep === 5 && renderFinancialList('otherLiabilities', 'Other Debts')}
        
        {state.currentStep === 6 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/10">
              <span className="iconify text-5xl" data-icon="solar:magic-stick-bold-duotone"></span>
            </div>
            <h3 className="text-3xl font-[900] text-slate-900 mb-4 tracking-tight">Final Check</h3>
            <p className="text-slate-500 text-lg max-w-sm mx-auto font-medium leading-relaxed">
              We've mapped your data to the final form. Review the totals to ensure lender accuracy.
            </p>
          </div>
        )}
      </div>

      <div className="mt-16 flex items-center justify-between px-2">
        <button
          onClick={onBack}
          className="px-10 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm uppercase tracking-widest"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all text-sm uppercase tracking-[0.25em]"
        >
          {state.currentStep === PFS_STEPS.length - 1 ? 'Go to Review' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default StepFlow;