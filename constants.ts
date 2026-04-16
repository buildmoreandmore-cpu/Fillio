import { DocumentType, StepDefinition } from './types';

export interface DocOption {
  type: DocumentType;
  title: string;
  description: string;
  outcomeDescription: string;
  timeEstimate: string;
  isPopular?: boolean;
  icon: string;
  logo: string;
}

export const DOC_OPTIONS: DocOption[] = [
  {
    type: DocumentType.PFS,
    title: 'Personal Financial Statement',
    description: 'Detailed view of your net worth and holdings.',
    outcomeDescription: 'The gold standard for loan applications. Show lenders exactly what you own and owe.',
    timeEstimate: '~5 min',
    isPopular: true,
    icon: 'solar:chart-square-bold-duotone',
    logo: 'solar:chart-2-bold'
  },
  {
    type: DocumentType.DEBT_SCHEDULE,
    title: 'Debt Schedule',
    description: 'Organize and track all active liabilities.',
    outcomeDescription: 'Get crystal clear on your repayments and timelines. Perfect for debt restructuring.',
    timeEstimate: '~8 min',
    icon: 'solar:bill-list-bold-duotone',
    logo: 'solar:checklist-bold'
  },
  {
    type: DocumentType.INCOME_STATEMENT,
    title: 'Income Statement',
    description: 'Profit and loss tracking for any period.',
    outcomeDescription: 'Understand your true cash flow and profitability over time. Vital for growth.',
    timeEstimate: '~10 min',
    icon: 'solar:graph-up-bold-duotone',
    logo: 'solar:graph-up-bold'
  },
  {
    type: DocumentType.BALANCE_SHEET,
    title: 'Balance Sheet',
    description: 'Corporate-standard asset and liability report.',
    outcomeDescription: 'A professional snapshot of equity. Essential for partners and major stakeholders.',
    timeEstimate: '~12 min',
    icon: 'solar:scale-bold-duotone',
    logo: 'solar:scale-bold'
  },
  {
    type: DocumentType.CASH_FLOW_PROJECTION,
    title: 'Cash Flow Projection',
    description: '12-month forward-looking cash flow forecast.',
    outcomeDescription: 'Show lenders you can service the loan. SBA-required for most 7(a) and 504 applications.',
    timeEstimate: '~10 min',
    icon: 'solar:chart-2-bold-duotone',
    logo: 'solar:graph-new-up-bold'
  }
];

export const PFS_STEPS: StepDefinition[] = [
  { id: 'basics', title: 'Identity', description: "Who is this statement for? Start with the basics." },
  { id: 'cash', title: 'Liquid Cash', description: 'Checking, savings, and other liquid capital.' },
  { id: 'investments', title: 'Market Assets', description: 'Securities, mutual funds, and retirement.' },
  { id: 'real-estate-assets', title: 'Fixed Assets', description: 'Properties, land, and tangible holdings.' },
  { id: 'real-estate-loans', title: 'Secured Debt', description: 'Mortgages and property-linked liabilities.' },
  { id: 'other-liabilities', title: 'Unsecured Debt', description: 'Credit cards, personal loans, and other obligations.' },
  { id: 'review', title: 'Finalize', description: 'Your statement is ready. Review your net worth calculation.' }
];