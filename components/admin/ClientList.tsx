/**
 * ClientList — Full client list with filters (tier, status, search).
 */

import React, { useMemo, useState } from 'react';
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

interface ClientListProps {
  clients: AdminClientRecord[];
  scorecards: ScorecardRecord[];
  flags: FlagRecord[];
  onReviewClient: (userId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  scorecards,
  flags,
  onReviewClient,
}) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierKey | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ScorecardStatus | 'all'>('all');

  const getScorecard = (userId: string) => scorecards.find((s) => s.userId === userId);
  const getFlagCount = (scorecardId: string) =>
    flags.filter((f) => f.scorecardId === scorecardId && !f.resolved).length;

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (!c.fullName.toLowerCase().includes(q) && !c.businessName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) {
          return false;
        }
      }
      // Tier
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      // Status
      if (statusFilter !== 'all') {
        const sc = getScorecard(c.id);
        if (!sc || sc.status !== statusFilter) return false;
      }
      return true;
    });
  }, [clients, search, tierFilter, statusFilter, scorecards]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-grow max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            style={{ color: NAVY }}
          />
        </div>

        {/* Tier filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as TierKey | 'all')}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          style={{ color: NAVY }}
        >
          <option value="all">All Tiers</option>
          <option value="bank_ready">Bank Ready</option>
          <option value="loan_ready">Loan Ready</option>
          <option value="approved">Approved</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ScorecardStatus | 'all')}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          style={{ color: NAVY }}
        >
          <option value="all">All Statuses</option>
          <option value="provisional">Under Review</option>
          <option value="confirmed">Confirmed</option>
          <option value="needs_revision">Needs Info</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
        {filtered.length} client{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">No clients match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                  <th className="text-left py-3 px-5 font-bold">Name</th>
                  <th className="text-left py-3 px-4 font-bold">Business</th>
                  <th className="text-left py-3 px-4 font-bold">Tier</th>
                  <th className="text-left py-3 px-4 font-bold">Status</th>
                  <th className="text-right py-3 px-4 font-bold">DSCR</th>
                  <th className="text-center py-3 px-4 font-bold">Flags</th>
                  <th className="text-left py-3 px-4 font-bold">Submitted</th>
                  <th className="text-right py-3 px-5 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => {
                  const sc = getScorecard(client.id);
                  const flagCount = sc ? getFlagCount(sc.id) : 0;
                  return (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-semibold" style={{ color: NAVY }}>{client.fullName}</div>
                        <div className="text-[11px] text-slate-400">{client.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{client.businessName || '—'}</td>
                      <td className="py-3 px-4">
                        {client.tier ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${TIER_COLORS[client.tier]}15`, color: TIER_COLORS[client.tier] }}
                          >
                            {TIER_LABELS[client.tier]}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {sc ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${STATUS_COLORS[sc.status]}15`, color: STATUS_COLORS[sc.status] }}
                          >
                            {STATUS_LABELS[sc.status]}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No scorecard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums" style={{ color: NAVY }}>
                        {sc && sc.businessDscr > 0 ? `${sc.businessDscr.toFixed(2)}x` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {flagCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white bg-amber-500">
                            {flagCount}
                          </span>
                        ) : sc ? (
                          <Icon name="check-circle" size={16} style={{ color: EMERALD }} />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {sc ? new Date(sc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => onReviewClient(client.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                          style={{ backgroundColor: `${NAVY}10`, color: NAVY }}
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

export default ClientList;
