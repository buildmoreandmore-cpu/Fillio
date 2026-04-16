/**
 * Document Gate — controls which features are available based on uploaded documents.
 *
 * Global Cash Flow requires BOTH:
 *   1. Personal Financial Statement (PFS) — guarantor strength, personal assets/liabilities
 *   2. Personal Tax Return (1040) — actual income, personal DSCR
 *
 * Missing either document blocks the True Readiness Score from generating.
 */

// ─────────── Required Document Types ───────────

export type RequiredDocument =
  | 'business_tax_return'
  | 'personal_tax_return_1040'
  | 'personal_financial_statement'
  | 'prior_year_business_tax_return'
  | 'prior_year_personal_tax_return';

export type ClientTier = 'bank_ready' | 'loan_ready' | 'approved';

// ─────────── Tier Document Requirements ───────────

export interface TierDocRequirement {
  document: RequiredDocument;
  label: string;
  required: boolean;
  reason: string;
}

export const TIER_DOCUMENT_REQUIREMENTS: Record<ClientTier, TierDocRequirement[]> = {
  bank_ready: [
    {
      document: 'business_tax_return',
      label: 'Business Tax Return',
      required: true,
      reason: 'Required to calculate EBIDA and business cash flow',
    },
    {
      document: 'personal_tax_return_1040',
      label: 'Personal Tax Return (1040)',
      required: true,
      reason: 'Required to calculate personal income and debt service coverage',
    },
    {
      document: 'personal_financial_statement',
      label: 'Personal Financial Statement',
      required: false,
      reason: 'Needed to assess personal asset position and guarantor strength — global cash flow will be incomplete without it',
    },
  ],
  loan_ready: [
    {
      document: 'business_tax_return',
      label: 'Business Tax Return',
      required: true,
      reason: 'Required to calculate EBIDA and business cash flow',
    },
    {
      document: 'personal_tax_return_1040',
      label: 'Personal Tax Return (1040)',
      required: true,
      reason: 'Required to calculate personal income and debt service coverage',
    },
    {
      document: 'personal_financial_statement',
      label: 'Personal Financial Statement',
      required: true,
      reason: 'Required for global cash flow and lender-side review',
    },
  ],
  approved: [
    {
      document: 'business_tax_return',
      label: 'Business Tax Return',
      required: true,
      reason: 'Required to calculate EBIDA and business cash flow',
    },
    {
      document: 'personal_tax_return_1040',
      label: 'Personal Tax Return (1040)',
      required: true,
      reason: 'Required to calculate personal income and debt service coverage',
    },
    {
      document: 'personal_financial_statement',
      label: 'Personal Financial Statement',
      required: true,
      reason: 'Required for global cash flow and lender-side review',
    },
    {
      document: 'prior_year_business_tax_return',
      label: 'Prior Year Business Tax Return',
      required: true,
      reason: 'Required for two-column year-over-year comparison — banks always look at trend',
    },
    {
      document: 'prior_year_personal_tax_return',
      label: 'Prior Year Personal Tax Return',
      required: false,
      reason: 'Strongly recommended for comprehensive personal income trend analysis',
    },
  ],
};

// ─────────── Document Gate Check ───────────

export interface MissingDocument {
  document: RequiredDocument;
  label: string;
  reason: string;
}

/**
 * Check if global cash flow can be calculated.
 * Requires BOTH PFS and 1040.
 *
 * Only PFS, no 1040: Can see what they own/owe but cannot calculate personal cash flow.
 * Only 1040, no PFS: Can calculate income but cannot assess guarantor strength.
 * Neither: No personal picture at all.
 */
export function checkGlobalCashFlowEligibility(
  uploadedDocuments: RequiredDocument[]
): { eligible: boolean; missing: MissingDocument[] } {
  const missing: MissingDocument[] = [];

  if (!uploadedDocuments.includes('personal_financial_statement')) {
    missing.push({
      document: 'personal_financial_statement',
      label: 'Personal Financial Statement',
      reason: 'Required to assess your personal asset position and guarantor strength',
    });
  }

  if (!uploadedDocuments.includes('personal_tax_return_1040')) {
    missing.push({
      document: 'personal_tax_return_1040',
      label: 'Personal Tax Return (1040)',
      reason: 'Required to calculate your personal income and debt service coverage',
    });
  }

  return {
    eligible: missing.length === 0,
    missing,
  };
}

/**
 * Check all required documents for a given tier.
 * Returns list of missing required documents.
 */
export function checkTierDocuments(
  tier: ClientTier,
  uploadedDocuments: RequiredDocument[]
): { complete: boolean; missing: MissingDocument[]; optional: MissingDocument[] } {
  const requirements = TIER_DOCUMENT_REQUIREMENTS[tier];
  const missing: MissingDocument[] = [];
  const optional: MissingDocument[] = [];

  for (const req of requirements) {
    if (!uploadedDocuments.includes(req.document)) {
      const item: MissingDocument = {
        document: req.document,
        label: req.label,
        reason: req.reason,
      };
      if (req.required) {
        missing.push(item);
      } else {
        optional.push(item);
      }
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    optional,
  };
}

/**
 * Can the True Readiness Score be generated?
 * Requires all required tier documents AND global cash flow eligibility.
 */
export function canGenerateReadinessScore(
  tier: ClientTier,
  uploadedDocuments: RequiredDocument[]
): { ready: boolean; blockers: string[] } {
  const tierCheck = checkTierDocuments(tier, uploadedDocuments);
  const globalCheck = checkGlobalCashFlowEligibility(uploadedDocuments);
  const blockers: string[] = [];

  for (const doc of tierCheck.missing) {
    blockers.push(`Missing required document: ${doc.label} — ${doc.reason}`);
  }

  // Global CF check may overlap with tier check, but we want specific messaging
  if (!globalCheck.eligible) {
    blockers.push(
      'Cannot calculate global cash flow until both Personal Financial Statement and Personal Tax Return (1040) are provided'
    );
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}
