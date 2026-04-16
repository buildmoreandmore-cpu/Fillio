/**
 * AdminDashboard — Overview page showing summary stats + pending review queue.
 *
 * This is the landing page when admin navigates to the admin section.
 * Shows: total clients, pending reviews, confirmed this week, and
 * a table of provisional scorecards sorted by most recent submission.
 */

import React from 'react';
import { Icon } from '../Icon';
import type {
  AdminClientRecord,
  ScorecardRecord,
  FlagRecord,
  TierKey,
  ScorecardStatus,
} from '../../lib/adminTypes';
import { TIER_LABELS, TIER_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../lib/adminTypes';

const NAVY = '#0B2820';
const EMERALD = '#1D9E75';

// ─────────── Stat Card ───────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}> = ({ label, value, sublabel, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
    <div className="text-3xl font-bold tracking-tight" style={{ color: color || NAVY }}>{value}</div>
    {sublabel && <div className="text-xs text-slate-400 mt-1">{sublabel}</div>}
  </div>
);

// ─────────── Tier Badge ───────────

const TierBadge: React.FC<{ tier: TierKey | null }> = ({ tier }) => {
  if (!tier) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${TIER_COLORS[tier]}15`, color: TIER_COLORS[tier] }}
    >
      {TIER_LABELS[tier]}
    </span>
  );
};

// ─────────── Status Badge ───────────

const StatusBadge: React.FC<{ status: ScorecardStatus }> = ({ status }) => (
  <span
    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
    style={{ backgroundColor: `${STATUS_COLORS[status]}15`, color: STATUS_COLORS[status] }}
  >
    {STATUS_LABELS[status]}
  </span>
);

// ─────────── Props ───────────

interface AdminDashboardProps {
  clients: AdminClientRecord[];
  scorecards: ScorecardRecord[];
  flags: FlagRecord[];
  onReviewClient: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  clients,
  scorecards,
  flags,
  onReviewClient,
}) => {
  const totalClients = clients.length;
  const pendingReview = scorecards.filter((s) => s.status === 'provisional').length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const confirmedThisWeek = scorecards.filter(
    (s) => s.status === 'confirmed' && s.reviewedAt && new Date(s.reviewedAt) >= weekAgo
  ).length;

  // Pending scorecards sorted by most recent
  const pendingScorecards = scorecards
    .filter((s) => s.status === 'provisional')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getClient = (userId: string) => clients.find((c) => c.id === userId);
  const getFlagCount = (scorecardId: string) =>
    flags.filter((f) => f.scorecardId === scorecardId && !f.resolved).length;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Clients" value={totalClients} />
        <StatCard label="Pending Review" value={pendingReview} color={pendingReview > 0 ? '#BA7517' : EMERALD} />
        <StatCard label="Confirmed This Week" value={confirmedThisWeek} color={EMERALD} />
      </div>

      {/* Pending review table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold" style={{ color: NAVY }}>Pending Review</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Scorecards awaiting your review before report release.
          </p>
        </div>

        {pendingScorecards.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="check-circle" size={32} style={{ color: '#CBD5E1' }} />
            <p className="text-sm text-slate-400 mt-3">No pending reviews. You're all caught up.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                  <th className="text-left py-3 px-5 font-bold">Client</th>
                  <th className="text-left py-3 px-4 font-bold">Business</th>
                  <th className="text-left py-3 px-4 font-bold">Tier</th>
                  <th className="text-left py-3 px-4 font-bold">Submitted</th>
                  <th className="text-center py-3 px-4 font-bold">Flags</th>
                  <th className="text-right py-3 px-4 font-bold">DSCR</th>
                  <th className="text-right py-3 px-5 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {pendingScorecards.map((sc) => {
                  const client = getClient(sc.userId);
                  const flagCount = getFlagCount(sc.id);
                  return (
                    <tr key={sc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 font-semibold" style={{ color: NAVY }}>
                        {client?.fullName || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {client?.businessName || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <TierBadge tier={client?.tier || null} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(sc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {flagCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white bg-amber-500">
                            {flagCount}
                          </span>
                        ) : (
                          <Icon name="check-circle" size={16} style={{ color: EMERALD }} />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums" style={{ color: NAVY }}>
                        {sc.businessDscr > 0 ? `${sc.businessDscr.toFixed(2)}x` : '—'}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => onReviewClient(sc.userId)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: NAVY }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
