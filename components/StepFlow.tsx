import React, { useEffect } from 'react';
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
  const progress = Math.round(((state.currentStep + 1) / PFS_STEPS.length) * 100);

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
      <div className="space-y-6">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="space-y-3">
          {list.map((item, index) => {
            const isEmpty = !item.description && !item.value;
            const isLast = index === list.length - 1;

            return (
              <div key={item.id} className="flex gap-4 items-center group">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder={isLast ? "Add item description..." : "Description"}
                    value={item.description}
                    onKeyDown={(e) => handleKeyDown(e, field, index, false)}
                    onChange={(e) => handleUpdateItem(field, item.id, { description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:bg-white transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300"
                  />
                </div>
                <div className="w-32 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.value || ''}
                    onKeyDown={(e) => handleKeyDown(e, field, index, true)}
                    onChange={(e) => handleUpdateItem(field, item.id, { value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-8 pr-4 outline-none focus:border-[#3b82f6] focus:bg-white transition-all text-sm font-semibold text-slate-800 text-right placeholder:text-slate-300"
                  />
                </div>
                <div className="w-8">
                  {!isEmpty && (
                    <button
                      onClick={() => handleRemoveItem(field, item.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <span className="iconify text-lg" data-icon="solar:trash-bin-trash-bold"></span>
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
    <div className="h-full flex flex-col">
      {/* Step Header with Progress */}
      <div className="px-8 py-4 border-b border-slate-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 border-b-2 border-[#1e3a5f] pb-1">
              {currentStepDef.title}
            </span>
          </div>
          <span className="text-sm font-semibold text-[#3b82f6]">{progress}%</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-grow overflow-y-auto py-12 px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            {state.currentStep === 0 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Legal Full Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={state.data.fullName}
                    onKeyDown={(e) => e.key === 'Enter' && onNext()}
                    onChange={(e) => onUpdate({ fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:bg-white transition-all text-base font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Statement Date
                  </label>
                  <input
                    type="date"
                    value={state.data.asOfDate}
                    onKeyDown={(e) => e.key === 'Enter' && onNext()}
                    onChange={(e) => onUpdate({ asOfDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:bg-white transition-all text-base font-medium text-slate-800"
                  />
                </div>
              </div>
            )}

            {state.currentStep === 1 && renderFinancialList('cashAssets', 'Cash & Bank Accounts')}
            {state.currentStep === 2 && renderFinancialList('investmentAssets', 'Investments & Securities')}
            {state.currentStep === 3 && renderFinancialList('realEstateAssets', 'Real Estate Assets')}
            {state.currentStep === 4 && renderFinancialList('realEstateLiabilities', 'Mortgages & Property Loans')}
            {state.currentStep === 5 && renderFinancialList('otherLiabilities', 'Other Liabilities')}

            {state.currentStep === 6 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="iconify text-3xl" data-icon="solar:check-circle-bold"></span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Ready for Review</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Your financial statement is ready. Review and download your lender-ready PDF.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={onBack}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={onNext}
                className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {state.currentStep === PFS_STEPS.length - 1 ? 'Go to Review' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all">
          Preview
        </button>
      </div>
    </div>
  );
};

export default StepFlow;
