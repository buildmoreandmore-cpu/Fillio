/**
 * TypeScript types for the Admin Dashboard data layer.
 */

import type { FlagType, AdminResolution } from './adminFlags';

// ─────────── Scorecard status ───────────

export type ScorecardStatus = 'in_progress' | 'submitted' | 'under_review' | 'needs_info' | 'confirmed' | 'report_released';
export type TierKey = 'bank_ready' | 'loan_ready' | 'approved';

export const TIER_LABELS: Record<TierKey, string> = {
  bank_ready: 'Bank Ready',
  loan_ready: 'Loan Ready',
  approved: 'Approved',
};

export const TIER_COLORS: Record<TierKey, string> = {
  bank_ready: '#0B2820',
  loan_ready: '#1D9E75',
  approved: '#BA7517',
};

export const STATUS_LABELS: Record<ScorecardStatus, string> = {
  in_progress: 'In Progress',
  submitted: 'Submitted',
  under_review: 'Under Review',
  confirmed: 'Confirmed',
  needs_info: 'Needs Info',
  report_released: 'Report Released',
};

export const STATUS_COLORS: Record<ScorecardStatus, string> = {
  in_progress: '#94A3B8',
  submitted: '#BA7517',
  under_review: '#BA7517',
  confirmed: '#1D9E75',
  needs_info: '#DC4444',
  report_released: '#1D9E75',
};

// ─────────── Client record (as seen by admin) ───────────

export interface AdminClientRecord {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  tier: TierKey | null;
  isPriority: boolean;
  adminNotes: string;
  lenderRecommendations: LenderRecommendation[];
  actionPlan: string;
  createdAt: string;
}

export interface LenderRecommendation {
  loanAmount: number;
  recommendedPath: string;
  specificLenders: string;
  reasoning: string;
}

// ─────────── Scorecard record ───────────

export interface ScorecardRecord {
  id: string;
  userId: string;
  status: ScorecardStatus;

  // Business identity
  businessName: string;
  entityType: string;
  industry: string;
  loanAmountRequested: number | null;
  loanPurpose: string;

  // Business cash flow inputs
  taxYear: number | null;
  netProfitCy: number;
  interestExpenseCy: number;
  depreciationAmortizationCy: number;
  amortizationCy: number;
  rentExpenseCy: number;
  propertySituation: string | null;
  rentAppearsOnFinancials: boolean;
  debtObligations: unknown[];

  // Guarantor
  filesJointly: boolean;
  spouseHasVestedInterest: boolean;

  // Credit
  experianScore: number | null;
  transunionScore: number | null;

  // Calculated results
  ebidaCy: number | null;
  taxAdjustmentCy: number;
  rentAddbackCy: number;
  businessCashFlowCy: number | null;
  businessCashFlowPy: number | null;
  businessDebtService: number | null;
  dscrCy: number | null;
  dscrPy: number | null;
  leverageRatio: number | null;
  personalCashFlowAvailable: number | null;
  personalDebtService: number | null;
  personalDiscretionaryCf: number | null;

  // Scores
  capacityScore: number;
  characterScore: number;
  capitalScore: number;
  collateralScore: number;
  conditionsScore: number;
  overallScore: number;

  // Admin review
  adminNotes: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  confirmedOverrides: Record<string, unknown>;

  // Timestamps
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────── Flag record ───────────

export interface FlagRecord {
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

// ─────────── Admin overview stats ───────────

export interface AdminOverviewStats {
  totalClients: number;
  pendingReview: number;
  confirmedThisWeek: number;
}

// ─────────── Five C's score entry ───────────

export interface FiveCScore {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  overrideScore: number | null;
  overrideNote: string;
}

export const FIVE_CS: { key: string; label: string; maxScore: number }[] = [
  { key: 'character', label: 'Character', maxScore: 100 },
  { key: 'capacity', label: 'Capacity', maxScore: 100 },
  { key: 'capital', label: 'Capital', maxScore: 100 },
  { key: 'collateral', label: 'Collateral', maxScore: 100 },
  { key: 'conditions', label: 'Conditions', maxScore: 100 },
];

// ─────────── Lender path options ───────────

export const LENDER_PATHS = [
  'Conventional bank loan',
  'SBA 7(a)',
  'SBA 504',
  'SBA Microloan',
  'CDFI / Community lender',
  'Equipment financing',
  'Credit builder path first',
] as const;

export type LenderPath = (typeof LENDER_PATHS)[number];
