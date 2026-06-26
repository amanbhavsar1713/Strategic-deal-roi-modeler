import { Scenario } from "../types";
import { money, pct, months } from "../format";

interface Props {
  scenarios: Scenario[];
}

export default function ScenarioTable({ scenarios }: Props) {
  return (
    <div className="card">
      <h2>Scenario Analysis</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>ROI</th>
            <th>NPV</th>
            <th>Net Profit</th>
            <th>Payback</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.name}>
              <td>
                <strong>{s.name}</strong>
                <div className="muted" style={{ fontSize: 11.5 }}>{s.assumptions}</div>
              </td>
              <td style={{ color: s.metrics.roiPct >= 0 ? "var(--pos)" : "var(--neg)" }}>
                {pct(s.metrics.roiPct, 1)}
              </td>
              <td style={{ color: s.metrics.npv >= 0 ? "var(--pos)" : "var(--neg)" }}>
                {money(s.metrics.npv, true)}
              </td>
              <td>{money(s.metrics.netProfit, true)}</td>
              <td>{months(s.metrics.paybackMonths)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
