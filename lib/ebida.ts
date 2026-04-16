/**
 * EBIDA (Business Cash Flow) calculation engine.
 *
 * EBIDA = Earnings + Interest + Depreciation + Amortization
 *
 * This is NOT EBITDA — there is no Tax addback.
 * Every input maps to a specific line on the IRS Form 1120-S (S-Corp) tax return.
 *
 * EBIDA is the numerator in the DSCR calculation:
 *   DSCR = Adjusted Business Cash Flow / Total Annual Debt Service
 */

// ─────────── Types ───────────

export interface EBIDAInputs {
  netIncome: number;           // Schedule M-1, Line 1 (Ordinary Business Income)
  interestExpense: number;     // Line 13
  depreciationExpense: number; // Line 14
  amortizationExpense: number; // Depreciation schedule or accountant-provided
}

// ─────────── Calculation ───────────

/**
 * Business Cash Flow = Net Income + Interest + Depreciation + Amortization
 */
export function calculateEBIDA(inputs: EBIDAInputs): number {
  return (
    inputs.netIncome +
    inputs.interestExpense +
    inputs.depreciationExpense +
    inputs.amortizationExpense
  );
}

/**
 * Adjusted Cash Flow adds the conditional rent addback (owner-occupied only)
 * on top of base EBIDA. Rent addback = 0 unless the business owns its property
 * AND rent appears on the financials (Line 11).
 */
export function calculateAdjustedCashFlow(
  ebida: number,
  rentAddback: number
): number {
  return ebida + rentAddback;
}

// ─────────── Tax Return Field Metadata ───────────

export interface TaxFieldMeta {
  key: keyof EBIDAInputs;
  label: string;
  lineRef: string;
  hint: string;
}

export const TAX_FIELD_MAP: TaxFieldMeta[] = [
  {
    key: 'netIncome',
    label: 'Net Income (Ordinary Business Income)',
    lineRef: 'Schedule M-1, Line 1',
    hint: 'Find this on Schedule M-1, Line 1 of your business tax return',
  },
  {
    key: 'interestExpense',
    label: 'Interest Expense',
    lineRef: 'Line 13',
    hint: 'Find this on Line 13 of your business tax return',
  },
  {
    key: 'depreciationExpense',
    label: 'Depreciation',
    lineRef: 'Line 14',
    hint: 'Find this on Line 14 of your business tax return',
  },
  {
    key: 'amortizationExpense',
    label: 'Amortization (if any)',
    lineRef: '',
    hint: 'Find this on your depreciation schedule or ask your accountant',
  },
];
