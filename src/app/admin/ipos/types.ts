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

export interface IPOValuation {
  eps: number;
  pe: number;
  industryPe: number;
  marketCap: number;
  ronw: number;
  nav: number;
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
  logoUrl?: string;
  description: string;
  objectsOfTheIssue: string[];
  type: IPOType | string;
  status: IPOStatus | string;

  openDate: string;
  closeDate: string;
  listingDate: string;
  timeline: IPOTimeline;

  priceBandLow: number;
  priceBandHigh: number;
  faceValue: number;
  lotSize: number;
  issueSize: number;
  freshIssueSize: number;
  offerForSaleSize: number;
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
  quota: IPOQuota;
  promoters: string[];
  promoterHolding: IPOPromoterHolding;
  financials: FinancialYear[];
  valuation: IPOValuation;
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
  priceBandLow: 0,
  priceBandHigh: 0,
  faceValue: 10,
  lotSize: 0,
  issueSize: 0,
  freshIssueSize: 0,
  offerForSaleSize: 0,
  listingAt: ['NSE', 'BSE'],
  listedPrice: 0,
  currentGmp: 0,
  gmpUpdatedAt: '',
  gmpHistory: [],
  subscriptionStatus: { qib: 0, nii: 0, retail: 0, total: 0 },
  quota: { qib: 50, nii: 15, retail: 35 },
  promoters: [],
  promoterHolding: { preIssue: 0, postIssue: 0 },
  financials: [],
  valuation: { eps: 0, pe: 0, industryPe: 0, marketCap: 0, ronw: 0, nav: 0 },
  registrar: { name: '', phone: '', email: '', website: '' },
  leadManagers: [],
  contact: { address: '', phone: '', email: '', website: '' },
  affiliateLink: '',
  customTabs: []
};
