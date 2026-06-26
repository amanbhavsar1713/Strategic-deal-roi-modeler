import {
  DealInput,
  DealMetrics,
  Scenario,
  SensitivityResult,
  Recommendation,
} from "../types";

/** Net Present Value of a cash-flow series given a per-period rate. */
export function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

/**
 * Internal Rate of Return (per period) via bisection.
 * Returns null when there is no sign change (IRR undefined).
 */
export function irr(cashFlows: number[]): number | null {
  const hasPos = cashFlows.some((c) => c > 0);
  const hasNeg = cashFlows.some((c) => c < 0);
  if (!hasPos || !hasNeg) return null;

  let lo = -0.9999;
  let hi = 1.0;
  let fLo = npv(lo, cashFlows);
  let fHi = npv(hi, cashFlows);

  // Expand the upper bound until we bracket a root (or give up).
  let guard = 0;
  while (fLo * fHi > 0 && hi < 1000 && guard < 500) {
    hi *= 1.5;
    fHi = npv(hi, cashFlows);
    guard += 1;
  }
  if (fLo * fHi > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, cashFlows);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Payback period in months from a cumulative cash-flow array
 * (index 0 = t0). Linear interpolation within the crossing month.
 */
export function paybackPeriod(cumulative: number[]): number | null {
  if (cumulative.length > 0 && cumulative[0] >= 0) return 0;
  for (let t = 1; t < cumulative.length; t++) {
    if (cumulative[t] >= 0 && cumulative[t - 1] < 0) {
      const prev = cumulative[t - 1];
      const delta = cumulative[t] - prev;
      const frac = delta === 0 ? 0 : -prev / delta;
      return t - 1 + frac;
    }
  }
  return null;
}

/**
 * Monthly volume weights that sum to 1: linear ramp for `rampMonths`,
 * then flat at full run-rate for the remainder of the term.
 */
function rampWeights(rampMonths: number, termMonths: number): number[] {
  const raw: number[] = [];
  const ramp = Math.max(1, Math.min(rampMonths, termMonths));
  for (let m = 1; m <= termMonths; m++) {
    raw.push(m <= ramp ? m / ramp : 1);
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((x) => x / sum);
}

/** Core deal evaluation: returns full metrics including time-phased cash flows. */
export function evaluateDeal(d: DealInput): DealMetrics {
  const years = d.termMonths / 12;
  const attachFrac = d.attachRatePct / 100;
  const marginFrac = d.grossMarginPct / 100;

  const attachedUnits = d.committedUnits * attachFrac;
  const grossRevenue = attachedUnits * d.revenuePerUnit;
  const grossProfit = grossRevenue * marginFrac;

  const variableIncentive = d.perUnitIncentive * d.committedUnits;
  const fixedIncentive = d.fixedAnnualIncentive * years;
  const totalIncentiveCost = d.upfrontInvestment + variableIncentive + fixedIncentive;

  const netProfit = grossProfit - totalIncentiveCost;
  const roi = totalIncentiveCost > 0 ? netProfit / totalIncentiveCost : 0;

  // --- time-phased monthly cash flows ---
  const weights = rampWeights(d.rampMonths, d.termMonths);
  const monthlyRate = Math.pow(1 + d.discountRatePct / 100, 1 / 12) - 1;
  const monthlyFixedIncentive = fixedIncentive / d.termMonths;

  const flows: number[] = [-d.upfrontInvestment]; // t0 outflow
  for (let m = 0; m < d.termMonths; m++) {
    const unitsThisMonth = d.committedUnits * weights[m];
    const gpThisMonth = unitsThisMonth * attachFrac * d.revenuePerUnit * marginFrac;
    const varIncThisMonth = unitsThisMonth * d.perUnitIncentive;
    flows.push(gpThisMonth - varIncThisMonth - monthlyFixedIncentive);
  }

  const cumulative: number[] = [];
  flows.reduce((acc, f) => {
    const c = acc + f;
    cumulative.push(c);
    return c;
  }, 0);

  const npvValue = npv(monthlyRate, flows);
  const irrMonthly = irr(flows);
  const irrAnnualPct = irrMonthly === null ? null : (Math.pow(1 + irrMonthly, 12) - 1) * 100;
  const payback = paybackPeriod(cumulative);

  // Break-even committed units holding per-unit economics constant:
  //   net(V) = V * (attach*rev*margin - perUnitIncentive) - (upfront + fixedIncentive)
  const perUnitContribution = attachFrac * d.revenuePerUnit * marginFrac - d.perUnitIncentive;
  const breakEvenUnits =
    perUnitContribution > 0
      ? (d.upfrontInvestment + fixedIncentive) / perUnitContribution
      : Infinity;

  return {
    grossRevenue,
    grossProfit,
    totalIncentiveCost,
    netProfit,
    roi,
    roiPct: roi * 100,
    npv: npvValue,
    irrPct: irrAnnualPct,
    paybackMonths: payback,
    breakEvenUnits,
    monthlyCashFlows: flows,
    cumulativeCashFlows: cumulative,
  };
}

/** Worst / base / best scenarios by flexing volume, attach and margin. */
export function runScenarios(base: DealInput): Scenario[] {
  const worst: DealInput = {
    ...base,
    committedUnits: base.committedUnits * 0.8,
    attachRatePct: base.attachRatePct * 0.8,
    grossMarginPct: base.grossMarginPct * 0.9,
  };
  const best: DealInput = {
    ...base,
    committedUnits: base.committedUnits * 1.15,
    attachRatePct: Math.min(100, base.attachRatePct * 1.1),
    grossMarginPct: Math.min(100, base.grossMarginPct * 1.05),
  };
  return [
    { name: "Worst", assumptions: "-20% volume, -20% attach, -10% margin", metrics: evaluateDeal(worst) },
    { name: "Base", assumptions: "As entered", metrics: evaluateDeal(base) },
    { name: "Best", assumptions: "+15% volume, +10% attach, +5% margin", metrics: evaluateDeal(best) },
  ];
}

const VARIABLE_LABELS: Record<string, string> = {
  attachRatePct: "Attach rate (%)",
  perUnitIncentive: "Per-unit incentive ($)",
  revenuePerUnit: "Revenue per unit ($)",
  grossMarginPct: "Gross margin (%)",
  committedUnits: "Committed units",
  upfrontInvestment: "Upfront investment ($)",
};

/** One-way sensitivity sweep of a single numeric input across a range. */
export function sensitivity(
  base: DealInput,
  variable: keyof DealInput,
  from: number,
  to: number,
  steps = 11
): SensitivityResult {
  const points = [];
  const span = steps > 1 ? (to - from) / (steps - 1) : 0;
  for (let i = 0; i < steps; i++) {
    const val = from + span * i;
    const d = { ...base, [variable]: val } as DealInput;
    const m = evaluateDeal(d);
    points.push({ x: Math.round(val * 100) / 100, roiPct: m.roiPct, npv: m.npv });
  }
  return { variable: String(variable), label: VARIABLE_LABELS[String(variable)] ?? String(variable), points };
}

/** Deal-desk recommendation against ROI / NPV / payback hurdles. */
export function recommend(d: DealInput, m: DealMetrics, scenarios: Scenario[]): Recommendation {
  const thresholds = { minRoiPct: 25, minNpv: 0, maxPaybackMonths: d.termMonths * 0.75 };
  const rationale: string[] = [];

  const roiPass = m.roiPct >= thresholds.minRoiPct;
  rationale.push(
    roiPass
      ? `ROI of ${m.roiPct.toFixed(0)}% clears the ${thresholds.minRoiPct}% hurdle.`
      : `ROI of ${m.roiPct.toFixed(0)}% is below the ${thresholds.minRoiPct}% hurdle.`
  );

  const npvPass = m.npv >= thresholds.minNpv;
  rationale.push(
    npvPass
      ? `NPV is positive at $${Math.round(m.npv).toLocaleString()}.`
      : `NPV is negative at $${Math.round(m.npv).toLocaleString()}.`
  );

  const paybackPass = m.paybackMonths !== null && m.paybackMonths <= thresholds.maxPaybackMonths;
  rationale.push(
    m.paybackMonths === null
      ? "Deal does not pay back within the term."
      : paybackPass
      ? `Payback in ${m.paybackMonths.toFixed(0)} months is inside the ${thresholds.maxPaybackMonths.toFixed(0)}-month limit.`
      : `Payback of ${m.paybackMonths.toFixed(0)} months exceeds the ${thresholds.maxPaybackMonths.toFixed(0)}-month limit.`
  );

  const worst = scenarios.find((s) => s.name === "Worst");
  const worstProfitable = worst ? worst.metrics.netProfit >= 0 : true;
  rationale.push(
    worstProfitable
      ? "Remains profitable even in the worst-case scenario."
      : "Turns unprofitable in the worst-case scenario — downside is material."
  );

  let decision: Recommendation["decision"];
  const corePass = roiPass && npvPass && paybackPass;
  if (corePass && worstProfitable) decision = "Approve";
  else if (corePass && !worstProfitable) decision = "Approve with conditions";
  else decision = "Revise";

  return { decision, rationale, thresholds };
}
