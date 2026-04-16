/**
 * Admin data layer — Supabase queries for the admin dashboard.
 *
 * Uses the service key (server-side) or anon key with admin RLS bypass
 * for fetching all clients, scorecards, and flags.
 */

import { supabase } from './supabase';
import type {
  AdminClientRecord,
  ScorecardRecord,
  FlagRecord,
  TierKey,
  ScorecardStatus,
} from './adminTypes';
import type { FlagType, AdminResolution } from './adminFlags';

// The Supabase client is typed against database.types.ts which doesn't include
// the admin tables yet. We cast queries to `any` until types are regenerated.
const db = supabase as any;

// ─────────── Map Supabase rows to app types ───────────

function mapClient(row: Record<string, unknown>): AdminClientRecord {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: (row.full_name as string) || '',
    businessName: (row.business_name as string) || '',
    tier: (row.tier as TierKey) || null,
    isPriority: (row.is_priority as boolean) || false,
    adminNotes: (row.admin_notes as string) || '',
    lenderRecommendations: Array.isArray(row.lender_recommendations)
      ? row.lender_recommendations
      : [],
    actionPlan: (row.action_plan as string) || '',
    createdAt: row.created_at as string,
  };
}

function mapScorecard(row: Record<string, unknown>): ScorecardRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    status: (row.status as ScorecardStatus) || 'provisional',
    businessCashFlow: (row.business_cash_flow as Record<string, unknown>) || {},
    businessDebtService: (row.business_debt_service as Record<string, unknown>) || {},
    personalCashFlow: (row.personal_cash_flow as Record<string, unknown>) || {},
    personalDebtService: (row.personal_debt_service as Record<string, unknown>) || {},
    businessDscr: Number(row.business_dscr) || 0,
    personalDiscretionaryCf: Number(row.personal_discretionary_cf) || 0,
    capacityScore: Number(row.capacity_score) || 0,
    characterScore: Number(row.character_score) || 0,
    capitalScore: Number(row.capital_score) || 0,
    collateralScore: Number(row.collateral_score) || 0,
    conditionsScore: Number(row.conditions_score) || 0,
    overallScore: Number(row.overall_score) || 0,
    adminNotes: (row.admin_notes as string) || '',
    reviewedBy: (row.reviewed_by as string) || null,
    reviewedAt: (row.reviewed_at as string) || null,
    confirmedOverrides: (row.confirmed_overrides as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapFlag(row: Record<string, unknown>): FlagRecord {
  return {
    id: row.id as string,
    scorecardId: row.scorecard_id as string,
    userId: row.user_id as string,
    flagType: row.flag_type as FlagType,
    flagDescription: (row.flag_description as string) || '',
    clientInput: (row.client_input as Record<string, unknown>) || null,
    adminResolution: (row.admin_resolution as AdminResolution) || null,
    adminNote: (row.admin_note as string) || '',
    overrideValue: (row.override_value as Record<string, unknown>) || null,
    resolved: (row.resolved as boolean) || false,
    resolvedAt: (row.resolved_at as string) || null,
    createdAt: row.created_at as string,
  };
}

// ─────────── Fetch all admin data ───────────

export async function fetchAdminData(): Promise<{
  clients: AdminClientRecord[];
  scorecards: ScorecardRecord[];
  flags: FlagRecord[];
}> {
  const [clientsRes, scorecardsRes, flagsRes] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: false }),
    db.from('scorecard_results').select('*').order('created_at', { ascending: false }),
    db.from('admin_flags').select('*').order('created_at', { ascending: false }),
  ]);

  return {
    clients: (clientsRes.data || []).map(mapClient),
    scorecards: (scorecardsRes.data || []).map(mapScorecard),
    flags: (flagsRes.data || []).map(mapFlag),
  };
}

// ─────────── Mutations ───────────

export async function updateFlag(
  flagId: string,
  update: {
    adminResolution: AdminResolution;
    adminNote: string;
    overrideValue?: Record<string, unknown>;
  }
) {
  return db
    .from('admin_flags')
    .update({
      admin_resolution: update.adminResolution,
      admin_note: update.adminNote,
      override_value: update.overrideValue || null,
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', flagId);
}

export async function updateScorecard(
  scorecardId: string,
  updates: Partial<ScorecardRecord>
) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;
  if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;
  if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;
  if (updates.confirmedOverrides !== undefined) dbUpdates.confirmed_overrides = updates.confirmedOverrides;
  if (updates.capacityScore !== undefined) dbUpdates.capacity_score = updates.capacityScore;
  if (updates.characterScore !== undefined) dbUpdates.character_score = updates.characterScore;
  if (updates.capitalScore !== undefined) dbUpdates.capital_score = updates.capitalScore;
  if (updates.collateralScore !== undefined) dbUpdates.collateral_score = updates.collateralScore;
  if (updates.conditionsScore !== undefined) dbUpdates.conditions_score = updates.conditionsScore;
  if (updates.overallScore !== undefined) dbUpdates.overall_score = updates.overallScore;

  return db
    .from('scorecard_results')
    .update(dbUpdates)
    .eq('id', scorecardId);
}

export async function updateClient(
  clientId: string,
  updates: Partial<AdminClientRecord>
) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
  if (updates.isPriority !== undefined) dbUpdates.is_priority = updates.isPriority;
  if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;
  if (updates.lenderRecommendations !== undefined) dbUpdates.lender_recommendations = updates.lenderRecommendations;
  if (updates.actionPlan !== undefined) dbUpdates.action_plan = updates.actionPlan;

  return db
    .from('profiles')
    .update(dbUpdates)
    .eq('id', clientId);
}

export async function confirmAndRelease(
  scorecardId: string,
  reviewerEmail: string
) {
  return db
    .from('scorecard_results')
    .update({
      status: 'confirmed',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', scorecardId);
}
