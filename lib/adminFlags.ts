/**
 * Admin Flag System — auto-generates flags when a client submits their scorecard.
 * Each flag represents an item requiring admin review before the report is released.
 */

// ─────────── Flag Types ───────────

export type FlagType =
  | 'one_time_income'
  | 'one_time_expense'
  | 'rent_addback'
  | 'entity_type_uncertain'
  | 'schedule_c_exclusion'
  | 'graded_request'
  | 'officer_compensation'
  | 'negative_cash_flow'
  | 'negative_personal_dcf'
  | 'dscr_below_threshold'
  | 'high_leverage'
  | 'declined_previously';

export type AdminResolution = 'confirmed' | 'override' | 'request_info';

export const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  one_time_income: 'One-Time Nonrecurring Income',
  one_time_expense: 'One-Time Nonrecurring Expense',
  rent_addback: 'Rent Addback (Owner-Occupied)',
  entity_type_uncertain: 'Entity Type Needs Confirmation',
  schedule_c_exclusion: 'Schedule C Exclusion',
  graded_request: 'Graded Request on LOC/Credit Card',
  officer_compensation: 'Officer Compensation Flagged',
  negative_cash_flow: 'Negative Business Cash Flow',
  negative_personal_dcf: 'Negative Personal Discretionary CF',
  dscr_below_threshold: 'DSCR Below 1.00x',
  high_leverage: 'High Leverage Ratio (>3.0)',
  declined_previously: 'Prior Loan Decline',
};

export const FLAG_TYPE_DESCRIPTIONS: Record<FlagType, string> = {
  one_time_income: 'Client reported one-time nonrecurring income. Verify it won\'t repeat and confirm the 70% discount treatment.',
  one_time_expense: 'Client reported one-time nonrecurring expense. Verify it won\'t repeat and confirm the 70% addback treatment.',
  rent_addback: 'Client indicated owner-occupied property. Verify ownership and confirm the 70% rent addback.',
  entity_type_uncertain: 'Client selected LLC without specifying tax treatment. Confirm whether S-Corp or C-Corp election.',
  schedule_c_exclusion: 'Client has Schedule C income. Confirm whether the Schedule C IS the borrowing entity (exclude) or a separate business (include).',
  graded_request: 'Client checked graded request on a line of credit or credit card. Verify the graded classification is correct.',
  officer_compensation: 'Compensation of Officers field has a value. Review for reasonableness.',
  negative_cash_flow: 'Business cash flow is negative. SBA is not an option until cash flow turns positive. Review the full picture.',
  negative_personal_dcf: 'Personal obligations exceed personal income after normalization. Understand how personal expenses are being covered.',
  dscr_below_threshold: 'DSCR is below 1.00x. The business cannot cover its debt obligations from cash flow alone.',
  high_leverage: 'Leverage ratio exceeds 3.0. The business is heavily leveraged relative to tangible net worth.',
  declined_previously: 'Client indicated they were previously declined for a loan. Tier 3 — requires decline diagnosis.',
};

// ─────────── Flag data shape ───────────

export interface AdminFlag {
  id: string;
  scorecardId: string;
  userId: string;
  flagType: FlagType;
  flagDescription: string;
  clientInput: Record<string, unknown> | null;
  adminResolution: AdminResolution | null;
  adminNote: string;
  overrideValue: Record<string, unknown> | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

// ─────────── Auto-flag generation ───────────

interface ScorecardSnapshot {
  // Business inputs
  oneTimeNonrecurringIncome: number;
  oneTimeNonrecurringExpenses: number;
  isOwnerOccupied: boolean;
  rentExpense: number;
  entityType: string;
  ownerWithdrawals: number;

  // Personal inputs
  scheduleCIncome: number;
  isBorrowingEntityScheduleC: boolean;

  // Debt inputs
  hasGradedRequest: boolean;

  // Derived
  businessCashFlow: number;
  personalDiscretionaryCF: number;
  dscr: number;
  leverageRatio: number;

  // Other
  declinedPreviously: boolean;
  officerCompensation: number;
}

export interface GeneratedFlag {
  flagType: FlagType;
  flagDescription: string;
  clientInput: Record<string, unknown>;
}

/**
 * Given a submitted scorecard snapshot, generate the list of flags
 * that require admin review before the report can be released.
 */
export function generateFlags(snapshot: ScorecardSnapshot): GeneratedFlag[] {
  const flags: GeneratedFlag[] = [];

  if (snapshot.oneTimeNonrecurringIncome > 0) {
    flags.push({
      flagType: 'one_time_income',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.one_time_income,
      clientInput: { amount: snapshot.oneTimeNonrecurringIncome },
    });
  }

  if (snapshot.oneTimeNonrecurringExpenses > 0) {
    flags.push({
      flagType: 'one_time_expense',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.one_time_expense,
      clientInput: { amount: snapshot.oneTimeNonrecurringExpenses },
    });
  }

  if (snapshot.isOwnerOccupied && snapshot.rentExpense > 0) {
    flags.push({
      flagType: 'rent_addback',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.rent_addback,
      clientInput: { rentExpense: snapshot.rentExpense, addbackAmount: snapshot.rentExpense * 0.70 },
    });
  }

  if (snapshot.entityType === 'llc_scorp' || snapshot.entityType === 'llc_ccorp') {
    flags.push({
      flagType: 'entity_type_uncertain',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.entity_type_uncertain,
      clientInput: { entityType: snapshot.entityType },
    });
  }

  if (snapshot.scheduleCIncome > 0) {
    flags.push({
      flagType: 'schedule_c_exclusion',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.schedule_c_exclusion,
      clientInput: {
        scheduleCIncome: snapshot.scheduleCIncome,
        isBorrowingEntity: snapshot.isBorrowingEntityScheduleC,
      },
    });
  }

  if (snapshot.hasGradedRequest) {
    flags.push({
      flagType: 'graded_request',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.graded_request,
      clientInput: {},
    });
  }

  if (snapshot.officerCompensation > 0) {
    flags.push({
      flagType: 'officer_compensation',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.officer_compensation,
      clientInput: { amount: snapshot.officerCompensation },
    });
  }

  if (snapshot.businessCashFlow < 0) {
    flags.push({
      flagType: 'negative_cash_flow',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.negative_cash_flow,
      clientInput: { businessCashFlow: snapshot.businessCashFlow },
    });
  }

  if (snapshot.personalDiscretionaryCF < 0) {
    flags.push({
      flagType: 'negative_personal_dcf',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.negative_personal_dcf,
      clientInput: { personalDiscretionaryCF: snapshot.personalDiscretionaryCF },
    });
  }

  if (snapshot.dscr < 1.0 && snapshot.dscr > 0) {
    flags.push({
      flagType: 'dscr_below_threshold',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.dscr_below_threshold,
      clientInput: { dscr: snapshot.dscr },
    });
  }

  if (snapshot.leverageRatio > 3.0) {
    flags.push({
      flagType: 'high_leverage',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.high_leverage,
      clientInput: { leverageRatio: snapshot.leverageRatio },
    });
  }

  if (snapshot.declinedPreviously) {
    flags.push({
      flagType: 'declined_previously',
      flagDescription: FLAG_TYPE_DESCRIPTIONS.declined_previously,
      clientInput: {},
    });
  }

  return flags;
}
