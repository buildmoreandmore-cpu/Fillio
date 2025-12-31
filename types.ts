
export enum DocumentType {
  PFS = 'PERSONAL_FINANCIAL_STATEMENT',
  DEBT_SCHEDULE = 'DEBT_SCHEDULE',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  BALANCE_SHEET = 'BALANCE_SHEET'
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
