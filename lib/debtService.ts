/**
 * Business Debt Service Calculation Engine
 *
 * CRITICAL RULE: Different debt types are annualized differently.
 * Do NOT use the same formula for every debt type.
 * The method depends on what kind of obligation it is.
 *
 * Uses 1 year of data only (no averaging, no blending).
 */

// ─────────── Types ───────────

export type DebtType =
  | 'mortgage'
  | 'lease'
  | 'term_loan'
  | 'business_loc'
  | 'sba_loc'
  | 'cc_this_lender'
  | 'cc_other_lender'
  | 'other';

export interface DebtObligation {
  id: string;
  type: DebtType;
  isGraded: boolean;
  monthlyPayment?: number;     // mortgage, lease, term_loan, other
  creditLimit?: number;        // LOC standard, CC this lender standard
  outstandingBalance?: number; // SBA LOC graded, CC other lender, CC graded
}

// ─────────── Credit card tooltip ───────────

/** Shown next to credit card balance input in the UI. */
export const CC_BALANCE_TOOLTIP =
  'We calculate using your outstanding balance. Some lenders use the full credit limit ' +
  'instead — your banker may apply a different method depending on their institution\'s policy.';

// ─────────── Display labels ───────────

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  mortgage: 'Mortgage',
  lease: 'Equipment Lease',
  term_loan: 'Term Loan',
  business_loc: 'Business Line of Credit',
  sba_loc: 'SBA Line of Credit',
  cc_this_lender: 'Business Credit Card (this lender)',
  cc_other_lender: 'Business Credit Card (other lender)',
  other: 'Other',
};

// ─────────── Helpers ───────────

/** True if this debt type supports a "graded request" toggle.
 *  Credit cards use balance x .25 regardless of graded status in this tool,
 *  so only LOCs benefit from a graded toggle. */
export function supportsGraded(type: DebtType): boolean {
  return ['business_loc', 'sba_loc'].includes(type);
}

/** Returns which dollar field the UI should show for a given type + graded state. */
export function getRequiredField(
  type: DebtType,
  isGraded: boolean
): 'monthlyPayment' | 'creditLimit' | 'outstandingBalance' {
  switch (type) {
    case 'mortgage':
    case 'lease':
    case 'term_loan':
    case 'other':
      return 'monthlyPayment';

    case 'business_loc':
      // Standard → limit, Graded → still uses limit (amortized)
      return 'creditLimit';

    case 'sba_loc':
      return isGraded ? 'outstandingBalance' : 'creditLimit';

    case 'cc_this_lender':
      return 'outstandingBalance';

    case 'cc_other_lender':
      // Always outstanding balance — graded or not
      return 'outstandingBalance';

    default:
      return 'monthlyPayment';
  }
}

/** User-facing label for the dollar input field. */
export function getFieldLabel(field: 'monthlyPayment' | 'creditLimit' | 'outstandingBalance'): string {
  switch (field) {
    case 'monthlyPayment':
      return 'Monthly Payment';
    case 'creditLimit':
      return 'Credit Limit';
    case 'outstandingBalance':
      return 'Outstanding Balance';
  }
}

// ─────────── Core calculation ───────────

export function calculateAnnualDebtService(debt: DebtObligation): number {
  switch (debt.type) {
    // ── Mortgages, Leases, Term Loans, Other ──
    // Annual Debt Service = Monthly Payment x 12
    case 'mortgage':
    case 'lease':
    case 'term_loan':
    case 'other':
      return (debt.monthlyPayment ?? 0) * 12;

    // ── Business Line of Credit ──
    case 'business_loc':
      if (debt.isGraded) {
        // Graded: Credit Limit termed out over 5 years at 12% annual rate
        // Standard amortization: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        const principal = debt.creditLimit ?? 0;
        if (principal === 0) return 0;
        const monthlyRate = 0.12 / 12; // 1% per month
        const n = 60; // 5 years
        const mp =
          principal *
          (monthlyRate * Math.pow(1 + monthlyRate, n)) /
          (Math.pow(1 + monthlyRate, n) - 1);
        return mp * 12;
      }
      // Standard: Credit Limit x .24
      return (debt.creditLimit ?? 0) * 0.24;

    // ── SBA Line of Credit ──
    case 'sba_loc':
      if (debt.isGraded) {
        // Graded: Outstanding Balance x .25
        return (debt.outstandingBalance ?? 0) * 0.25;
      }
      // Standard: Credit Limit x .192
      return (debt.creditLimit ?? 0) * 0.192;

    // ── Business Credit Cards — This Lender ──
    // BankReadyDocs uses outstanding balance for ALL credit cards.
    // Balance is what the client can verify from their statement.
    // NOTE: Some lenders (e.g. Chase) use the full credit limit instead.
    // Tooltip: "We calculate using your outstanding balance. Some lenders use the
    // full credit limit instead — your banker may apply a different method
    // depending on their institution's policy."
    case 'cc_this_lender':
      return (debt.outstandingBalance ?? 0) * 0.25;

    // ── Business Credit Cards — Other Lenders ──
    // Always Outstanding Balance x .25 — graded or not.
    // Reason: we don't have visibility into the limit on cards held at other lenders.
    case 'cc_other_lender':
      return (debt.outstandingBalance ?? 0) * 0.25;

    default:
      return 0;
  }
}

export function calculateTotalAnnualDebtService(debts: DebtObligation[]): number {
  return debts.reduce((total, d) => total + calculateAnnualDebtService(d), 0);
}

// ─────────── Human-readable calculation description (for breakdown table) ───────────

function fmtDollar(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function getCalculationDescription(debt: DebtObligation): string {
  switch (debt.type) {
    case 'mortgage':
    case 'lease':
    case 'term_loan':
    case 'other':
      return `${fmtDollar(debt.monthlyPayment ?? 0)}/mo x 12`;

    case 'business_loc':
      if (debt.isGraded) {
        return `${fmtDollar(debt.creditLimit ?? 0)} limit amortized 5yr @ 12%`;
      }
      return `${fmtDollar(debt.creditLimit ?? 0)} limit x .24`;

    case 'sba_loc':
      if (debt.isGraded) {
        return `${fmtDollar(debt.outstandingBalance ?? 0)} balance x .25`;
      }
      return `${fmtDollar(debt.creditLimit ?? 0)} limit x .192`;

    case 'cc_this_lender':
      return `${fmtDollar(debt.outstandingBalance ?? 0)} balance x .25`;

    case 'cc_other_lender':
      return `${fmtDollar(debt.outstandingBalance ?? 0)} balance x .25`;

    default:
      return '';
  }
}
