/**
 * Scorecard Persistence — save and submit scorecard data to Supabase.
 *
 * Two modes:
 *  1. Auto-save (debounced): saves draft as status='in_progress' on every input change
 *  2. Submit: final save with calculated results, status='submitted', triggers flag generation
 */

import { supabase } from './supabase';
import { generateFlags, type GeneratedFlag } from './adminFlags';
import type { DebtObligation } from './debtService';
import type { PropertySituation } from './dscr';
import type { ScorecardEntityType } from './ebida';

// ─────────── Types ───────────

export interface ScorecardFormData {
  // Business identity
  businessName?: string;
  entityType: ScorecardEntityType;
  taxYear: number;

  // EBIDA inputs
  netIncome: number;
  interestExpense: number;
  depreciation: number;
  amortization: number;

  // Property / rent
  propertySituation: PropertySituation | null;
  rentOnFinancials: boolean | null;
  annualRent: number;

  // Debts
  debts: DebtObligation[];

  // Ownership
  ownerTakesSalary: boolean | null;
}

export interface ScorecardResults {
  ebida: number;
  taxAdjustment: number;
  rentAddback: number;
  adjustedCashFlow: number;
  totalDebtService: number;
  dscr: number;
  dscrScore: number;
  sbaEligible: boolean;
}

// ─────────── Debounce helper ───────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debounce(fn: () => void, ms: number) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(fn, ms);
}

// ─────────── Persistence functions ───────────

let currentSubmissionId: string | null = null;

export function getSubmissionId(): string | null {
  return currentSubmissionId;
}

export function setSubmissionId(id: string | null) {
  currentSubmissionId = id;
}

/**
 * Auto-save scorecard draft to Supabase (debounced 2s).
 * Creates a new row on first save, upserts after.
 */
export function autoSave(userId: string, formData: ScorecardFormData) {
  debounce(async () => {
    const payload: Record<string, unknown> = {
      user_id: userId,
      business_name: formData.businessName || null,
      entity_type: formData.entityType,
      tax_year: formData.taxYear,
      net_profit_cy: formData.netIncome,
      interest_expense_cy: formData.interestExpense,
      depreciation_amortization_cy: formData.depreciation,
      amortization_cy: formData.amortization,
      property_situation: formData.propertySituation,
      rent_appears_on_financials: formData.rentOnFinancials ?? false,
      rent_expense_cy: formData.annualRent,
      debt_obligations: formData.debts,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    };

    if (currentSubmissionId) {
      // Update existing draft
      await (supabase as any)
        .from('scorecard_submissions')
        .update(payload)
        .eq('id', currentSubmissionId);
    } else {
      // Insert new draft
      const { data, error } = await (supabase as any)
        .from('scorecard_submissions')
        .insert(payload)
        .select('id')
        .single();

      if (!error && data) {
        currentSubmissionId = data.id;
      }
    }
  }, 2000);
}

/**
 * Submit scorecard for admin review.
 * Saves final data + calculated results, generates flags, updates status.
 */
export async function submitScorecard(
  userId: string,
  formData: ScorecardFormData,
  results: ScorecardResults
): Promise<{ success: boolean; submissionId: string | null; error: string | null }> {
  // Cancel any pending auto-save
  if (saveTimer) clearTimeout(saveTimer);

  const payload: Record<string, unknown> = {
    user_id: userId,
    business_name: formData.businessName || null,
    entity_type: formData.entityType,
    tax_year: formData.taxYear,
    net_profit_cy: formData.netIncome,
    interest_expense_cy: formData.interestExpense,
    depreciation_amortization_cy: formData.depreciation,
    amortization_cy: formData.amortization,
    property_situation: formData.propertySituation,
    rent_appears_on_financials: formData.rentOnFinancials ?? false,
    rent_expense_cy: formData.annualRent,
    debt_obligations: formData.debts,

    // Calculated results
    ebida_cy: results.ebida,
    tax_adjustment_cy: results.taxAdjustment,
    rent_addback_cy: results.rentAddback,
    business_cash_flow_cy: results.adjustedCashFlow,
    business_debt_service: results.totalDebtService,
    dscr_cy: results.dscr,
    capacity_score: results.dscrScore,

    // Status
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let submissionId = currentSubmissionId;

  if (submissionId) {
    // Update existing draft → submitted
    const { error } = await (supabase as any)
      .from('scorecard_submissions')
      .update(payload)
      .eq('id', submissionId);

    if (error) {
      return { success: false, submissionId: null, error: error.message };
    }
  } else {
    // Insert new submission
    const { data, error } = await (supabase as any)
      .from('scorecard_submissions')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      return { success: false, submissionId: null, error: error.message };
    }
    submissionId = data.id;
    currentSubmissionId = submissionId;
  }

  // Generate and insert admin flags
  const hasGradedDebt = formData.debts.some(d => d.isGraded);
  const flagSnapshot = {
    oneTimeNonrecurringIncome: 0,
    oneTimeNonrecurringExpenses: 0,
    isOwnerOccupied: formData.propertySituation === 'owns_same_entity',
    rentExpense: formData.annualRent,
    entityType: formData.entityType,
    ownerWithdrawals: 0,
    scheduleCIncome: 0,
    isBorrowingEntityScheduleC: false,
    hasGradedRequest: hasGradedDebt,
    businessCashFlow: results.adjustedCashFlow,
    personalDiscretionaryCF: 0,
    dscr: results.dscr,
    leverageRatio: 0,
    declinedPreviously: false,
    officerCompensation: 0,
    // Warren Moon personal CF flags — populated when personal CF step exists
    taxableInterest: 0,
    ordinaryDividends: 0,
    iraDistribution: 0,
    guarantorAge: null,
    hasScheduleEPartII: false,
    scheduleEPartIIAmount: 0,
  };

  const generatedFlags = generateFlags(flagSnapshot);

  if (generatedFlags.length > 0) {
    const flagRows = generatedFlags.map((flag: GeneratedFlag) => ({
      submission_id: submissionId,
      user_id: userId,
      flag_type: flag.flagType,
      flag_description: flag.flagDescription,
      client_input: flag.clientInput,
    }));

    await (supabase as any).from('admin_flags').insert(flagRows);
  }

  return { success: true, submissionId, error: null };
}

/**
 * Load existing draft for the current user.
 * Returns the most recent in_progress submission if one exists.
 */
export async function loadDraft(
  userId: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const { data, error } = await (supabase as any)
    .from('scorecard_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  currentSubmissionId = data.id;
  return { id: data.id, data };
}

/**
 * Load the user's most recent submission (any status) for dashboard display.
 */
export async function loadLatestSubmission(
  userId: string
): Promise<{ id: string; status: string; submittedAt: string | null; overallScore: number } | null> {
  const { data, error } = await (supabase as any)
    .from('scorecard_submissions')
    .select('id, status, submitted_at, overall_score')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    status: data.status,
    submittedAt: data.submitted_at,
    overallScore: Number(data.overall_score) || 0,
  };
}
