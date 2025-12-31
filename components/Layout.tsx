
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onHomeClick: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onHomeClick, onLogout }) => {
  const recentDocs = [
    { id: '1', title: 'Personal Financial Statement', status: 'DRAFT', date: 'Edited 2 days ago', statusColor: 'amber' },
    { id: '2', title: 'Debt Schedule 2024', status: 'COMPLETE', date: 'Dec 15, 2024', statusColor: 'emerald' },
    { id: '3', title: 'Q4 Balance Sheet', status: 'COMPLETE', date: 'Nov 28, 2024', statusColor: 'emerald' },
  ];

  const stats = {
    total: 3,
    complete: 2,
    draft: 1
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Icon Rail - Darker Background */}
      <aside className="w-14 flex-shrink-0 border-r border-slate-200 flex flex-col items-center py-6 bg-[#F1F5F9]">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <button
            onClick={onHomeClick}
            className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center text-white hover:bg-[#162d4a] transition-all shadow-lg shadow-[#1e3a5f]/20"
          >
            <span className="iconify text-lg" data-icon="solar:document-text-bold"></span>
          </button>

          {/* Nav Icons with Active States */}
          <nav className="flex flex-col gap-2 mt-4">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-[#1e3a5f] shadow-sm transition-all relative">
              <span className="iconify text-xl" data-icon="solar:home-2-bold"></span>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#1e3a5f] rounded-r-full"></div>
            </button>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e3a5f] hover:bg-white/60 transition-all group relative">
              <span className="iconify text-xl" data-icon="solar:clock-circle-bold"></span>
              <div className="absolute left-12 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                History
              </div>
            </button>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e3a5f] hover:bg-white/60 transition-all group relative">
              <span className="iconify text-xl" data-icon="solar:folder-bold"></span>
              <div className="absolute left-12 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Documents
              </div>
            </button>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e3a5f] hover:bg-white/60 transition-all group relative">
              <span className="iconify text-xl" data-icon="solar:settings-bold"></span>
              <div className="absolute left-12 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Settings
              </div>
            </button>
          </nav>
        </div>
      </aside>

      {/* Workspace Sidebar - White */}
      <aside className="w-[240px] flex-shrink-0 border-r border-slate-100 bg-white flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Workspace</span>
          <span className="iconify text-slate-300 text-lg cursor-pointer hover:text-slate-500 transition-colors" data-icon="solar:alt-arrow-down-linear"></span>
        </div>

        {/* New Document Button */}
        <div className="px-4 py-4">
          <button
            onClick={onHomeClick}
            className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-semibold shadow-lg shadow-[#1e3a5f]/20 hover:shadow-xl hover:shadow-[#1e3a5f]/30 active:scale-[0.98]"
          >
            <span className="iconify text-lg" data-icon="solar:add-circle-bold"></span>
            New Document
          </button>
        </div>

        {/* Recent Activity */}
        <div className="px-4 flex-grow overflow-y-auto">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Recent Activity</h4>
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white rounded-xl cursor-pointer transition-all duration-200 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${doc.statusColor === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${doc.statusColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {doc.status}
                  </span>
                </div>
                <h5 className="text-[13px] font-semibold text-slate-800 mb-1 leading-tight">{doc.title}</h5>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{doc.date}</span>
                  <span className="text-[10px] font-medium text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Continue
                    <span className="iconify" data-icon="solar:arrow-right-linear"></span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Stats</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="iconify text-slate-400" data-icon="solar:document-bold"></span>
                Documents
              </span>
              <span className="font-semibold text-slate-800">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="iconify text-emerald-500" data-icon="solar:check-circle-bold"></span>
                Complete
              </span>
              <span className="font-semibold text-emerald-600">{stats.complete}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="iconify text-amber-500" data-icon="solar:pen-bold"></span>
                Draft
              </span>
              <span className="font-semibold text-amber-600">{stats.draft}</span>
            </div>
          </div>
        </div>

        {/* Tip Card */}
        <div className="px-4 pb-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-2 mb-2">
              <span className="iconify text-[#3b82f6] text-lg" data-icon="solar:lightbulb-bolt-bold"></span>
              <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-wider">Tip</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Use chat mode to describe your finances naturally — AI will categorize everything for you.
            </p>
            <button className="text-[10px] font-semibold text-[#3b82f6] hover:text-[#2563eb] transition-colors flex items-center gap-1">
              Try Chat Mode
              <span className="iconify" data-icon="solar:arrow-right-linear"></span>
            </button>
          </div>
        </div>

        {/* User Profile - More Presence */}
        <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-base font-bold text-slate-600 shadow-inner">
                JD
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                <span className="iconify text-white text-[8px]" data-icon="solar:check-bold"></span>
              </div>
            </div>
            <div className="flex-grow">
              <h6 className="text-sm font-semibold text-slate-800 leading-tight">John Doe</h6>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                <span className="iconify" data-icon="solar:star-bold"></span>
                PRO MEMBER
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 px-3 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5">
              <span className="iconify" data-icon="solar:settings-linear"></span>
              Settings
            </button>
            <button
              onClick={onLogout}
              className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all"
            >
              <span className="iconify text-lg" data-icon="solar:logout-2-linear"></span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-hidden bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-8 bg-white border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dashboard</span>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <span className="iconify text-xl" data-icon="solar:magnifer-linear"></span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <span className="iconify text-xl" data-icon="solar:bell-linear"></span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <span className="iconify text-xl" data-icon="solar:question-circle-linear"></span>
            </button>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
