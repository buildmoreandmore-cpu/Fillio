
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onHomeClick: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onHomeClick, onLogout }) => {
  const recentDocs = [
    { id: '1', title: 'Personal Financial Statement', status: 'DRAFT', date: 'Edited 2 days ago', statusColor: 'text-amber-500' },
    { id: '2', title: 'Debt Schedule 2024', status: 'COMPLETE', date: 'Dec 15, 2024', statusColor: 'text-emerald-500' },
    { id: '3', title: 'Q4 Balance Sheet', status: 'COMPLETE', date: 'Nov 28, 2024', statusColor: 'text-emerald-500' },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Icon Rail */}
      <aside className="w-14 flex-shrink-0 border-r border-slate-100 flex flex-col items-center py-6 bg-white">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <button
            onClick={onHomeClick}
            className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center text-white hover:bg-[#162d4a] transition-colors"
          >
            <span className="iconify text-lg" data-icon="solar:document-text-bold"></span>
          </button>

          {/* Nav Icons */}
          <nav className="flex flex-col gap-4 mt-4">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-[#1e3a5f] hover:bg-slate-50 transition-colors">
              <span className="iconify text-xl" data-icon="solar:home-2-bold"></span>
            </button>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-[#1e3a5f] hover:bg-slate-50 transition-colors">
              <span className="iconify text-xl" data-icon="solar:clock-circle-bold"></span>
            </button>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-[#1e3a5f] hover:bg-slate-50 transition-colors">
              <span className="iconify text-xl" data-icon="solar:folder-bold"></span>
            </button>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-[#1e3a5f] hover:bg-slate-50 transition-colors">
              <span className="iconify text-xl" data-icon="solar:settings-bold"></span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Workspace Sidebar */}
      <aside className="w-[220px] flex-shrink-0 border-r border-slate-100 bg-white flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
          <span className="iconify text-slate-300 text-lg" data-icon="solar:alt-arrow-down-linear"></span>
        </div>

        {/* New Document Button */}
        <div className="px-4 mb-6">
          <button
            onClick={onHomeClick}
            className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <span className="iconify text-lg" data-icon="solar:add-circle-bold"></span>
            New Document
          </button>
        </div>

        {/* Recent Activity */}
        <div className="px-4 flex-grow overflow-y-auto">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'DRAFT' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${doc.statusColor}`}>{doc.status}</span>
                </div>
                <h5 className="text-[13px] font-semibold text-slate-800 mb-0.5 leading-tight">{doc.title}</h5>
                <span className="text-[11px] text-slate-400">{doc.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Stats</h4>
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Documents</p>
              <p className="text-lg font-bold text-slate-800">12</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Storage</p>
              <p className="text-lg font-bold text-[#3b82f6]">84%</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                JD
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-slate-800 leading-tight">John Doe</h6>
              <span className="text-[10px] font-bold text-[#3b82f6] flex items-center gap-1">
                <span className="iconify" data-icon="solar:verified-check-bold"></span>
                PRO MEMBER
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Settings
            </button>
            <button
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <span className="iconify text-xl" data-icon="solar:magnifer-linear"></span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
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
