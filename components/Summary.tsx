
import React, { useRef, useState } from 'react';
import { PFSData, FinancialItem } from '../types';
import PDFPreview from './PDFPreview';

interface SummaryProps {
  data: PFSData;
  isLocked: boolean;
  onExportRequested: () => void;
  onEdit: () => void;
  onReset: () => void;
}

const Summary: React.FC<SummaryProps> = ({ data, isLocked, onExportRequested, onEdit, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
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
    }).format(val);
  };

  const handleExport = async () => {
    if (isLocked) {
      onExportRequested();
      return;
    }

    if (!pdfRef.current) return;
    setIsExporting(true);
    
    try {
      // @ts-ignore
      const html2canvas = window.html2canvas;
      // @ts-ignore
      const { jsPDF } = window.jspdf;

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PFS_${data.fullName.replace(/\s+/g, '_') || 'Fillio'}.pdf`);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full py-12 px-6 fade-in">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* Review Controls Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tighter">Review Statement</h2>
            <p className="text-gray-500 font-medium text-[14px] leading-relaxed">
              Verify your totals. {isLocked ? 'Document is ready for download after unlocking.' : 'You can now export your secure PDF.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl shadow-gray-200/40 space-y-8">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Assets</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Liabilities</p>
                <p className="text-xl font-bold text-gray-600">{formatCurrency(totalLiabilities)}</p>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Net Worth</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(netWorth)}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  isExporting 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95'
                }`}
              >
                <span className="iconify text-xl" data-icon={isLocked ? "solar:lock-bold-duotone" : "solar:printer-bold-duotone"}></span>
                {isExporting ? 'Preparing...' : isLocked ? 'Unlock & Download' : 'Export PDF'}
              </button>
              <button
                onClick={onEdit}
                className="w-full py-4.5 bg-white border border-gray-200 rounded-2xl font-bold text-slate-700 hover:bg-gray-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <span className="iconify text-lg" data-icon="solar:pen-bold-duotone"></span>
                Edit Data
              </button>
              <button
                onClick={onReset}
                className="w-full py-4 text-gray-400 font-bold hover:text-red-500 text-[10px] uppercase tracking-[0.25em] transition-all"
              >
                Reset & Restart
              </button>
            </div>
          </div>
        </div>

        {/* Live Document Preview Container */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
            <div className="bg-[#F8F9FA] px-10 py-5 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-amber-400' : 'bg-green-500'}`}></span> 
                {isLocked ? 'Preview Mode' : 'Ready for Export'}: {data.fullName || 'Untitled Statement'}
              </span>
              <div className="flex gap-2 text-slate-300">
                <span className="iconify text-lg" data-icon="solar:shield-check-bold-duotone"></span>
                <span className="iconify text-lg" data-icon="solar:verified-check-bold-duotone"></span>
              </div>
            </div>
            
            <div className={`p-8 bg-[#F3F4F6] overflow-auto scrollbar-hide max-h-[80vh] flex justify-center transition-all ${isLocked ? 'filter blur-[1px]' : ''}`}>
              <div ref={pdfRef} className="origin-top scale-[0.65] sm:scale-100 transform-gpu transition-transform">
                <PDFPreview data={data} totalAssets={totalAssets} totalLiabilities={totalLiabilities} netWorth={netWorth} />
              </div>
            </div>

            {isLocked && (
               <div className="absolute inset-x-0 bottom-0 top-[60px] flex items-center justify-center pointer-events-none">
                  <div className="bg-white/80 backdrop-blur-md px-10 py-8 rounded-[2rem] shadow-2xl border border-slate-100 text-center flex flex-col items-center gap-4 pointer-events-auto mb-20 transform -translate-y-1/2">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                      <span className="iconify text-3xl" data-icon="solar:document-add-bold-duotone"></span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Your doc is ready</h4>
                    <p className="text-slate-500 font-medium text-sm max-w-[240px]">Download your professional, bank-ready PDF in seconds.</p>
                    <button 
                      onClick={onExportRequested}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
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
