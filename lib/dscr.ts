/**
 * DSCR (Debt Service Coverage Ratio) calculation, scoring, and rent addback.
 *
 * DSCR = Cash Available for Debt Service / Total Annual Debt Service
 * Goal: 1.25x or higher.
 */

// ─────────── Rent Addback ───────────

export type PropertySituation = 'rents' | 'owns' | 'remote';

export interface RentAddbackInput {
  propertySituation: PropertySituation;
  rentAppearsOnFinancials: boolean; // only relevant if owns
  annualRentExpense: number;        // only relevant if owns + appears on financials
}

/**
 * Rent is only added back when the business OWNS the property
 * AND rent appears as an expense on their financials.
 *
 * If the business rents → addback is always 0.
 * If the business owns but never booked rent → addback is 0 (nothing to add back).
 */
export function calculateRentAddback(input: RentAddbackInput): number {
  if (input.propertySituation !== 'owns') return 0;
  if (!input.rentAppearsOnFinancials) return 0;
  return input.annualRentExpense;
}

// ─────────── DSCR ───────────
// Note: CADS/EBIDA calculation has moved to lib/ebida.ts
// DSCR = Adjusted Business Cash Flow / Total Annual Debt Service

export function calculateDSCR(
  cashAvailableForDebtService: number,
  totalAnnualDebtService: number
): number {
  if (totalAnnualDebtService === 0) return 0;
  return cashAvailableForDebtService / totalAnnualDebtService;
}

// ─────────── Scoring ───────────

export function scoreDSCR(dscr: number): number {
  if (dscr >= 1.25) return 30;
  if (dscr >= 1.0) return 20;
  return 0;
}

// ─────────── Display band ───────────

export interface DSCRBand {
  label: string;
  color: string;
  message: string;
}

export function dscrBand(dscr: number): DSCRBand {
  if (dscr >= 1.25) {
    return {
      label: 'Strong',
      color: '#1D9E75',
      message: 'Your cash flow comfortably covers your debt obligations. This is what banks want to see.',
    };
  }
  if (dscr >= 1.0) {
    return {
      label: 'Marginal',
      color: '#BA7517',
      message: 'Your cash flow covers your debt, but with thin margin. Banks may flag this.',
    };
  }
  return {
    label: 'Below threshold',
    color: '#DC4444',
    message:
      'Your cash flow does not cover your existing debt service. Banks will likely require additional collateral or a co-signer.',
  };
}
