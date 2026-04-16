/**
 * DSCR (Debt Service Coverage Ratio) calculation, scoring, and rent addback.
 *
 * DSCR = Cash Available for Debt Service / Total Annual Debt Service
 *
 * Three thresholds:
 *   Floor:     1.00x  — minimum to be considered
 *   Benchmark: 1.25x  — what banks want to see
 *   Leverage:  < 3.0  — debt to tangible net worth (separate metric)
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
  if (dscr >= 1.25) return 30;  // Meets benchmark — strong
  if (dscr >= 1.0) return 15;   // Clears floor — marginal
  return 0;                      // Below floor — critical
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
      message: 'Your cash flow meets the 1.25x benchmark banks want to see. This puts you in a strong position.',
    };
  }
  if (dscr >= 1.0) {
    return {
      label: 'Marginal',
      color: '#BA7517',
      message:
        'Your cash flow clears the 1.00x floor but falls short of the 1.25x benchmark. ' +
        'This will likely trigger additional scrutiny and may result in a counteroffer at a lower loan amount, ' +
        'additional collateral, or a guarantor requirement.',
    };
  }
  return {
    label: 'Critical',
    color: '#DC4444',
    message:
      'Your cash flow does not cover your existing debt service (below the 1.00x floor). ' +
      'This is a hard stop for most lenders. The bank will not approve new debt when existing obligations are not covered.',
  };
}
