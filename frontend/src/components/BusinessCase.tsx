import { DealInput, DealMetrics, Recommendation } from "../types";
import { money, pct, months } from "../format";

interface Props {
  input: DealInput;
  metrics: DealMetrics;
  recommendation: Recommendation;
}

const BADGE_CLASS: Record<Recommendation["decision"], string> = {
  Approve: "approve",
  "Approve with conditions": "conditions",
  Revise: "revise",
};

export default function BusinessCase({ input, metrics, recommendation }: Props) {
  const t = recommendation.thresholds;

  return (
    <div className="card">
      <h2>Business Case</h2>

      <div className="rec">
        <span className={`badge ${BADGE_CLASS[recommendation.decision]}`}>
          {recommendation.decision}
        </span>
        <span className="muted">
          Hurdles: ROI ≥ {pct(t.minRoiPct, 0)} · NPV ≥ {money(t.minNpv, true)} · Payback ≤{" "}
          {t.maxPaybackMonths.toFixed(0)} mo
        </span>
      </div>

      <ul className="rationale">
        {recommendation.rationale.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <div style={{ marginTop: 14 }}>
        <span className="tag">{input.partnerCategory}</span>
        <span className="tag">{input.region}</span>
        <span className="tag">{input.dealType}</span>
      </div>

      <p className="summary-text" style={{ marginTop: 14 }}>
        Over a {input.termMonths}-month term, the proposed {input.dealType.toLowerCase()} with{" "}
        <strong>{input.partnerName}</strong> commits {input.committedUnits.toLocaleString()} units at{" "}
        {money(input.revenuePerUnit)} per unit and a {pct(input.attachRatePct, 0)} attach rate,
        generating <strong>{money(metrics.grossRevenue, true)}</strong> in gross revenue and{" "}
        <strong>{money(metrics.grossProfit, true)}</strong> in gross profit. Total incentive spend of{" "}
        {money(metrics.totalIncentiveCost, true)} yields a net profit of{" "}
        <strong>{money(metrics.netProfit, true)}</strong>, a{" "}
        <strong>{pct(metrics.roiPct, 1)}</strong> ROI, and an NPV of{" "}
        <strong>{money(metrics.npv, true)}</strong> at a {pct(input.discountRatePct, 0)} discount
        rate. The deal recovers its incentive outlay in {months(metrics.paybackMonths)}.
      </p>
    </div>
  );
}
