
import React, { useRef, useState, useEffect } from 'react';
import { PFSData, FinancialItem } from '../types';
import PDFPreview from './PDFPreview';
import { downloadPDF } from './PDFDocument';

interface SummaryProps {
  data: PFSData;
  isLocked: boolean;
  onExportRequested: () => void;
  onEdit: () => void;
  onReset: () => void;
}

interface AIInsight {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
  explanation: string;
}

interface AIIssue {
  type: 'warning' | 'error' | 'suggestion';
  message: string;
}

interface AIReview {
  issues: AIIssue[];
  insights: AIInsight[];
  overallHealth: 'good' | 'fair' | 'needs-attention';
}

const Summary: React.FC<SummaryProps> = ({ data, isLocked, onExportRequested, onEdit, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [aiReview, setAIReview] = useState<AIReview | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const calculateTotal = (items: FinancialItem[]) => {
    return items.reduce((acc, curr) => acc + (curr.value || 0), 0);
  };

  const totalAssets =
    calculateTotal(data.cashAssets) +
    calculateTotal(data.investmentAssets) +
    calculateTotal(data.realEstateAssets);

  const totalLiabilities =
    calculateTotal(data.realEstateLiabilities) +
    calculateTotal(data.otherLiabilities);

  const netWorth = totalAssets - totalLiabilities;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Fetch AI review on mount
  useEffect(() => {
    const fetchAIReview = async () => {
      setIsReviewing(true);
      try {
        const response = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'review',
            data: {
              assets: {
                cash: data.cashAssets.filter(i => i.description || i.value),
                investments: data.investmentAssets.filter(i => i.description || i.value),
                realEstate: data.realEstateAssets.filter(i => i.description || i.value),
              },
              liabilities: {
                realEstate: data.realEstateLiabilities.filter(i => i.description || i.value),
                other: data.otherLiabilities.filter(i => i.description || i.value),
              },
              totals: {
                totalAssets,
                totalLiabilities,
                netWorth
              }
            }
          })
        });

        if (response.ok) {
          const review = await response.json();
          setAIReview(review);
        }
      } catch (error) {
        console.error('AI review failed:', error);
      } finally {
        setIsReviewing(false);
      }
    };

    // Only fetch if there's meaningful data
    if (totalAssets > 0 || totalLiabilities > 0) {
      fetchAIReview();
    }
  }, []);

  const handleExport = async () => {
    if (isLocked) {
      onExportRequested();
      return;
    }

    setIsExporting(true);

    try {
      await downloadPDF(data);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-emerald-600 bg-emerald-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'bad': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return 'solar:danger-triangle-bold';
      case 'warning': return 'solar:info-circle-bold';
      case 'suggestion': return 'solar:lightbulb-bolt-bold';
      default: return 'solar:info-circle-bold';
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500 bg-red-50 border-red-100';
      case 'warning': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'suggestion': return 'text-blue-500 bg-blue-50 border-blue-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="min-h-full py-12 px-6 fade-in">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">

        {/* Review Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Review Statement</h2>
            <p className="text-slate-500 text-sm">
              {isLocked ? 'Document is ready for download after unlocking.' : 'Verify your totals and export your PDF.'}
            </p>
          </div>

          {/* Totals Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Liabilities</p>
                <p className="text-xl font-bold text-slate-600">{formatCurrency(totalLiabilities)}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-1">Net Worth</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(netWorth)}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isExporting
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1e3a5f] hover:bg-[#162d4a] text-white'
                }`}
              >
                <span className="iconify text-lg" data-icon={isLocked ? "solar:lock-bold" : "solar:download-bold"}></span>
                {isExporting ? 'Preparing...' : isLocked ? 'Unlock & Download' : 'Export PDF'}
              </button>
              <button
                onClick={onEdit}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all text-sm flex items-center justify-center gap-2"
              >
                <span className="iconify" data-icon="solar:pen-bold"></span>
                Edit Data
              </button>
              <button
                onClick={onReset}
                className="w-full py-2 text-slate-400 font-medium hover:text-red-500 text-xs transition-all"
              >
                Reset & Start Over
              </button>
            </div>
          </div>

          {/* AI Insights Card */}
          {(isReviewing || aiReview) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#3b82f6] to-[#1e3a5f] rounded-lg flex items-center justify-center">
                    <span className="iconify text-white text-sm" data-icon="solar:magic-stick-bold"></span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">AI Review</span>
                </div>
                {isReviewing ? (
                  <div className="w-4 h-4 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="iconify text-slate-400" data-icon={showInsights ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}></span>
                )}
              </button>

              {showInsights && aiReview && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Overall Health */}
                  <div className={`p-3 rounded-xl ${
                    aiReview.overallHealth === 'good' ? 'bg-emerald-50' :
                    aiReview.overallHealth === 'fair' ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`iconify text-lg ${
                        aiReview.overallHealth === 'good' ? 'text-emerald-500' :
                        aiReview.overallHealth === 'fair' ? 'text-amber-500' : 'text-red-500'
                      }`} data-icon={
                        aiReview.overallHealth === 'good' ? 'solar:check-circle-bold' :
                        aiReview.overallHealth === 'fair' ? 'solar:info-circle-bold' : 'solar:danger-triangle-bold'
                      }></span>
                      <span className="text-sm font-medium text-slate-700">
                        {aiReview.overallHealth === 'good' ? 'Statement looks good!' :
                         aiReview.overallHealth === 'fair' ? 'A few items to review' : 'Needs attention'}
                      </span>
                    </div>
                  </div>

                  {/* Insights */}
                  {aiReview.insights && aiReview.insights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Metrics</p>
                      {aiReview.insights.map((insight, i) => (
                        <div key={i} className={`p-3 rounded-xl ${getStatusColor(insight.status)}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold">{insight.label}</span>
                            <span className="text-sm font-bold">{insight.value}</span>
                          </div>
                          <p className="text-xs opacity-80">{insight.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Issues */}
                  {aiReview.issues && aiReview.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggestions</p>
                      {aiReview.issues.map((issue, i) => (
                        <div key={i} className={`p-3 rounded-xl border ${getIssueColor(issue.type)}`}>
                          <div className="flex items-start gap-2">
                            <span className="iconify text-lg mt-0.5" data-icon={getIssueIcon(issue.type)}></span>
                            <p className="text-xs">{issue.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Document Preview Container */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                {isLocked ? 'Preview Mode' : 'Ready for Export'}: {data.fullName || 'Untitled Statement'}
              </span>
              <div className="flex gap-2 text-slate-300">
                <span className="iconify text-lg" data-icon="solar:shield-check-bold"></span>
              </div>
            </div>

            <div className={`p-8 bg-slate-50 overflow-auto max-h-[80vh] flex justify-center transition-all ${isLocked ? 'filter blur-[1px]' : ''}`}>
              <div ref={pdfRef} className="origin-top scale-[0.65] sm:scale-100 transform-gpu transition-transform">
                <PDFPreview data={data} totalAssets={totalAssets} totalLiabilities={totalLiabilities} netWorth={netWorth} />
              </div>
            </div>

            {isLocked && (
               <div className="absolute inset-x-0 bottom-0 top-[60px] flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md px-8 py-6 rounded-2xl shadow-lg border border-slate-100 text-center flex flex-col items-center gap-3 pointer-events-auto mb-20 transform -translate-y-1/2">
                    <div className="w-14 h-14 bg-blue-50 text-[#3b82f6] rounded-xl flex items-center justify-center mb-2">
                      <span className="iconify text-2xl" data-icon="solar:document-add-bold"></span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Your doc is ready</h4>
                    <p className="text-slate-500 text-sm max-w-[220px]">Download your professional, bank-ready PDF.</p>
                    <button
                      onClick={onExportRequested}
                      className="mt-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                    >
                      Unlock Now
                    </button>
                  </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Summary;
