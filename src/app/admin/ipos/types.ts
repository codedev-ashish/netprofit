export interface FinancialYear {
  year: string;
  revenue: number;
  expense: number;
  profit: number;
  assets: number;
  netWorth: number;
  reserves: number;
  debt: number;
}

export interface FinancialTableColumn {
  id: string;
  label: string;
}

export interface FinancialTableRow {
  id: string;
  values: Record<string, string>;
}

export interface FinancialTable {
  columns: FinancialTableColumn[];
  rows: FinancialTableRow[];
}

export interface GMPTrend {
  date: string;
  price: number;
  change: number;
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
  type?: 'text' | 'number' | 'date' | 'url';
}

export interface CustomTab {
  id: string;
  name: string;
  fields: CustomField[];
}

export enum IPOStatus {
  UPCOMING = 'Upcoming',
  OPEN = 'Open',
  CLOSED = 'Closed',
  LISTED = 'Listed'
}

export enum IPOType {
  MAINBOARD = 'Mainboard',
  SME = 'SME'
}

export interface IPOTimeline {
  openDate: string;
  closeDate: string;
  basisOfAllotment: string;
  initiationOfRefunds: string;
  creditOfShares: string;
  listingDate: string;
}

export interface IPOTimelineField {
  id: string;
  label: string;
  value: string;
}

export interface IPOIssueDetailField {
  id: string;
  label: string;
  value: string;
}

export interface IPOSubscriptionField {
  id: string;
  label: string;
  value: string;
}

export interface IPOQuotaField {
  id: string;
  label: string;
  value: string;
}

export interface IPOValuation {
  eps: number;
  pe: number;
  industryPe: number;
  marketCap: number;
  ronw: number;
  nav: number;
}

export interface IPOValuationField {
  id: string;
  label: string;
  value: string;
}

export interface IPORegistrar {
  name: string;
  phone: string;
  email: string;
  website: string;
}

export interface IPOContact {
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface IPOQuota {
  qib: number;
  nii: number;
  retail: number;
}

export interface IPOPromoterHolding {
  preIssue: number;
  postIssue: number;
}

export interface AIAnalysisResult {
  summary: string;
  verdict: 'APPLY' | 'AVOID' | 'NEUTRAL';
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface IPOData {
  id?: string;
  slug?: string;
  isVisible: boolean;
  name: string;
  symbol: string;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  customSchema?: string;
  canonicalUrl?: string;
  logoUrl?: string;
  description: string;
  objectsOfTheIssue: string[];
  type: IPOType | string;
  status: IPOStatus | string;

  openDate: string;
  closeDate: string;
  listingDate: string;
  timeline: IPOTimeline;
  timelineFields?: IPOTimelineField[];

  priceBandLow: number;
  priceBandHigh: number;
  faceValue: number;
  lotSize: number;
  issueSize: number;
  freshIssueSize: number;
  offerForSaleSize: number;
  issueDetailsFields?: IPOIssueDetailField[];
  listingAt: string[];
  listedPrice: number;

  currentGmp: number;
  gmpUpdatedAt: string;
  gmpHistory: GMPTrend[];

  subscriptionStatus: {
    qib: number;
    nii: number;
    retail: number;
    total: number;
  };
  subscriptionFields?: IPOSubscriptionField[];
  quota: IPOQuota;
  quotaFields?: IPOQuotaField[];
  promoters: string[];
  promoterHolding: IPOPromoterHolding;
  financials?: FinancialYear[];
  financialTable?: FinancialTable;
  valuation?: IPOValuation;
  valuationFields?: IPOValuationField[];
  registrar: IPORegistrar;
  leadManagers: string[];
  contact: IPOContact;

  prospectusUrl?: string;
  analysis?: AIAnalysisResult;
  pros?: string[];
  cons?: string[];
  affiliateLink?: string;
  customTabs?: CustomTab[];
}

export const DEFAULT_IPO_TEMPLATE: IPOData = {
  isVisible: true,
  name: '',
  symbol: '',
  metaTitle: '',
  metaDescription: '',
  seoKeywords: '',
  customSchema: '',
  canonicalUrl: '',
  description: '',
  objectsOfTheIssue: [],
  type: IPOType.MAINBOARD,
  status: IPOStatus.UPCOMING,
  openDate: '',
  closeDate: '',
  listingDate: '',
  timeline: {
    openDate: '',
    closeDate: '',
    basisOfAllotment: '',
    initiationOfRefunds: '',
    creditOfShares: '',
    listingDate: ''
  },
  timelineFields: [
    { id: 'openDate', label: 'Open Date', value: '' },
    { id: 'closeDate', label: 'Close Date', value: '' },
    { id: 'basisOfAllotment', label: 'Basis of Allotment', value: '' },
    { id: 'initiationOfRefunds', label: 'Initiation of Refunds', value: '' },
    { id: 'creditOfShares', label: 'Credit of Shares', value: '' },
    { id: 'listingDate', label: 'Listing Date', value: '' }
  ],
  priceBandLow: 0,
  priceBandHigh: 0,
  faceValue: 10,
  lotSize: 0,
  issueSize: 0,
  freshIssueSize: 0,
  offerForSaleSize: 0,
  issueDetailsFields: [
    { id: 'priceBandLow', label: 'Price Band Low', value: '' },
    { id: 'priceBandHigh', label: 'Price Band High', value: '' },
    { id: 'faceValue', label: 'Face Value', value: '' },
    { id: 'lotSize', label: 'Lot Size', value: '' },
    { id: 'issueSize', label: 'Issue Size (Cr)', value: '' },
    { id: 'listedPrice', label: 'Listed Price (₹)', value: '' }
  ],
  listingAt: ['NSE', 'BSE'],
  listedPrice: 0,
  currentGmp: 0,
  gmpUpdatedAt: '',
  gmpHistory: [],
  subscriptionStatus: { qib: 0, nii: 0, retail: 0, total: 0 },
  subscriptionFields: [
    { id: 'qib', label: 'QIB Sub', value: '' },
    { id: 'nii', label: 'NII Sub', value: '' },
    { id: 'retail', label: 'Retail Sub', value: '' },
    { id: 'total', label: 'Total Sub', value: '' }
  ],
  quota: { qib: 50, nii: 15, retail: 35 },
  quotaFields: [
    { id: 'qibQuota', label: 'QIB Quota (%)', value: '' },
    { id: 'niiQuota', label: 'NII Quota (%)', value: '' },
    { id: 'retailQuota', label: 'Retail Quota (%)', value: '' }
  ],
  promoters: [],
  promoterHolding: { preIssue: 0, postIssue: 0 },
  financials: [],
  financialTable: {
    columns: [
      { id: 'year', label: 'Year' },
      { id: 'revenue', label: 'Revenue (Cr)' },
      { id: 'expense', label: 'Expense (Cr)' },
      { id: 'profit', label: 'Profit (Cr)' },
      { id: 'assets', label: 'Assets (Cr)' },
      { id: 'networth', label: 'Net Worth (Cr)' }
    ],
    rows: []
  },
  valuationFields: [
    { id: 'eps', label: 'EPS', value: '' },
    { id: 'pe', label: 'P/E Ratio', value: '' },
    { id: 'industryPe', label: 'Industry P/E', value: '' },
    { id: 'marketCap', label: 'Market Cap (Cr)', value: '' },
    { id: 'ronw', label: 'RONW (%)', value: '' },
    { id: 'nav', label: 'NAV', value: '' }
  ],
  registrar: { name: '', phone: '', email: '', website: '' },
  leadManagers: [],
  contact: { address: '', phone: '', email: '', website: '' },
  affiliateLink: '',
  customTabs: []
};
