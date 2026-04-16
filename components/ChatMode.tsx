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
  onSkip: () => void;
  existingItems?: FinancialItem[];
}

const ChatMode: React.FC<ChatModeProps> = ({
  context,
  contextDescription,
  onItemsConfirmed,
  onSwitchToForm,
  onSkip,
  existingItems = []
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
        return {
          title: "Tell me about your bank accounts",
          subtitle: "Checking, savings, or any cash you have on hand"
        };
      case 'investments':
        return {
          title: "What investments do you have?",
          subtitle: "Stocks, bonds, 401k, IRA, mutual funds..."
        };
      case 'realEstateAssets':
        return {
          title: "Do you own any property?",
          subtitle: "Your home, rental properties, land..."
        };
      case 'realEstateLiabilities':
        return {
          title: "What mortgages or property loans do you have?",
          subtitle: "Home loans, property mortgages..."
        };
      case 'otherLiabilities':
        return {
          title: "Any other debts?",
          subtitle: "Credit cards, car loans, student loans, personal loans..."
        };
      default:
        return { title: "Tell me about your finances", subtitle: "" };
    }
  };

  const getPromptStarters = () => {
    switch (context) {
      case 'cash':
        return [
          "I have a checking account at...",
          "My savings is about...",
          "I keep cash in..."
        ];
      case 'investments':
        return [
          "My 401k has about...",
          "I have stocks worth...",
          "My retirement accounts..."
        ];
      case 'realEstateAssets':
        return [
          "My house is worth about...",
          "I own a rental property...",
          "I have land valued at..."
        ];
      case 'realEstateLiabilities':
        return [
          "I owe about... on my mortgage",
          "My home loan balance is...",
          "I have a HELOC with..."
        ];
      case 'otherLiabilities':
        return [
          "I have about... on credit cards",
          "My car loan is...",
          "I owe... in student loans"
        ];
      default:
        return [];
    }
  };

  const getSkipText = () => {
    switch (context) {
      case 'cash':
        return "I don't have any bank accounts to add";
      case 'investments':
        return "I don't have any investments";
      case 'realEstateAssets':
        return "I don't own any property";
      case 'realEstateLiabilities':
        return "I don't have any mortgages";
      case 'otherLiabilities':
        return "I don't have any other debts";
      default:
        return "Skip this section";
    }
  };

  const handlePromptStarter = (starter: string) => {
    setInput(starter);
    textareaRef.current?.focus();
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
        setShowResults(true);
      } else {
        setError("I couldn't find any items. Try being more specific about amounts.");
      }
    } catch (err) {
      setError("Something went wrong. Try again or switch to form mode.");
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

  const prompt = getPromptForContext();
  const promptStarters = getPromptStarters();

  // Results View
  if (showResults && parsedItems.length > 0) {
    const total = parsedItems.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Success Header */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <span className="iconify text-emerald-600 text-xl" data-icon="solar:check-circle-bold"></span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-800">
              Found {parsedItems.length} {parsedItems.length === 1 ? 'item' : 'items'}
            </h3>
            <p className="text-xs text-emerald-600">Review and confirm below</p>
          </div>
        </div>

        {/* Parsed Items */}
        <div className="space-y-2">
          {parsedItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="iconify text-[#1D9E75] text-lg" data-icon={getCategoryIcon(item.category)}></span>
              </div>
              <div className="flex-grow min-w-0">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleEditItem(index, 'description', e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none focus:bg-slate-50 focus:px-2 focus:py-1 focus:-mx-2 focus:-my-1 rounded transition-all"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => handleEditItem(index, 'value', parseFloat(e.target.value) || 0)}
                  className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-emerald-50"
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <span className="iconify" data-icon="solar:trash-bin-trash-bold"></span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Running Total */}
        <div className="flex justify-between items-center py-4 px-2 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-xl font-bold text-slate-800">{formatCurrency(total)}</span>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <span className="iconify text-amber-500 text-lg mt-0.5" data-icon="solar:lightbulb-bolt-bold"></span>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Suggestion</p>
                {suggestions.map((s, i) => (
                  <p key={i} className="text-sm text-amber-600">{s}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleAddMore}
            className="text-sm font-medium text-[#1D9E75] hover:text-[#168A63] transition-colors flex items-center gap-1"
          >
            <span className="iconify" data-icon="solar:add-circle-linear"></span>
            Add More
          </button>
          <button
            onClick={handleConfirm}
            className="bg-[#0B2820] hover:bg-[#071E17] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#0B2820]/20 hover:shadow-xl flex items-center gap-2"
          >
            Looks Good
            <span className="iconify" data-icon="solar:arrow-right-linear"></span>
          </button>
        </div>
      </div>
    );
  }

  // Input View
  return (
    <div className="space-y-6">
      {/* AI Prompt */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#1D9E75] to-[#0B2820] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <span className="iconify text-white text-xl" data-icon="solar:chat-round-dots-bold"></span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">{prompt.title}</h3>
          <p className="text-sm text-slate-500">{prompt.subtitle}</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type naturally — AI will extract the details..."
          rows={4}
          disabled={isProcessing}
          className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 px-5 outline-none focus:border-[#1D9E75] focus:ring-4 focus:ring-emerald-50 transition-all text-base text-slate-800 placeholder:text-slate-400 resize-none disabled:opacity-50"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-slate-600">Understanding your input...</span>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Starters */}
      {!input && promptStarters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 px-1">Or start with:</p>
          <div className="flex flex-wrap gap-2">
            {promptStarters.map((starter, i) => (
              <button
                key={i}
                onClick={() => handlePromptStarter(starter)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-full transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
          <span className="iconify text-red-500 text-lg" data-icon="solar:danger-triangle-bold"></span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onSwitchToForm}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-2"
        >
          <span className="iconify" data-icon="solar:list-bold"></span>
          Fill fields manually
        </button>
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            input.trim()
              ? 'bg-[#0B2820] hover:bg-[#071E17] text-white shadow-lg shadow-[#0B2820]/20 hover:shadow-xl'
              : 'bg-slate-100 text-slate-400 cursor-default'
          }`}
        >
          Continue
          <span className="iconify" data-icon="solar:arrow-right-linear"></span>
        </button>
      </div>

      {/* Skip Option */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={onSkip}
          className="w-full py-3 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="iconify" data-icon="solar:skip-next-linear"></span>
          {getSkipText()}
        </button>
      </div>

      {/* Existing Items */}
      {existingItems.filter(i => i.description || i.value).length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Already Added</p>
          <div className="space-y-2">
            {existingItems.filter(i => i.description || i.value).map((item, i) => (
              <div key={i} className="flex justify-between text-sm p-3 bg-slate-50 rounded-lg">
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
