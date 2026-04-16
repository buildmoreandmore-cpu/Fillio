/**
 * DSCR (Debt Service Coverage Ratio) calculation, scoring, and rent addback.
 *
 * DSCR = Cash Available for Debt Service / Total Annual Debt Service
 * Goal: 1.25x or higher.
 */

// ─────────── Rent Addback ───────────

export type PropertySituation = 'rents' | 'owns_same_entity' | 'owns_separate_entity' | 'remote';

export interface RentAddbackInput {
  propertySituation: PropertySituation;
  rentAppearsOnFinancials: boolean; // only relevant if owns_same_entity
  annualRentExpense: number;        // only relevant if owns_same_entity + appears on financials
}

/**
 * Rent addback rules — three "no addback" situations:
 *
 * 1. Renting from a landlord → cash is leaving the business. No addback ever.
 * 2. Owner-occupied but rent NOT on financials → nothing was deducted. Nothing to add back.
 * 3. Owner holds property in a SEPARATE entity (e.g. holding LLC) and operating
 *    business pays rent TO that entity → rent is real cash leaving the operating
 *    business, even though the owner controls both sides. No addback.
 *
 * The ONLY addback scenario:
 * - Owner owns building personally or through the SAME borrowing entity
 * - Rent expense appears on the return
 * - Building is NOT rented through a separate structure
 */
export function calculateRentAddback(input: RentAddbackInput): number {
  if (input.propertySituation !== 'owns_same_entity') return 0;
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
