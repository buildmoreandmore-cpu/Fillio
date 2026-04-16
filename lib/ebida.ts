/**
 * EBIDA (Business Cash Flow) calculation engine.
 *
 * EBIDA = Earnings + Interest + Depreciation + Amortization
 *
 * This is NOT EBITDA — there is no Tax addback.
 * Every input maps to a specific line on the business tax return.
 *
 * EBIDA is the numerator in the DSCR calculation:
 *   DSCR = Adjusted Business Cash Flow / Total Annual Debt Service
 */

// ─────────── Entity Types ───────────

export type ScorecardEntityType =
  | 'scorp'
  | 'partnership'
  | 'ccorp'
  | 'llc_scorp'
  | 'llc_ccorp'
  | 'sole_prop';

export const SCORECARD_ENTITY_LABELS: Record<ScorecardEntityType, string> = {
  scorp: 'S-Corporation',
  partnership: 'Partnership',
  ccorp: 'C-Corporation',
  llc_scorp: 'LLC (taxed as S-Corp)',
  llc_ccorp: 'LLC (taxed as C-Corp)',
  sole_prop: 'Sole Proprietorship',
};

/** Tax form reference per entity type */
export const ENTITY_TAX_FORM: Record<ScorecardEntityType, string> = {
  scorp: 'Form 1120-S',
  partnership: 'Form 1065',
  ccorp: 'Form 1120',
  llc_scorp: 'Form 1120-S',
  llc_ccorp: 'Form 1120',
  sole_prop: 'Schedule C',
};

/**
 * S-Corps, Partnerships, and LLCs taxed as S-Corp pass income through to the
 * owner's personal return. The owner owes personal taxes on that income
 * regardless of whether distributions were taken. Banks apply a 30% tax
 * haircut to normalize cash flow.
 *
 * Sole proprietors: no adjustment — self-employment tax is captured on the
 * personal side, not the business EBIDA.
 *
 * C-Corps: no adjustment — the entity pays its own taxes at the corporate level.
 */
export function isPassthroughEntity(entityType: ScorecardEntityType): boolean {
  return ['scorp', 'partnership', 'llc_scorp'].includes(entityType);
}

/** 30% tax adjustment for pass-through entities. Always applied based on
 *  entity structure, NOT on whether distributions were actually taken. */
export function calculateTaxAdjustment(
  netIncome: number,
  entityType: ScorecardEntityType
): number {
  if (!isPassthroughEntity(entityType)) return 0;
  if (netIncome <= 0) return 0; // no tax on a loss
  return netIncome * 0.30;
}

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
 * Adjusted Cash Flow = EBIDA + Rent Addback - Tax Adjustment (30% for pass-through)
 *
 * Tax adjustment is based on entity type, not on cash behavior.
 * Rent addback = 0 unless the business owns its property in the same entity
 * AND rent appears on the financials.
 */
export function calculateAdjustedCashFlow(
  ebida: number,
  rentAddback: number,
  taxAdjustment: number = 0
): number {
  return ebida + rentAddback - taxAdjustment;
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
