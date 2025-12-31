
import React, { useState } from 'react';
import { PFSData } from '../types';
import { useAuth } from '../lib/auth';
import { isStripeConfigured } from '../lib/stripe';

interface PaywallProps {
  data: PFSData;
  onBack: () => void;
  onSuccess: (type: 'one-time' | 'subscription') => void;
  onSignup: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ data, onBack, onSuccess, onSignup }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<'one-time' | 'subscription' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceType: 'one-time' | 'subscription') => {
    setError(null);

    // If Stripe not configured, use demo mode
    if (!isStripeConfigured()) {
      onSuccess(priceType);
      return;
    }

    setIsLoading(priceType);

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType,
          userId: user?.id || null,
          documentId: null,
          successUrl: `${window.location.origin}?checkout=success`,
          cancelUrl: `${window.location.origin}?checkout=cancelled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        // Fallback to demo mode if no URL returned
        onSuccess(priceType);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError('Payment system unavailable. Using demo mode.');
      // Fallback to demo mode
      setTimeout(() => onSuccess(priceType), 1500);
    } finally {
      setIsLoading(null);
    }
  };
  // Calculate totals from actual data
  const totalCash = data.cashAssets.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalInvestments = data.investmentAssets.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalRealEstateAssets = data.realEstateAssets.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalAssets = totalCash + totalInvestments + totalRealEstateAssets;

  const totalRealEstateLiabilities = data.realEstateLiabilities.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalOtherLiabilities = data.otherLiabilities.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalLiabilities = totalRealEstateLiabilities + totalOtherLiabilities;

  const netWorth = totalAssets - totalLiabilities;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const blurNumber = (value: number) => {
    // Show rough magnitude but blur exact amount
    const str = formatCurrency(value);
    return str.replace(/\d/g, '•');
  };

  // Get first name for personalization
  const firstName = data.fullName?.split(' ')[0] || 'Your';

  return (
    <div className="min-h-full py-16 px-6 flex flex-col items-center max-w-6xl mx-auto fade-in">
      {/* Professional Header - No Emoji */}
      <div className="text-center mb-12 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          {firstName}'s Personal Financial Statement is <span className="text-emerald-600">ready</span>.
        </h2>
        <p className="text-slate-500 text-base">
          Bank-ready format. Professional layout. Download and send.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full items-start">
        {/* Left Side: Preview + Summary */}
        <div className="space-y-6">
          {/* Document Preview - Readable structure, blurred numbers */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Preview</span>
              <span className="iconify text-slate-300" data-icon="solar:lock-bold"></span>
            </div>

            {/* Structured Preview */}
            <div className="p-6 font-mono text-xs">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Personal Financial Statement</h3>
                <p className="text-slate-500 mt-1">{data.fullName || 'Your Name'}</p>
                <p className="text-slate-400 text-[10px]">{data.asOfDate || new Date().toLocaleDateString()}</p>
              </div>

              {/* Assets Section */}
              <div className="mb-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Section I: Assets</div>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Cash & Bank Accounts</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investments</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalInvestments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real Estate</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalRealEstateAssets)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold">
                    <span>Total Assets</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities Section */}
              <div className="mb-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Section II: Liabilities</div>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Mortgages</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalRealEstateLiabilities)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Liabilities</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalOtherLiabilities)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold">
                    <span>Total Liabilities</span>
                    <span className="text-slate-300 blur-[3px] select-none">{blurNumber(totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Net Worth - Blurred */}
              <div className="pt-3 border-t-2 border-slate-200">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-800">Net Worth</span>
                  <span className="text-slate-300 blur-[4px] select-none">{blurNumber(netWorth)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Summary - Sunk Cost Reinforcement */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="iconify text-emerald-500 text-lg" data-icon="solar:chart-2-bold"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Summary</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Assets</span>
                <span className="text-lg font-bold text-slate-800">{formatCurrency(totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Liabilities</span>
                <span className="text-lg font-bold text-slate-800">{formatCurrency(totalLiabilities)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Net Worth</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(netWorth)}</span>
                  <span className="iconify text-emerald-500" data-icon="solar:verified-check-bold"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Pricing Options */}
        <div className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              {error}
            </div>
          )}

          {/* One-Time Download */}
          <div
            onClick={() => !isLoading && handleCheckout('one-time')}
            className={`group relative bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">One-Time Download</h3>
                <p className="text-slate-500 text-sm">Download this document only</p>
              </div>
              <div className="text-2xl font-bold text-slate-900">$9</div>
            </div>
            <ul className="space-y-2.5 mb-5">
              <li className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="iconify text-emerald-500" data-icon="solar:check-circle-bold"></span>
                Clean, no-watermark PDF
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="iconify text-emerald-500" data-icon="solar:check-circle-bold"></span>
                24-hour edit window
              </li>
            </ul>
            <button
              disabled={!!isLoading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading === 'one-time' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Download Now — $9'
              )}
            </button>
          </div>

          {/* Pro Unlimited - Best Value */}
          <div
            onClick={() => !isLoading && handleCheckout('subscription')}
            className={`group relative bg-white border-2 border-blue-500 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-500/10 ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}
          >
            <div className="absolute -top-3 right-6 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="iconify text-yellow-300" data-icon="solar:star-bold"></span>
              Best Value
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Unlimited Pro</h3>
                <p className="text-slate-500 text-sm">All documents + all features</p>
              </div>
              <div className="text-2xl font-bold text-slate-900">$12<span className="text-sm text-slate-400 font-normal">/mo</span></div>
            </div>
            <ul className="space-y-2.5 mb-5">
              <li className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="iconify text-blue-500" data-icon="solar:infinity-bold"></span>
                Unlimited document exports
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="iconify text-blue-500" data-icon="solar:cloud-bold"></span>
                Cloud save & multi-device sync
              </li>
            </ul>

            {/* Bank Sync Feature Highlight */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="iconify text-blue-600 text-lg" data-icon="solar:bolt-bold"></span>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Bank Sync</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[10px] text-slate-500 mb-1">Manual entry</div>
                  <div className="h-2 bg-slate-200 rounded-full w-full"></div>
                  <div className="text-[10px] text-slate-400 mt-1">~5 minutes</div>
                </div>
                <span className="iconify text-slate-400" data-icon="solar:arrow-right-linear"></span>
                <div className="flex-1">
                  <div className="text-[10px] text-blue-600 font-semibold mb-1">With Pro</div>
                  <div className="h-2 bg-blue-500 rounded-full w-1/6"></div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-1">~30 seconds</div>
                </div>
              </div>
            </div>

            <button
              disabled={!!isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading === 'subscription' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Get Pro — $12/mo'
              )}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <span className="iconify" data-icon="solar:lock-bold"></span>
              <span className="text-xs font-medium">Secure payment via Stripe</span>
            </div>
            <button
              onClick={onBack}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              &larr; Back to Edit
            </button>
          </div>

          {/* Save Draft Option - Integrated */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="iconify text-slate-400 text-lg" data-icon="solar:bookmark-bold"></span>
              <span className="text-sm text-slate-500">Not ready?</span>
            </div>
            <button
              onClick={onSignup}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Save draft — free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
