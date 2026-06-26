import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DealMetrics } from "../types";
import { money, units, pct, months } from "../format";

interface Props {
  metrics: DealMetrics;
}

export default function ResultsPanel({ metrics }: Props) {
  const cashData = metrics.cumulativeCashFlows.map((v, i) => ({
    month: i,
    cumulative: Math.round(v),
  }));

  const roiClass = metrics.roiPct >= 0 ? "pos" : "neg";
  const npvClass = metrics.npv >= 0 ? "pos" : "neg";
  const netClass = metrics.netProfit >= 0 ? "pos" : "neg";

  return (
    <div className="card">
      <h2>Deal Economics</h2>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Return on Investment</div>
          <div className={`value ${roiClass}`}>{pct(metrics.roiPct, 1)}</div>
          <div className="sub">Net profit ÷ total incentive spend</div>
        </div>
        <div className="kpi">
          <div className="label">Net Present Value</div>
          <div className={`value ${npvClass}`}>{money(metrics.npv, true)}</div>
          <div className="sub">Discounted to today</div>
        </div>
        <div className="kpi">
          <div className="label">IRR</div>
          <div className="value">{metrics.irrPct === null ? "—" : pct(metrics.irrPct, 0)}</div>
          <div className="sub">Annualized</div>
        </div>
        <div className="kpi">
          <div className="label">Payback Period</div>
          <div className="value">{months(metrics.paybackMonths)}</div>
          <div className="sub">Time to recover spend</div>
        </div>
        <div className="kpi">
          <div className="label">Net Profit</div>
          <div className={`value ${netClass}`}>{money(metrics.netProfit, true)}</div>
          <div className="sub">After all incentives</div>
        </div>
        <div className="kpi">
          <div className="label">Break-even Units</div>
          <div className="value">{units(metrics.breakEvenUnits)}</div>
          <div className="sub">Units to cover spend</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="muted" style={{ marginBottom: 4 }}>
          Cumulative cash flow over the {cashData.length - 1}-month term
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashData} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f4bd6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2f4bd6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf2" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#5b6783" }}
                label={{ value: "Month", position: "insideBottom", offset: -2, fontSize: 11, fill: "#5b6783" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#5b6783" }}
                tickFormatter={(v) => money(v, true)}
                width={70}
              />
              <Tooltip
                formatter={(v: number) => [money(v), "Cumulative"]}
                labelFormatter={(l) => `Month ${l}`}
              />
              <ReferenceLine y={0} stroke="#9aa6c4" strokeWidth={1} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#2f4bd6"
                strokeWidth={2}
                fill="url(#cashFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
