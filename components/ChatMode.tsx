import React, { useState, useRef, useEffect } from 'react';
import { FinancialItem } from '../types';

interface ParsedItem {
  category: string;
  description: string;
  value: number;
  type: 'asset' | 'liability';
  subtype?: string;
}

interface ChatModeProps {
  context: string;
  contextDescription: string;
  onItemsConfirmed: (items: FinancialItem[]) => void;
  onSwitchToForm: () => void;
  existingItems?: FinancialItem[];
}

const ChatMode: React.FC<ChatModeProps> = ({
  context,
  contextDescription,
  onItemsConfirmed,
  onSwitchToForm,
  existingItems = []
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const getPromptForContext = () => {
    switch (context) {
      case 'cash':
        return "Tell me about your bank accounts, checking, savings, or any cash you have...";
      case 'investments':
        return "Describe your investments — stocks, bonds, 401k, IRA, mutual funds...";
      case 'realEstateAssets':
        return "Tell me about properties you own — your home, rental properties, land...";
      case 'realEstateLiabilities':
        return "What mortgages or property loans do you have?";
      case 'otherLiabilities':
        return "Describe your other debts — credit cards, car loans, student loans, personal loans...";
      default:
        return "Tell me about your finances...";
    }
  };

  const getExampleForContext = () => {
    switch (context) {
      case 'cash':
        return 'Example: "I have about 12k in my Chase checking and maybe 5k in savings at Wells Fargo"';
      case 'investments':
        return 'Example: "My 401k through Fidelity has around 85k, and I have about 10k in a Robinhood brokerage"';
      case 'realEstateAssets':
        return 'Example: "My house is worth about 450k, and I have a rental property worth maybe 280k"';
      case 'realEstateLiabilities':
        return 'Example: "I owe about 320k on my primary home and 210k on the rental property"';
      case 'otherLiabilities':
        return 'Example: "I have like 4k on my Amex, a car loan with 18k left, and I owe my parents 5k"';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/parse-financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim(), context })
      });

      if (!response.ok) {
        throw new Error('Failed to process input');
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setParsedItems(data.items);
        setSuggestions(data.suggestions || []);
        setFollowUp(data.followUp || null);
        setShowResults(true);
      } else {
        setError("I couldn't find any financial items in your description. Try being more specific about amounts.");
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError("Something went wrong. Please try again or switch to form mode.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleConfirm = () => {
    const newItems: FinancialItem[] = parsedItems.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      description: item.description,
      value: item.value
    }));
    onItemsConfirmed([...existingItems.filter(i => i.description || i.value), ...newItems]);
  };

  const handleEditItem = (index: number, field: 'description' | 'value', newValue: string | number) => {
    const updated = [...parsedItems];
    if (field === 'description') {
      updated[index].description = newValue as string;
    } else {
      updated[index].value = newValue as number;
    }
    setParsedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems(parsedItems.filter((_, i) => i !== index));
  };

  const handleAddMore = () => {
    setShowResults(false);
    setInput('');
    setParsedItems([]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cash: 'solar:wallet-bold',
      investment: 'solar:chart-bold',
      realEstate: 'solar:home-bold',
      vehicle: 'solar:car-bold',
      mortgage: 'solar:home-bold',
      autoLoan: 'solar:car-bold',
      creditCard: 'solar:card-bold',
      studentLoan: 'solar:diploma-bold',
      personalLoan: 'solar:user-bold',
      other: 'solar:box-bold'
    };
    return icons[category] || 'solar:document-bold';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash/Bank',
      investment: 'Investment',
      realEstate: 'Real Estate',
      vehicle: 'Vehicle',
      mortgage: 'Mortgage',
      autoLoan: 'Auto Loan',
      creditCard: 'Credit Card',
      studentLoan: 'Student Loan',
      personalLoan: 'Personal Loan',
      businessLoan: 'Business Loan',
      other: 'Other'
    };
    return labels[category] || category;
  };

  if (showResults && parsedItems.length > 0) {
    const total = parsedItems.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <span className="iconify text-emerald-500 text-xl" data-icon="solar:check-circle-bold"></span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Found {parsedItems.length} {parsedItems.length === 1 ? 'item' : 'items'}
            </h3>
            <p className="text-sm text-slate-500">Review and confirm</p>
          </div>
        </div>

        {/* Parsed Items */}
        <div className="space-y-3">
          {parsedItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl group"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="iconify text-[#3b82f6] text-lg" data-icon={getCategoryIcon(item.category)}></span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleEditItem(index, 'description', e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none focus:bg-white focus:px-2 focus:py-1 focus:rounded transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => handleEditItem(index, 'value', parseFloat(e.target.value) || 0)}
                  className="w-28 text-right bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <span className="iconify text-lg" data-icon="solar:trash-bin-trash-bold"></span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-4 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(total)}</span>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <span className="iconify text-amber-500 text-lg mt-0.5" data-icon="solar:lightbulb-bolt-bold"></span>
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Suggestion</p>
                {suggestions.map((suggestion, i) => (
                  <p key={i} className="text-sm text-amber-700">{suggestion}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Question */}
        {followUp && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <span className="iconify text-blue-500 text-lg mt-0.5" data-icon="solar:chat-round-dots-bold"></span>
              <p className="text-sm text-blue-700">{followUp}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handleAddMore}
            className="text-sm font-medium text-[#3b82f6] hover:text-[#2563eb] transition-colors"
          >
            + Add More
          </button>
          <button
            onClick={handleConfirm}
            className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Looks Good
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Prompt */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#1e3a5f] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="iconify text-white text-lg" data-icon="solar:chat-round-dots-bold"></span>
        </div>
        <div>
          <p className="text-base font-medium text-slate-800 mb-1">{getPromptForContext()}</p>
          <p className="text-xs text-slate-400">{getExampleForContext()}</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type naturally — I'll figure out the categories and amounts..."
          rows={4}
          disabled={isProcessing}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#3b82f6] focus:bg-white transition-all text-base text-slate-800 placeholder:text-slate-400 resize-none disabled:opacity-50"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-slate-600">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSwitchToForm}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-2"
        >
          <span className="iconify" data-icon="solar:list-bold"></span>
          Switch to form view
        </button>
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="bg-[#1e3a5f] hover:bg-[#162d4a] disabled:bg-slate-300 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          Continue
          <span className="iconify" data-icon="solar:arrow-right-linear"></span>
        </button>
      </div>

      {/* Existing Items */}
      {existingItems.filter(i => i.description || i.value).length > 0 && (
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Already Added</p>
          <div className="space-y-2">
            {existingItems.filter(i => i.description || i.value).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.description}</span>
                <span className="font-medium text-slate-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMode;
