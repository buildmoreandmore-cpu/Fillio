/**
 * Personal Tax Return (Form 1040) — Line Number Mapping
 *
 * Maps each personal cash flow input to its exact location on the
 * IRS Form 1040 and associated schedules. Used by the UI to guide
 * clients through their personal tax return.
 *
 * These fields feed the Personal Cash Flow calculation:
 *   Total Income → divide by 2 → Personal Cash Flow Available
 */

// ─────────── Types ───────────

export interface Personal1040FieldMeta {
  key: string;
  label: string;
  lineRef: string;
  hint: string;
  grossUp?: number; // e.g. 1.25 for IRA/SS
}

// ─────────── 1040 Income Field Map ───────────

export const PERSONAL_1040_FIELD_MAP: Personal1040FieldMeta[] = [
  {
    key: 'wagesAndSalaries',
    label: 'Wages and Salaries',
    lineRef: 'Form 1040, Line 1',
    hint: 'Find this on Form 1040, Line 1 of your personal tax return',
  },
  {
    key: 'interestAndDividends',
    label: 'Interest and Dividends',
    lineRef: 'Schedule B',
    hint: 'Find this on Schedule B of your personal tax return',
  },
  {
    key: 'recurringIRAAndPension',
    label: 'IRA / Pension Income',
    lineRef: 'Form 1040, Line 4',
    hint: 'Find this on Form 1040, Line 4. Grossed up x 1.25 (non-taxable income adjustment)',
    grossUp: 1.25,
  },
  {
    key: 'socialSecurity',
    label: 'Social Security',
    lineRef: 'Form 1040, Line 6',
    hint: 'Find this on Form 1040, Line 6. Grossed up x 1.25 (non-taxable income adjustment)',
    grossUp: 1.25,
  },
  {
    key: 'businessIncomeScheduleC',
    label: 'Schedule C Business Income',
    lineRef: 'Schedule C, Line 31',
    hint: 'Find this on Schedule C, Line 31. Excluded if this IS the borrowing entity',
  },
  {
    key: 'rentalIncomeScheduleE',
    label: 'Rental Income',
    lineRef: 'Schedule E, Line 26',
    hint: 'Find this on Schedule E, Line 26 of your personal tax return',
  },
  {
    key: 'farmIncomeScheduleF',
    label: 'Farm Income',
    lineRef: 'Schedule F, Line 34',
    hint: 'Find this on Schedule F, Line 34 of your personal tax return',
  },
  {
    key: 'distributions',
    label: 'K-1 Distributions',
    lineRef: 'Schedule K-1, Line 16d',
    hint: 'Find this on Schedule K-1, Line 16d — distributions from the business entity',
  },
  {
    key: 'alimony',
    label: 'Alimony Received',
    lineRef: 'Form 1040, Line 2a',
    hint: 'Find this on Form 1040, Line 2a (only for divorce agreements before 2019)',
  },
];

// ─────────── PFS Section Map ───────────

export interface PFSSectionMeta {
  key: string;
  label: string;
  section: string;
  category: 'asset' | 'liability';
}

export const PFS_ASSET_MAP: PFSSectionMeta[] = [
  { key: 'cashAndSavings', label: 'Cash and Savings', section: 'Section 1', category: 'asset' },
  { key: 'realEstate', label: 'Real Estate (market value)', section: 'Section 3', category: 'asset' },
  { key: 'investments', label: 'Investments', section: 'Section 4', category: 'asset' },
  { key: 'retirementAccounts', label: 'Retirement Accounts', section: 'Section 5', category: 'asset' },
  { key: 'otherAssets', label: 'Other Assets', section: 'Section 6', category: 'asset' },
];

export const PFS_LIABILITY_MAP: PFSSectionMeta[] = [
  { key: 'mortgageBalance', label: 'Mortgage Balance', section: 'Section 8', category: 'liability' },
  { key: 'installmentLoans', label: 'Installment Loans', section: 'Section 9', category: 'liability' },
  { key: 'creditCardBalances', label: 'Credit Card Balances', section: 'Section 10', category: 'liability' },
  { key: 'otherLiabilities', label: 'Other Liabilities', section: 'Section 11', category: 'liability' },
];
