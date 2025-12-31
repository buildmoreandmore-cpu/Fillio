import React, { useRef, useState } from 'react';
import { PFSData, FinancialItem } from '../types';
import PDFPreview from './PDFPreview';

interface SummaryProps {
  data: PFSData;
  onEdit: () => void;
  onReset: () => void;
}

const Summary: React.FC<SummaryProps> = ({ data, onEdit, onReset }) => {
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
              Verify your totals. Once confirmed, you can export a secure PDF for your records.
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
                <span className="iconify text-xl" data-icon="solar:printer-bold-duotone"></span>
                {isExporting ? 'Preparing...' : 'Export PDF'}
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
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="bg-[#F8F9FA] px-10 py-5 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> 
                Previewing: {data.fullName || 'Untitled Statement'}
              </span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              </div>
            </div>
            <div className="p-8 bg-[#F3F4F6] overflow-auto scrollbar-hide max-h-[80vh] flex justify-center">
              <div ref={pdfRef} className="origin-top scale-[0.65] sm:scale-100 transform-gpu transition-transform">
                <PDFPreview data={data} totalAssets={totalAssets} totalLiabilities={totalLiabilities} netWorth={netWorth} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Summary;