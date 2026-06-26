import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DealInput, SensitivityResult } from "../types";
import { fetchSensitivity } from "../api";
import { pct } from "../format";

interface Props {
  deal: DealInput;
}

// Variables worth sweeping, with a human label and the unit shown on the X axis.
const SWEEP_VARS: { key: keyof DealInput; label: string; suffix: string }[] = [
  { key: "attachRatePct", label: "Attach Rate", suffix: "%" },
  { key: "perUnitIncentive", label: "Per-Unit Incentive", suffix: "$" },
  { key: "revenuePerUnit", label: "Revenue / Unit", suffix: "$" },
  { key: "grossMarginPct", label: "Gross Margin", suffix: "%" },
  { key: "committedUnits", label: "Committed Units", suffix: "" },
  { key: "discountRatePct", label: "Discount Rate", suffix: "%" },
];

export default function SensitivityChart({ deal }: Props) {
  const [variable, setVariable] = useState<keyof DealInput>("attachRatePct");
  const [result, setResult] = useState<SensitivityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sweep 60%–140% of the current value so the band adapts to any field.
  const range = useMemo(() => {
    const base = Number(deal[variable]) || 0;
    const from = base === 0 ? 0 : base * 0.6;
    const to = base === 0 ? 10 : base * 1.4;
    return { from, to };
  }, [deal, variable]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSensitivity(deal, variable, range.from, range.to, 11)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Failed to compute sensitivity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deal, variable, range.from, range.to]);

  const suffix = SWEEP_VARS.find((v) => v.key === variable)?.suffix ?? "";
  const data = (result?.points ?? []).map((p) => ({
    x: p.x,
    roi: Number(p.roiPct.toFixed(1)),
  }));
  const baseValue = Number(deal[variable]) || 0;

  return (
    <div className="card">
      <h2>Sensitivity</h2>
      <div className="field" style={{ maxWidth: 280 }}>
        <label>Sweep variable</label>
        <select value={variable} onChange={(e) => setVariable(e.target.value as keyof DealInput)}>
          {SWEEP_VARS.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && !result && <div className="muted">Computing…</div>}

      {result && (
        <>
          <div className="muted" style={{ marginBottom: 4 }}>
            ROI as {result.label} varies from {fmt(range.from, suffix)} to {fmt(range.to, suffix)}
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf2" />
                <XAxis
                  dataKey="x"
                  tick={{ fontSize: 11, fill: "#5b6783" }}
                  tickFormatter={(v) => fmt(v, suffix)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5b6783" }}
                  tickFormatter={(v) => `${v}%`}
                  width={52}
                />
                <Tooltip
                  formatter={(v: number) => [pct(v, 1), "ROI"]}
                  labelFormatter={(l) => `${result.label}: ${fmt(Number(l), suffix)}`}
                />
                <ReferenceLine x={baseValue} stroke="#9aa6c4" strokeDasharray="4 4" label={{ value: "current", fontSize: 10, fill: "#5b6783" }} />
                <Line type="monotone" dataKey="roi" stroke="#2f4bd6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function fmt(n: number, suffix: string): string {
  if (suffix === "$") {
    if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }
  if (suffix === "%") return `${n.toFixed(0)}%`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}
