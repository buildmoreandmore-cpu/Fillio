
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onHomeClick: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onHomeClick, onLogout }) => {
  // Mock data for workspace feel
  const recentDocs = [
    { id: '1', title: 'Personal Financial Statement', status: 'Draft', date: 'Edited 2 days ago', type: 'amber' },
    { id: '2', title: 'Debt Schedule 2024', status: 'Complete', date: 'Dec 15, 2024', type: 'emerald' },
    { id: '3', title: 'Q4 Balance Sheet', status: 'Complete', date: 'Nov 28, 2024', type: 'emerald' },
  ];

  const connectedAccounts = [
    { name: 'Chase Checking', id: '••••4521', synced: true },
    { name: 'Wells Fargo Sav', id: '••••8832', synced: true },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Primary Global Navigation Rail */}
      <aside className="w-[72px] flex-shrink-0 border-r border-slate-200 flex flex-col items-center py-8 justify-between bg-white z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center gap-10">
          <button 
            onClick={onHomeClick} 
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all group"
          >
            <span className="iconify text-2xl" data-icon="solar:wallet-bold-duotone"></span>
          </button>
          
          <nav className="flex flex-col gap-8 text-slate-300">
            <button className="p-2 hover:text-blue-600 transition-colors relative group">
              <span className="iconify text-2xl" data-icon="solar:home-2-bold-duotone"></span>
            </button>
            <button className="p-2 hover:text-blue-600 transition-colors relative group">
              <span className="iconify text-2xl" data-icon="solar:history-bold-duotone"></span>
            </button>
            <button className="p-2 hover:text-blue-600 transition-colors relative group">
              <span className="iconify text-2xl" data-icon="solar:database-bold-duotone"></span>
            </button>
            <button className="p-2 hover:text-blue-600 transition-colors relative group">
              <span className="iconify text-2xl" data-icon="solar:settings-bold-duotone"></span>
            </button>
          </nav>
        </div>
        <div className="flex flex-col gap-6 text-slate-300">
          <button className="p-2 hover:text-blue-600 transition-colors">
            <span className="iconify text-2xl" data-icon="solar:bell-bold-duotone"></span>
          </button>
        </div>
      </aside>

      {/* Workspace Sidebar */}
      <aside className="w-[300px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col z-20 overflow-y-auto scrollbar-hide">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Workspace</span>
        </div>

        <div className="p-6 space-y-8 flex-grow">
          <button 
            onClick={onHomeClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-[12px] font-black uppercase tracking-widest"
          >
            <span className="iconify text-xl" data-icon="solar:add-circle-bold-duotone"></span>
            Create New Doc
          </button>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Docs</h4>
              <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer hover:shadow-lg hover:shadow-slate-200/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${doc.type === 'amber' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{doc.status}</span>
                  </div>
                  <h5 className="text-[13px] font-bold text-slate-900 mb-1 truncate">{doc.title}</h5>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">{doc.date}</span>
                    <span className="iconify text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" data-icon="solar:alt-arrow-right-bold-duotone"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connections</h4>
              <button className="text-slate-300 hover:text-blue-600">
                <span className="iconify text-lg" data-icon="solar:add-square-bold-duotone"></span>
              </button>
            </div>
            <div className="space-y-2">
              {connectedAccounts.map((acc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="iconify text-xl text-slate-400" data-icon="solar:banknote-bold-duotone"></span>
                    <div>
                      <p className="text-[12px] font-bold text-slate-900 leading-none mb-1">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{acc.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white border-2 border-white shadow-sm rounded-full flex items-center justify-center text-[12px] font-black text-slate-900">
              JD
            </div>
            <div className="flex-grow">
              <h6 className="text-[13px] font-black text-slate-900 leading-none mb-1">John Doe</h6>
              <span className="text-[10px] font-bold text-slate-400">Pro Plan</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
          >
            Logout
            <span className="iconify text-lg" data-icon="solar:logout-2-linear"></span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow flex flex-col overflow-hidden bg-white">
        <header className="h-16 flex items-center px-12 gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Fillio</span>
          <span className="text-slate-200 text-2xl font-thin">/</span>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.25em]">Workspace</span>
        </header>

        <main className="flex-grow overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
