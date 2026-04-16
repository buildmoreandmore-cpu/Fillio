/**
 * AdminShell — Top-level admin container with internal navigation.
 *
 * Manages navigation between:
 *  - Dashboard (overview + pending review queue)
 *  - Client List (all clients with filters)
 *  - Client Review (the primary work screen)
 *
 * Fetches data from Supabase on mount. Mutations update local state
 * optimistically and persist to the database.
 */

import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import AdminDashboard from './AdminDashboard';
import ClientList from './ClientList';
import ClientReview from './ClientReview';
import {
  fetchAdminData,
  updateFlag as persistFlag,
  updateScorecard as persistScorecard,
  updateClient as persistClient,
  confirmAndRelease,
} from '../../lib/adminData';
import { useAuth } from '../../lib/auth';
import type {
  AdminClientRecord,
  ScorecardRecord,
  FlagRecord,
  ScorecardStatus,
} from '../../lib/adminTypes';
import type { AdminResolution } from '../../lib/adminFlags';

const NAVY = '#0B2820';

type AdminView = 'dashboard' | 'clients' | 'review';

interface AdminShellProps {
  onExit: () => void;
}

const AdminShell: React.FC<AdminShellProps> = ({ onExit }) => {
  const { user } = useAuth();
  const [view, setView] = useState<AdminView>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<{
    clients: AdminClientRecord[];
    scorecards: ScorecardRecord[];
    flags: FlagRecord[];
  }>({ clients: [], scorecards: [], flags: [] });

  // Fetch data from Supabase on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchAdminData();
        setData(result);
      } catch {
        setError('Failed to load admin data. Check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const navigateToReview = (userId: string) => {
    setSelectedUserId(userId);
    setView('review');
  };

  const handleUpdateFlag = async (flagId: string, update: {
    adminResolution: AdminResolution;
    adminNote: string;
    overrideValue?: Record<string, unknown>;
  }) => {
    // Optimistic local update
    setData((prev) => ({
      ...prev,
      flags: prev.flags.map((f) =>
        f.id === flagId
          ? {
              ...f,
              adminResolution: update.adminResolution,
              adminNote: update.adminNote,
              overrideValue: update.overrideValue || null,
              resolved: true,
              resolvedAt: new Date().toISOString(),
            }
          : f
      ),
    }));
    // Persist to Supabase
    await persistFlag(flagId, update);
  };

  const handleUpdateScorecard = async (updates: Partial<ScorecardRecord>) => {
    if (!selectedUserId) return;
    const sc = data.scorecards.find((s) => s.userId === selectedUserId);
    if (!sc) return;

    setData((prev) => ({
      ...prev,
      scorecards: prev.scorecards.map((s) =>
        s.userId === selectedUserId ? { ...s, ...updates } : s
      ),
    }));
    await persistScorecard(sc.id, updates);
  };

  const handleUpdateClient = async (updates: Partial<AdminClientRecord>) => {
    if (!selectedUserId) return;
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) =>
        c.id === selectedUserId ? { ...c, ...updates } : c
      ),
    }));
    await persistClient(selectedUserId, updates);
  };

  const handleConfirmRelease = async () => {
    if (!selectedUserId) return;
    const sc = data.scorecards.find((s) => s.userId === selectedUserId);
    if (!sc) return;

    const reviewerEmail = user?.email || 'admin';

    setData((prev) => ({
      ...prev,
      scorecards: prev.scorecards.map((s) =>
        s.userId === selectedUserId
          ? {
              ...s,
              status: 'confirmed' as ScorecardStatus,
              reviewedBy: reviewerEmail,
              reviewedAt: new Date().toISOString(),
            }
          : s
      ),
    }));
    await confirmAndRelease(sc.id, reviewerEmail);
    setView('dashboard');
  };

  const selectedClient = data.clients.find((c) => c.id === selectedUserId);
  const selectedScorecard = data.scorecards.find((s) => s.userId === selectedUserId);
  const selectedFlags = data.flags.filter((f) => f.userId === selectedUserId);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Icon name="bank" size={20} style={{ color: NAVY }} />
              <span className="text-sm font-bold" style={{ color: NAVY }}>BankReadyDocs</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                Admin
              </span>
            </div>

            {/* Nav tabs */}
            <div className="flex gap-1 ml-6">
              {([
                { key: 'dashboard' as AdminView, label: 'Dashboard' },
                { key: 'clients' as AdminView, label: 'Clients' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    backgroundColor: view === tab.key || (view === 'review' && tab.key === 'clients')
                      ? `${NAVY}10` : 'transparent',
                    color: view === tab.key || (view === 'review' && tab.key === 'clients')
                      ? NAVY : '#94A3B8',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="text-xs text-slate-400 font-medium">{user.email}</span>
            )}
            <button
              onClick={onExit}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-500 font-medium">Loading admin data...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Content views */}
        {!isLoading && !error && (
          <>
            {view === 'dashboard' && (
              <AdminDashboard
                clients={data.clients}
                scorecards={data.scorecards}
                flags={data.flags}
                onReviewClient={navigateToReview}
              />
            )}

            {view === 'clients' && (
              <ClientList
                clients={data.clients}
                scorecards={data.scorecards}
                flags={data.flags}
                onReviewClient={navigateToReview}
              />
            )}

            {view === 'review' && selectedClient && selectedScorecard && (
              <ClientReview
                client={selectedClient}
                scorecard={selectedScorecard}
                flags={selectedFlags}
                onBack={() => setView('clients')}
                onUpdateFlag={handleUpdateFlag}
                onUpdateScorecard={handleUpdateScorecard}
                onUpdateClient={handleUpdateClient}
                onConfirmRelease={handleConfirmRelease}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminShell;
