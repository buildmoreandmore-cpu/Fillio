/**
 * Personal Tax Return (Form 1040) -- Line Number Mapping
 *
 * Based on Warren Moon (CCB HR) Credit Essentials Training rules.
 * These rules are authoritative and supersede any other personal CF mapping.
 *
 * CORRECT 1040 LINES USED:
 *   1a  Wages (W-2, guarantor only)
 *   2b  Taxable interest (flag if large)
 *   3b  Ordinary dividends (flag if large)
 *   4b  IRA distributions (RMD ONLY -- not one-time withdrawals)
 *   5   Pension/annuity (ongoing/recurring only)
 *   6b  Social Security (OK as stated)
 *
 * VOLUNTARY DISCLOSURE ONLY:
 *   Alimony -- client must offer it, we NEVER prompt for it
 *
 * BUSINESS SIDE (not personal cash flow):
 *   Schedule C (Line 31) -- EBIDA minus annual debt service
 *   Schedule E Part I -- rental income, treated as business
 *   Schedule F -- farm income, treated as business
 *
 * HARD EXCLUDE:
 *   Schedule E Part II (pass-through K-1) -- ALREADY IN BUSINESS EBIDA
 *   Including it here = double counting. Never include.
 *
 * CRITICAL RULE -- Joint Filer Guarantor Isolation:
 * If the guarantor files jointly with a spouse, only use the guarantor's
 * individual income -- NOT the combined household total.
 *
 * These fields feed the Personal Cash Flow calculation:
 *   Total Guarantor Income / 2 = Personal Cash Flow Available
 */

// ─────────── Types ───────────

export interface Personal1040FieldMeta {
  key: string;
  label: string;
  lineRef: string;
  hint: string;
  jointFilerNote?: string;
  grossUp?: number;
  voluntaryOnly?: boolean;    // if true, never prompt -- client must disclose
  flagIfAbove?: number;       // auto-flag for admin if value exceeds this
  flagNote?: string;          // what to verify when flagged
}

export type FilingStatus = 'joint' | 'separate' | 'single' | 'head_of_household';

// ─────────── 1040 Income Field Map (Warren Moon Rules) ───────────

export const PERSONAL_1040_FIELD_MAP: Personal1040FieldMeta[] = [
  {
    key: 'wagesLine1a',
    label: 'W-2 Wages & Salaries',
    lineRef: 'Form 1040, Line 1a',
    hint: 'Find this on Form 1040, Line 1a. Use the total from your W-2s.',
    jointFilerNote: 'Only include W-2s in your name -- not your spouse\'s W-2s.',
  },
  {
    key: 'taxableInterestLine2b',
    label: 'Taxable Interest',
    lineRef: 'Form 1040, Line 2b',
    hint: 'Find this on Form 1040, Line 2b. Interest earned from bank accounts.',
    jointFilerNote: 'Include only interest attributable to your accounts.',
    flagIfAbove: 5000,
    flagNote: 'Credit officer will want to see underlying assets on PFS or proof from bank/brokerage statements. Confirm assets documented in Schedule B or D on PFS.',
  },
  {
    key: 'ordinaryDividendsLine3b',
    label: 'Ordinary Dividends',
    lineRef: 'Form 1040, Line 3b',
    hint: 'Find this on Form 1040, Line 3b. Dividends from brokerage accounts.',
    jointFilerNote: 'Include only dividends from accounts in your name.',
    flagIfAbove: 5000,
    flagNote: 'From brokerage accounts -- want to see assets documented on PFS. Confirm brokerage account assets appear in Schedule B or D on the PFS.',
  },
  {
    key: 'iraRMDLine4b',
    label: 'IRA Distributions (RMD Only)',
    lineRef: 'Form 1040, Line 4b',
    hint: 'Find this on Form 1040, Line 4b. Only include Required Minimum Distributions (RMD). Do not include one-time withdrawals.',
    jointFilerNote: 'Include only your RMD -- not your spouse\'s.',
    grossUp: 1.25,
    flagNote: 'Confirm this is an RMD and not a one-time withdrawal. If one-time withdrawal, exclude from personal cash flow.',
  },
  {
    key: 'pensionAnnuityLine5',
    label: 'Pension / Annuity Income',
    lineRef: 'Form 1040, Line 5',
    hint: 'Find this on Form 1040, Line 5. Only include ongoing, recurring payments -- not one-time pension payouts.',
    jointFilerNote: 'Include only your pension income -- not your spouse\'s.',
    grossUp: 1.25,
    flagNote: 'Confirm this is an ongoing recurring payment and not a one-time payout.',
  },
  {
    key: 'socialSecurityLine6b',
    label: 'Social Security Benefits',
    lineRef: 'Form 1040, Line 6b',
    hint: 'Find this on Form 1040, Line 6b (taxable amount).',
    jointFilerNote: 'Your return shows combined SS for both spouses. Enter only YOUR individual benefit amount.',
    grossUp: 1.25,
  },
  // Schedule C -- only if NOT the borrowing entity (side hustles)
  {
    key: 'nonBorrowingScheduleC',
    label: 'Other Business Income (Side Hustle)',
    lineRef: 'Schedule C, Line 31',
    hint: 'Only include Schedule C businesses that are NOT the business applying for this loan. Enter the net profit from Schedule C, Line 31.',
    jointFilerNote: 'Each Schedule C is tied to a specific SSN. Only include Schedule C businesses in your name.',
  },
];

/**
 * Alimony is handled separately -- voluntary disclosure only.
 * Never include in the main field map. Never prompt the client.
 * Only include if the client voluntarily mentions it.
 */
export const ALIMONY_VOLUNTARY_FIELD: Personal1040FieldMeta = {
  key: 'alimonyVoluntary',
  label: 'Alimony Received (if applicable)',
  lineRef: 'Schedule 1, Line 2a',
  hint: 'Only if you voluntarily wish to disclose. We do not require this information.',
  voluntaryOnly: true,
  jointFilerNote: 'Only include alimony received by you personally.',
};

// ─────────── EXCLUDED from Personal Cash Flow ───────────

/**
 * Items that are NEVER included in personal cash flow.
 * Documented here for reference and admin review.
 */
export const PERSONAL_CF_EXCLUSIONS = [
  {
    lineRef: 'Schedule E, Part II',
    label: 'Pass-through Income (S-Corp/Partnership K-1)',
    reason: 'Already captured in business EBIDA. Including here = double counting.',
    severity: 'critical' as const,
  },
  {
    lineRef: 'Form 1040, Line 4b (non-RMD)',
    label: 'One-time IRA Withdrawals',
    reason: 'Not recurring. Only Required Minimum Distributions are included.',
    severity: 'warning' as const,
  },
  {
    lineRef: 'Form 1040, Line 5 (non-recurring)',
    label: 'One-time Pension Payouts',
    reason: 'Not recurring. Only ongoing pension payments are included.',
    severity: 'warning' as const,
  },
  {
    lineRef: 'Schedule 1, Line 1',
    label: 'Tax Refunds',
    reason: 'One-time, not recurring income.',
    severity: 'info' as const,
  },
  {
    lineRef: 'Schedule 1, Line 4',
    label: 'Capital Gains/Losses',
    reason: 'Capital events, not recurring operating income.',
    severity: 'info' as const,
  },
  {
    lineRef: 'Schedule 1, Line 7',
    label: 'Unemployment Compensation',
    reason: 'Not recurring. Should not be active during loan repayment period.',
    severity: 'warning' as const,
  },
  {
    lineRef: 'Schedule 1, Line 8b',
    label: 'Gambling Income',
    reason: 'Never -- not recurring or reliable.',
    severity: 'info' as const,
  },
  {
    lineRef: 'Schedule 1, Line 8c',
    label: 'Cancellation of Debt',
    reason: 'One-time event -- not income.',
    severity: 'info' as const,
  },
];

/**
 * Items that go to the BUSINESS SIDE, not personal cash flow.
 */
export const BUSINESS_SIDE_ITEMS = [
  {
    lineRef: 'Schedule 1, Line 3 / Schedule C, Line 31',
    label: 'Schedule C Business Income',
    treatment: 'EBIDA minus annual debt service. If borrowing entity, exclude from personal entirely.',
  },
  {
    lineRef: 'Schedule 1, Line 5 / Schedule E, Part I',
    label: 'Rental Income (Schedule E Part I)',
    treatment: 'EBIDA minus annual mortgage payments. Treat like a business, not personal income.',
  },
  {
    lineRef: 'Schedule 1, Line 6 / Schedule F',
    label: 'Farm Income',
    treatment: 'EBIDA minus annual debt service. Treat same as Schedule C business income.',
  },
];

// ─────────── Joint Filer Questionnaire Fields ───────────

export interface JointFilerConfig {
  filingStatus: FilingStatus;
  spouseIsGuarantor: boolean;
}

export const JOINT_FILER_GUIDANCE =
  'You file jointly with your spouse. We will only use your individual income ' +
  'in this analysis -- not your combined household income. For each item below, ' +
  'enter only the amount that belongs to you specifically.';

export const JOINT_FILER_FLAG = {
  type: 'review_required' as const,
  description:
    'Client files jointly with spouse who is not a guarantor. ' +
    'Personal income must be isolated to the guarantor only. ' +
    'Review each W-2, interest, dividend, IRA, pension, and SS line to confirm ' +
    'which income belongs to the guarantor before calculating personal cash flow.',
};

// ─────────── Multiple Guarantor Logic ───────────

export interface GuarantorCashFlowSummary {
  guarantorName: string;
  ownershipPct: number;
  personalCashFlowAvailable: number;
  personalDebtService: number;
  personalDiscretionaryCF: number;
}

export function calculateGlobalPersonalCashFlow(
  guarantors: GuarantorCashFlowSummary[]
): number {
  return guarantors.reduce(
    (total, g) => total + g.personalDiscretionaryCF,
    0
  );
}

// ─────────── PFS Section Map ───────────

export interface PFSSectionMeta {
  key: string;
  label: string;
  section: string;
  category: 'asset' | 'liability';
  jointFilerNote?: string;
}

export const PFS_ASSET_MAP: PFSSectionMeta[] = [
  {
    key: 'cashAndSavings',
    label: 'Cash and Savings',
    section: 'Section 1',
    category: 'asset',
    jointFilerNote: 'Joint accounts: include 50% unless documented otherwise.',
  },
  {
    key: 'realEstate',
    label: 'Real Estate (market value)',
    section: 'Section 3',
    category: 'asset',
    jointFilerNote: 'Jointly owned: 50/50 split. Spouse-only property excluded unless spouse is a guarantor.',
  },
  {
    key: 'investments',
    label: 'Investments',
    section: 'Section 4',
    category: 'asset',
    jointFilerNote: 'Include only accounts in your name or 50% of joint accounts.',
  },
  {
    key: 'retirementAccounts',
    label: 'Retirement Accounts',
    section: 'Section 5',
    category: 'asset',
    jointFilerNote: 'Retirement accounts are always individual. Include only yours.',
  },
  {
    key: 'otherAssets',
    label: 'Other Assets',
    section: 'Section 6',
    category: 'asset',
  },
];

export const PFS_LIABILITY_MAP: PFSSectionMeta[] = [
  {
    key: 'mortgageBalance',
    label: 'Mortgage Balance',
    section: 'Section 8',
    category: 'liability',
    jointFilerNote: 'Joint mortgage: include full balance -- you are jointly liable.',
  },
  {
    key: 'installmentLoans',
    label: 'Installment Loans',
    section: 'Section 9',
    category: 'liability',
    jointFilerNote: 'Include all loans you are personally liable for.',
  },
  {
    key: 'creditCardBalances',
    label: 'Credit Card Balances',
    section: 'Section 10',
    category: 'liability',
    jointFilerNote: 'Include all cards in your name or that you are an authorized user on.',
  },
  {
    key: 'otherLiabilities',
    label: 'Other Liabilities',
    section: 'Section 11',
    category: 'liability',
  },
];
