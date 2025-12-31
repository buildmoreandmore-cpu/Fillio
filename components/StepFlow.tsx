import React, { useEffect, useState } from 'react';
import { AppState, PFSData, FinancialItem } from '../types';
import { PFS_STEPS } from '../constants';
import ChatMode from './ChatMode';

interface StepFlowProps {
  state: AppState;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: Partial<PFSData>) => void;
}

type InputMode = 'chat' | 'form';

const StepFlow: React.FC<StepFlowProps> = ({ state, onNext, onBack, onUpdate }) => {
  const currentStepDef = PFS_STEPS[state.currentStep];
  const progress = Math.round(((state.currentStep + 1) / PFS_STEPS.length) * 100);
  const [inputMode, setInputMode] = useState<InputMode>('chat');

  // Steps that support chat mode (financial list steps)
  const chatEnabledSteps = [1, 2, 3, 4, 5];
  const isChatEnabled = chatEnabledSteps.includes(state.currentStep);

  // Step labels for progress indicator
  const stepLabels = ['Info', 'Cash', 'Invest', 'Property', 'Mortgages', 'Debts', 'Review'];

  useEffect(() => {
    // Auto-add empty row for form mode
    if (inputMode === 'form') {
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
    }
  }, [state.data, onUpdate, inputMode]);

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

  const handleChatItemsConfirmed = (field: keyof PFSData, items: FinancialItem[]) => {
    const itemsWithEmpty = [
      ...items,
      { id: Math.random().toString(36).substr(2, 9), description: '', value: 0 }
    ];
    onUpdate({ [field]: itemsWithEmpty });
    onNext();
  };

  const handleSkipSection = () => {
    onNext();
  };

  const getFieldForStep = (): keyof PFSData | null => {
    switch (state.currentStep) {
      case 1: return 'cashAssets';
      case 2: return 'investmentAssets';
      case 3: return 'realEstateAssets';
      case 4: return 'realEstateLiabilities';
      case 5: return 'otherLiabilities';
      default: return null;
    }
  };

  const getContextForStep = () => {
    switch (state.currentStep) {
      case 1: return 'cash';
      case 2: return 'investments';
      case 3: return 'realEstateAssets';
      case 4: return 'realEstateLiabilities';
      case 5: return 'otherLiabilities';
      default: return '';
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
                    placeholder={isLast ? "Add description..." : "Description"}
                    value={item.description}
                    onChange={(e) => handleUpdateItem(field, item.id, { description: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="w-36 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.value || ''}
                    onChange={(e) => handleUpdateItem(field, item.id, { value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl py-4 pl-8 pr-4 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold text-slate-800 text-right placeholder:text-slate-400"
                  />
                </div>
                <div className="w-10">
                  {!isEmpty && (
                    <button
                      onClick={() => handleRemoveItem(field, item.id)}
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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

  const renderChatMode = () => {
    const field = getFieldForStep();
    if (!field) return null;

    const contextDescriptions: Record<string, string> = {
      cashAssets: 'cash and bank accounts',
      investmentAssets: 'investments and securities',
      realEstateAssets: 'real estate assets',
      realEstateLiabilities: 'mortgages and property loans',
      otherLiabilities: 'other debts and liabilities'
    };

    return (
      <ChatMode
        context={getContextForStep()}
        contextDescription={contextDescriptions[field] || ''}
        existingItems={state.data[field] as FinancialItem[]}
        onItemsConfirmed={(items) => handleChatItemsConfirmed(field, items)}
        onSwitchToForm={() => setInputMode('form')}
        onSkip={handleSkipSection}
      />
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto">
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-4">
            {stepLabels.map((label, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    index < state.currentStep
                      ? 'bg-emerald-500 text-white'
                      : index === state.currentStep
                        ? 'bg-[#1e3a5f] text-white shadow-lg shadow-[#1e3a5f]/30'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {index < state.currentStep ? (
                      <span className="iconify" data-icon="solar:check-bold"></span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium ${
                    index === state.currentStep ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {index < stepLabels.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    index < state.currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3b82f6] to-[#1e3a5f] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-[#3b82f6] min-w-[3rem] text-right">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-grow overflow-y-auto py-8 px-8">
        <div className="max-w-2xl mx-auto">
          {/* Mode Toggle - Only for chat-enabled steps */}
          {isChatEnabled && (
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-400 mb-3">How do you want to enter this?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setInputMode('chat')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    inputMode === 'chat'
                      ? 'border-[#3b82f6] bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      inputMode === 'chat' ? 'bg-[#3b82f6] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <span className="iconify text-xl" data-icon="solar:chat-round-dots-bold"></span>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${inputMode === 'chat' ? 'text-[#3b82f6]' : 'text-slate-700'}`}>
                        Describe it
                      </p>
                      <p className="text-xs text-slate-500">AI extracts details</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setInputMode('form')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    inputMode === 'form'
                      ? 'border-[#3b82f6] bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      inputMode === 'form' ? 'bg-[#3b82f6] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <span className="iconify text-xl" data-icon="solar:list-bold"></span>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${inputMode === 'form' ? 'text-[#3b82f6]' : 'text-slate-700'}`}>
                        Fill fields
                      </p>
                      <p className="text-xs text-slate-500">Enter manually</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            {/* Step 0: Identity */}
            {state.currentStep === 0 && (
              <div className="space-y-8">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#3b82f6] to-[#1e3a5f] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                    <span className="iconify text-white text-xl" data-icon="solar:user-bold"></span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Let's start with the basics</h3>
                    <p className="text-sm text-slate-500">Who is this financial statement for?</p>
                  </div>
                </div>

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
                    className="w-full bg-white border-2 border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-blue-50 transition-all text-base font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="Enter your full legal name"
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
                    className="w-full bg-white border-2 border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-blue-50 transition-all text-base font-medium text-slate-800"
                  />
                </div>

                {/* Navigation for step 0 */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    onClick={onBack}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2"
                  >
                    <span className="iconify" data-icon="solar:arrow-left-linear"></span>
                    Back
                  </button>
                  <button
                    onClick={onNext}
                    className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#1e3a5f]/20 hover:shadow-xl flex items-center gap-2"
                  >
                    Continue
                    <span className="iconify" data-icon="solar:arrow-right-linear"></span>
                  </button>
                </div>
              </div>
            )}

            {/* Financial Steps - Chat or Form Mode */}
            {isChatEnabled && (
              inputMode === 'chat' ? (
                renderChatMode()
              ) : (
                <>
                  {state.currentStep === 1 && renderFinancialList('cashAssets', 'Cash & Bank Accounts')}
                  {state.currentStep === 2 && renderFinancialList('investmentAssets', 'Investments & Securities')}
                  {state.currentStep === 3 && renderFinancialList('realEstateAssets', 'Real Estate Assets')}
                  {state.currentStep === 4 && renderFinancialList('realEstateLiabilities', 'Mortgages & Property Loans')}
                  {state.currentStep === 5 && renderFinancialList('otherLiabilities', 'Other Liabilities')}

                  {/* Navigation for form mode */}
                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                      onClick={onBack}
                      className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2"
                    >
                      <span className="iconify" data-icon="solar:arrow-left-linear"></span>
                      Back
                    </button>
                    <button
                      onClick={onNext}
                      className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#1e3a5f]/20 hover:shadow-xl flex items-center gap-2"
                    >
                      Continue
                      <span className="iconify" data-icon="solar:arrow-right-linear"></span>
                    </button>
                  </div>
                </>
              )
            )}

            {/* Step 6: Final Review */}
            {state.currentStep === 6 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  <span className="iconify text-white text-4xl" data-icon="solar:check-circle-bold"></span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">All Done!</h3>
                <p className="text-slate-500 text-base max-w-sm mx-auto mb-8">
                  Your financial statement is complete. Review everything and download your lender-ready PDF.
                </p>
                <button
                  onClick={onNext}
                  className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8 py-4 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#1e3a5f]/20 hover:shadow-xl inline-flex items-center gap-2"
                >
                  Review & Download
                  <span className="iconify" data-icon="solar:arrow-right-linear"></span>
                </button>
              </div>
            )}
          </div>

          {/* Back button for chat mode */}
          {isChatEnabled && inputMode === 'chat' && (
            <div className="mt-6">
              <button
                onClick={onBack}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2"
              >
                <span className="iconify" data-icon="solar:arrow-left-linear"></span>
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepFlow;
