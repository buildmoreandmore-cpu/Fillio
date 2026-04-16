/**
 * Complete Cash Flow Worksheet — Admin-Side Calculation Engine
 *
 * Three connected calculations:
 *  1. Business Cash Flow (Net Operating Funds Flow) — EBIDA with all adjustments
 *  2. Personal Cash Flow Available to Service Personal Debt
 *  3. Personal Discretionary Cash Flow
 *
 * This is the exact worksheet banks use internally.
 */

// ── ENTITY TYPES ────────────────────────────────────────────────────

export type EntityType =
  | 'scorp'
  | 'partnership'
  | 'ccorp'
  | 'llc_scorp'
  | 'llc_ccorp'
  | 'sole_prop';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  scorp: 'S-Corporation',
  partnership: 'Partnership',
  ccorp: 'C-Corporation',
  llc_scorp: 'LLC (taxed as S-Corp)',
  llc_ccorp: 'LLC (taxed as C-Corp)',
  sole_prop: 'Sole Proprietorship',
};

/** S-Corps and Partnerships (including LLCs taxed as S-Corp) pass income through
 *  to the owner's personal return. The bank applies a 30% tax haircut. */
export function taxAdjustmentApplies(entityType: EntityType): boolean {
  return ['scorp', 'partnership', 'llc_scorp'].includes(entityType);
}

// ── SECTION 1: BUSINESS CASH FLOW ──────────────────────────────────

export interface BusinessCashFlowInputs {
  netProfit: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  oneTimeNonrecurringIncome: number;    // discounted @70%
  oneTimeNonrecurringExpenses: number;  // added back @70%
  rentExpense: number;                  // @70% only if owner-occupied
  isOwnerOccupied: boolean;
  ownerWithdrawals: number;
  entityType: EntityType;
}

export interface BusinessCashFlowBreakdown {
  netProfit: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  oneTimeIncomeDiscounted: number;      // input * 0.70
  oneTimeExpensesDiscounted: number;    // input * 0.70
  rentAddback70pct: number;             // rentExpense * 0.70 (or 0)
  ownerWithdrawals: number;
  taxAdjustment30pct: number;           // netProfit * 0.30 (or 0)
  total: number;
}

export function calculateBusinessCashFlow(inputs: BusinessCashFlowInputs): BusinessCashFlowBreakdown {
  const applyTax = taxAdjustmentApplies(inputs.entityType);
  const rentAddback = inputs.isOwnerOccupied ? inputs.rentExpense * 0.70 : 0;
  const oneTimeIncomeDiscounted = inputs.oneTimeNonrecurringIncome * 0.70;
  const oneTimeExpensesDiscounted = inputs.oneTimeNonrecurringExpenses * 0.70;
  const taxAdj = applyTax ? inputs.netProfit * 0.30 : 0;

  const total =
    inputs.netProfit +
    inputs.interestExpense +
    inputs.depreciationAndAmortization -
    oneTimeIncomeDiscounted +
    oneTimeExpensesDiscounted +
    rentAddback -
    inputs.ownerWithdrawals -
    taxAdj;

  return {
    netProfit: inputs.netProfit,
    interestExpense: inputs.interestExpense,
    depreciationAndAmortization: inputs.depreciationAndAmortization,
    oneTimeIncomeDiscounted,
    oneTimeExpensesDiscounted,
    rentAddback70pct: rentAddback,
    ownerWithdrawals: inputs.ownerWithdrawals,
    taxAdjustment30pct: taxAdj,
    total,
  };
}

// ── BUSINESS DEBT SERVICE ──────────────────────────────────────────

export interface BusinessDebtServiceInputs {
  termDebtMonthlyPayment: number;
  businessLOCLimit: number;
  businessCCOtherLenderBalance: number;   // outstanding balance
  businessCCThisLenderLimit: number;      // limit
  newLOCLimit: number;                    // proposed new LOC
  newTermLoanMonthlyPayment: number;      // proposed new term loan
}

export interface BusinessDebtServiceBreakdown {
  termDebt: number;
  loc: number;
  ccOther: number;
  ccThisLender: number;
  newLoc: number;
  newTermLoan: number;
  total: number;
}

export function calculateBusinessDebtService(inputs: BusinessDebtServiceInputs): BusinessDebtServiceBreakdown {
  const termDebt = inputs.termDebtMonthlyPayment * 12;
  const loc = inputs.businessLOCLimit * 0.24;
  const ccOther = inputs.businessCCOtherLenderBalance * 0.25;
  const ccThisLender = inputs.businessCCThisLenderLimit * 0.25;
  const newLoc = inputs.newLOCLimit * 0.24;
  const newTermLoan = inputs.newTermLoanMonthlyPayment * 12;

  return {
    termDebt,
    loc,
    ccOther,
    ccThisLender,
    newLoc,
    newTermLoan,
    total: termDebt + loc + ccOther + ccThisLender + newLoc + newTermLoan,
  };
}

export function calculateBusinessDSCR(
  businessCashFlow: number,
  businessDebtService: number
): number {
  if (businessDebtService === 0) return 0;
  return businessCashFlow / businessDebtService;
}

// ── SECTION 2: PERSONAL CASH FLOW ──────────────────────────────────

export interface PersonalCashFlowInputs {
  wagesAndSalaries: number;
  interestAndDividends: number;
  recurringIRAAndPension: number;         // grossed up x1.25
  socialSecurity: number;                 // grossed up x1.25
  alimony: number;
  businessIncomeScheduleC: number;        // only if NOT the borrowing entity
  isBorrowingEntityScheduleC: boolean;    // if true, exclude from total
  rentalIncomeScheduleE: number;
  farmIncomeScheduleF: number;
  otherRecurringIncome: number;
  distributions: number;
}

export interface PersonalCashFlowBreakdown {
  wagesAndSalaries: number;
  interestAndDividends: number;
  iraAndPensionGrossed: number;          // input * 1.25
  socialSecurityGrossed: number;         // input * 1.25
  alimony: number;
  scheduleCIncluded: number;             // 0 if borrowing entity
  scheduleCExcluded: boolean;
  rentalIncome: number;
  farmIncome: number;
  otherRecurring: number;
  distributions: number;
  totalIncome: number;
  dividedBy2: number;
}

export function calculatePersonalCashFlow(inputs: PersonalCashFlowInputs): PersonalCashFlowBreakdown {
  const iraGrossed = inputs.recurringIRAAndPension * 1.25;
  const ssGrossed = inputs.socialSecurity * 1.25;
  const scheduleCAmount = inputs.isBorrowingEntityScheduleC ? 0 : inputs.businessIncomeScheduleC;

  const totalIncome =
    inputs.wagesAndSalaries +
    inputs.interestAndDividends +
    iraGrossed +
    ssGrossed +
    inputs.alimony +
    scheduleCAmount +
    inputs.rentalIncomeScheduleE +
    inputs.farmIncomeScheduleF +
    inputs.otherRecurringIncome +
    inputs.distributions;

  return {
    wagesAndSalaries: inputs.wagesAndSalaries,
    interestAndDividends: inputs.interestAndDividends,
    iraAndPensionGrossed: iraGrossed,
    socialSecurityGrossed: ssGrossed,
    alimony: inputs.alimony,
    scheduleCIncluded: scheduleCAmount,
    scheduleCExcluded: inputs.isBorrowingEntityScheduleC,
    rentalIncome: inputs.rentalIncomeScheduleE,
    farmIncome: inputs.farmIncomeScheduleF,
    otherRecurring: inputs.otherRecurringIncome,
    distributions: inputs.distributions,
    totalIncome,
    dividedBy2: totalIncome / 2,
  };
}

// ── SECTION 3: PERSONAL DEBT SERVICE ───────────────────────────────

export interface PersonalDebtServiceInputs {
  mortgageMonthlyPayment: number;         // P+I, x 12
  homeEquityLineBalance: number;          // outstanding balance x .12
  personalCCBalance: number;              // outstanding balance x .25
  otherTermDebtMonthlyPayment: number;    // x 12
}

export interface PersonalDebtServiceBreakdown {
  mortgage: number;
  heloc: number;
  personalCC: number;
  otherTermDebt: number;
  total: number;
}

export function calculatePersonalDebtService(inputs: PersonalDebtServiceInputs): PersonalDebtServiceBreakdown {
  const mortgage = inputs.mortgageMonthlyPayment * 12;
  const heloc = inputs.homeEquityLineBalance * 0.12;
  const personalCC = inputs.personalCCBalance * 0.25;
  const otherTermDebt = inputs.otherTermDebtMonthlyPayment * 12;

  return {
    mortgage,
    heloc,
    personalCC,
    otherTermDebt,
    total: mortgage + heloc + personalCC + otherTermDebt,
  };
}

// ── SECTION 4: PERSONAL DISCRETIONARY CASH FLOW ────────────────────

export function calculatePersonalDiscretionaryCashFlow(
  personalCashFlowAvailable: number,
  totalPersonalDebtService: number
): number {
  return personalCashFlowAvailable - totalPersonalDebtService;
}

// ── SCORING ────────────────────────────────────────────────────────

export function scorePersonalDiscretionaryCF(amount: number): number {
  if (amount > 20000) return 20;
  if (amount >= 5000) return 10;
  if (amount >= 0) return 5;
  return -10;
}

export function scoreBusinessDSCR(dscr: number): number {
  if (dscr >= 1.25) return 30;
  if (dscr >= 1.0) return 20;
  return 0;
}

// ── DSCR DISPLAY BAND ──────────────────────────────────────────────

export interface DSCRBand {
  label: string;
  color: string;
  message: string;
}

export function businessDSCRBand(dscr: number): DSCRBand {
  if (dscr >= 1.25) {
    return {
      label: 'Strong',
      color: '#1D9E75',
      message: 'Business cash flow comfortably covers all debt obligations including the proposed loan.',
    };
  }
  if (dscr >= 1.0) {
    return {
      label: 'Marginal',
      color: '#BA7517',
      message: 'Cash flow covers debt, but with thin margin. Additional collateral or guarantor strength may be needed.',
    };
  }
  return {
    label: 'Below threshold',
    color: '#DC4444',
    message: 'Cash flow does not cover total debt service. Review adjustments or consider restructuring the request.',
  };
}

export interface PersonalCFBand {
  label: string;
  color: string;
  message: string;
}

export function personalCFBand(amount: number): PersonalCFBand {
  if (amount > 20000) {
    return {
      label: 'Strong cushion',
      color: '#1D9E75',
      message: 'Personal income comfortably covers all personal obligations with significant margin.',
    };
  }
  if (amount >= 5000) {
    return {
      label: 'Adequate',
      color: '#BA7517',
      message: 'Personal obligations are covered but cushion is modest. Banks may note this.',
    };
  }
  if (amount >= 0) {
    return {
      label: 'Thin',
      color: '#BA7517',
      message: 'Personal income barely covers obligations. This will draw scrutiny.',
    };
  }
  return {
    label: 'Negative',
    color: '#DC4444',
    message: 'Personal obligations exceed personal income. This is a significant risk flag even if business DSCR looks strong.',
  };
}
