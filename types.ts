
export enum DocumentType {
  PFS = 'PERSONAL_FINANCIAL_STATEMENT',
  DEBT_SCHEDULE = 'DEBT_SCHEDULE',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  BALANCE_SHEET = 'BALANCE_SHEET',
  CASH_FLOW_PROJECTION = 'CASH_FLOW_PROJECTION'
}

export interface FinancialItem {
  id: string;
  description: string;
  value: number;
}

export interface PFSData {
  fullName: string;
  asOfDate: string;
  cashAssets: FinancialItem[];
  realEstateAssets: FinancialItem[];
  investmentAssets: FinancialItem[];
  realEstateLiabilities: FinancialItem[];
  otherLiabilities: FinancialItem[];
}

export type AppState = {
  selectedDoc: DocumentType | null;
  currentStep: number;
  data: PFSData;
};

export interface StepDefinition {
  id: string;
  title: string;
  description: string;
}

// ─────────── Capacity Scorecard ───────────

export interface CapacityData {
  taxYear: number;
  // EBIDA inputs (tax return mapped — Form 1120-S)
  netIncome: number;           // Schedule M-1, Line 1
  interestExpense: number;     // Line 13
  depreciation: number;        // Line 14
  amortization: number;        // User-provided
  // Property situation
  propertySituation: 'rents' | 'owns_same_entity' | 'owns_separate_entity' | 'remote';
  rentAppearsOnFinancials: boolean;
  annualRentExpense: number;
  rentAddbackApplied: number;
  // Derived values
  ebida: number;
  adjustedCashFlow: number;
  totalAnnualDebtService: number;
  dscr: number;
  dscrScore: number;
  sbaEligible: boolean;
}
