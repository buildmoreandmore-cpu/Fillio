/**
 * Admin data layer — Supabase queries for the admin dashboard.
 *
 * Queries scorecard_submissions (the pipeline table) and admin_flags.
 * Admin RLS policies allow admin users to read/update all rows.
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

// The Supabase client is typed against database.types.ts which may not
// fully cover all admin columns. We cast queries to `any` for flexibility.
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
    status: (row.status as ScorecardStatus) || 'in_progress',

    // Business identity
    businessName: (row.business_name as string) || '',
    entityType: (row.entity_type as string) || '',
    industry: (row.industry as string) || '',
    loanAmountRequested: row.loan_amount_requested != null ? Number(row.loan_amount_requested) : null,
    loanPurpose: (row.loan_purpose as string) || '',

    // Business cash flow inputs
    taxYear: row.tax_year != null ? Number(row.tax_year) : null,
    netProfitCy: Number(row.net_profit_cy) || 0,
    interestExpenseCy: Number(row.interest_expense_cy) || 0,
    depreciationAmortizationCy: Number(row.depreciation_amortization_cy) || 0,
    amortizationCy: Number(row.amortization_cy) || 0,
    rentExpenseCy: Number(row.rent_expense_cy) || 0,
    propertySituation: (row.property_situation as string) || null,
    rentAppearsOnFinancials: (row.rent_appears_on_financials as boolean) || false,
    debtObligations: Array.isArray(row.debt_obligations) ? row.debt_obligations : [],

    // Guarantor
    filesJointly: (row.files_jointly as boolean) || false,
    spouseHasVestedInterest: (row.spouse_has_vested_interest as boolean) || false,

    // Credit
    experianScore: row.experian_score != null ? Number(row.experian_score) : null,
    transunionScore: row.transunion_score != null ? Number(row.transunion_score) : null,

    // Calculated results
    ebidaCy: row.ebida_cy != null ? Number(row.ebida_cy) : null,
    taxAdjustmentCy: Number(row.tax_adjustment_cy) || 0,
    rentAddbackCy: Number(row.rent_addback_cy) || 0,
    businessCashFlowCy: row.business_cash_flow_cy != null ? Number(row.business_cash_flow_cy) : null,
    businessCashFlowPy: row.business_cash_flow_py != null ? Number(row.business_cash_flow_py) : null,
    businessDebtService: row.business_debt_service != null ? Number(row.business_debt_service) : null,
    dscrCy: row.dscr_cy != null ? Number(row.dscr_cy) : null,
    dscrPy: row.dscr_py != null ? Number(row.dscr_py) : null,
    leverageRatio: row.leverage_ratio != null ? Number(row.leverage_ratio) : null,
    personalCashFlowAvailable: row.personal_cash_flow_available != null ? Number(row.personal_cash_flow_available) : null,
    personalDebtService: row.personal_debt_service != null ? Number(row.personal_debt_service) : null,
    personalDiscretionaryCf: row.personal_discretionary_cf != null ? Number(row.personal_discretionary_cf) : null,

    // Scores
    capacityScore: Number(row.capacity_score) || 0,
    characterScore: Number(row.character_score) || 0,
    capitalScore: Number(row.capital_score) || 0,
    collateralScore: Number(row.collateral_score) || 0,
    conditionsScore: Number(row.conditions_score) || 0,
    overallScore: Number(row.overall_score) || 0,

    // Admin review
    adminNotes: (row.admin_notes as string) || '',
    reviewedBy: (row.reviewed_by as string) || null,
    reviewedAt: (row.reviewed_at as string) || null,
    confirmedOverrides: (row.confirmed_overrides as Record<string, unknown>) || {},

    // Timestamps
    submittedAt: (row.submitted_at as string) || null,
    createdAt: row.started_at as string || row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapFlag(row: Record<string, unknown>): FlagRecord {
  return {
    id: row.id as string,
    scorecardId: (row.submission_id as string) || (row.scorecard_id as string) || '',
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
    db.from('scorecard_submissions')
      .select('*')
      .in('status', ['submitted', 'under_review', 'needs_info', 'confirmed', 'report_released'])
      .order('submitted_at', { ascending: false }),
    db.from('admin_flags').select('*').order('created_at', { ascending: false }),
  ]);

  return {
    clients: (clientsRes.data || []).map(mapClient),
    scorecards: (scorecardsRes.data || []).map(mapScorecard),
    flags: (flagsRes.data || []).map(mapFlag),
  };
}

// ─────────── Fetch documents for a submission ───���───────

export async function fetchSubmissionDocuments(submissionId: string) {
  const { data } = await db
    .from('document_uploads')
    .select('*')
    .eq('submission_id', submissionId)
    .order('uploaded_at', { ascending: false });
  return data || [];
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
    .from('scorecard_submissions')
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
    .from('scorecard_submissions')
    .update({
      status: 'confirmed',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', scorecardId);
}

// ─────────── Client-side: load own submission ─���─────────

export async function fetchMySubmission(userId: string): Promise<ScorecardRecord | null> {
  const { data } = await db
    .from('scorecard_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return data ? mapScorecard(data) : null;
}
