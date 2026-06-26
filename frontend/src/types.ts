// Types mirror the backend contract.

export type PartnerCategory = "OEM" | "ODM" | "Silicon" | "Distribution";
export type Region = "Americas" | "EMEA" | "APAC" | "Greater China";
export type DealType =
  | "Volume Incentive"
  | "Co-Marketing"
  | "Strategic Investment"
  | "Rebate Program";

export interface DealInput {
  dealName: string;
  partnerName: string;
  partnerCategory: PartnerCategory;
  region: Region;
  dealType: DealType;
  termMonths: number;
  rampMonths: number;
  committedUnits: number;
  attachRatePct: number;
  revenuePerUnit: number;
  grossMarginPct: number;
  upfrontInvestment: number;
  perUnitIncentive: number;
  fixedAnnualIncentive: number;
  discountRatePct: number;
}

export interface DealMetrics {
  grossRevenue: number;
  grossProfit: number;
  totalIncentiveCost: number;
  netProfit: number;
  roi: number;
  roiPct: number;
  npv: number;
  irrPct: number | null;
  paybackMonths: number | null;
  breakEvenUnits: number;
  monthlyCashFlows: number[];
  cumulativeCashFlows: number[];
}

export interface Scenario {
  name: string;
  assumptions: string;
  metrics: DealMetrics;
}

export interface Recommendation {
  decision: "Approve" | "Approve with conditions" | "Revise";
  rationale: string[];
  thresholds: { minRoiPct: number; minNpv: number; maxPaybackMonths: number };
}

export interface EvaluateResponse {
  input: DealInput;
  metrics: DealMetrics;
  scenarios: Scenario[];
  recommendation: Recommendation;
}

export interface SensitivityPoint {
  x: number;
  roiPct: number;
  npv: number;
}

export interface SensitivityResult {
  variable: string;
  label: string;
  points: SensitivityPoint[];
}
