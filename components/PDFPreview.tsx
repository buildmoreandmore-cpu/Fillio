
import React from 'react';
import { PFSData, FinancialItem } from '../types';

interface PDFPreviewProps {
  data: PFSData;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ data, totalAssets, totalLiabilities, netWorth }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val);
  };

  const Section = ({ title, items }: { title: string, items: FinancialItem[] }) => (
    <div className="mb-6">
      <div className="flex justify-between border-b-2 border-slate-200 pb-1 mb-2">
        <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic">None reported.</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-[11px] leading-tight">
              <span className="text-slate-700">{item.description || 'Untitled'}</span>
              <span className="text-slate-900 font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white p-12 text-slate-900 min-h-[1056px] flex flex-col font-sans border border-slate-100 shadow-inner">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 leading-none uppercase">Personal Financial Statement</h1>
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Strictly Confidential</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 uppercase">{data.fullName || 'NOT SPECIFIED'}</p>
          <p className="text-slate-500 text-xs">As of {new Date(data.asOfDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-2 gap-12">
        {/* Left Column: Assets */}
        <div>
          <h2 className="text-sm font-black bg-slate-900 text-white px-3 py-1 inline-block uppercase mb-6">Section I: Assets</h2>
          
          <Section title="Cash & Bank Accounts" items={data.cashAssets} />
          <Section title="Investments & Securities" items={data.investmentAssets} />
          <Section title="Real Estate Assets" items={data.realEstateAssets} />

          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex justify-between">
            <span className="text-xs font-black uppercase">Total Assets</span>
            <span className="text-sm font-black text-slate-900">{formatCurrency(totalAssets)}</span>
          </div>
        </div>

        {/* Right Column: Liabilities */}
        <div>
          <h2 className="text-sm font-black bg-slate-900 text-white px-3 py-1 inline-block uppercase mb-6">Section II: Liabilities</h2>
          
          <Section title="Real Estate Mortgages" items={data.realEstateLiabilities} />
          <Section title="Other Liabilities & Debts" items={data.otherLiabilities} />

          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex justify-between">
            <span className="text-xs font-black uppercase">Total Liabilities</span>
            <span className="text-sm font-black text-slate-900">{formatCurrency(totalLiabilities)}</span>
          </div>

          <div className="mt-12 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase text-slate-500">Net Worth Computation</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
              <span className="text-sm font-black uppercase text-slate-900">Calculated Net Worth</span>
              <span className="text-lg font-black text-emerald-800">{formatCurrency(netWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-16 pt-12 border-t border-slate-200 grid grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-px bg-slate-900 w-full"></div>
          <p className="text-[10px] font-bold uppercase text-slate-400">Signature of Individual</p>
        </div>
        <div className="space-y-4">
          <div className="h-px bg-slate-900 w-full"></div>
          <p className="text-[10px] font-bold uppercase text-slate-400">Date Signed</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 flex justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100">
        <p>Generated via BankReadyDocs. This document serves as a representation of personal finances based on information provided by the user.</p>
        <p>Page 1 of 1</p>
      </div>
    </div>
  );
};

export default PDFPreview;
