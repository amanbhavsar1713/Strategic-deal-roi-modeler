import { useState } from "react";
import { DealInput, PartnerCategory, Region, DealType } from "../types";

interface Props {
  value: DealInput;
  samples: DealInput[];
  loading: boolean;
  onChange: (deal: DealInput) => void;
  onEvaluate: () => void;
  onLoadSample: (index: number) => void;
}

const CATEGORIES: PartnerCategory[] = ["OEM", "ODM", "Silicon", "Distribution"];
const REGIONS: Region[] = ["Americas", "EMEA", "APAC", "Greater China"];
const DEAL_TYPES: DealType[] = ["Volume Incentive", "Co-Marketing", "Strategic Investment", "Rebate Program"];

export default function DealForm({ value, samples, loading, onChange, onEvaluate, onLoadSample }: Props) {
  const [sampleIdx, setSampleIdx] = useState(0);

  const num = (field: keyof DealInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: Number(e.target.value) });

  const text = (field: keyof DealInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <div className="card">
      <h2>Deal Inputs</h2>

      <div className="field">
        <div className="row-flex" style={{ justifyContent: "space-between" }}>
          <label style={{ margin: 0 }}>Load a sample deal</label>
        </div>
        <div className="row-flex" style={{ marginTop: 6 }}>
          <select
            value={sampleIdx}
            onChange={(e) => setSampleIdx(Number(e.target.value))}
            style={{ flex: 1 }}
          >
            {samples.map((d, i) => (
              <option key={i} value={i}>{d.dealName}</option>
            ))}
          </select>
          <button className="btn" style={{ width: "auto", padding: "9px 14px" }} onClick={() => onLoadSample(sampleIdx)}>
            Load
          </button>
        </div>
      </div>

      <div className="field">
        <label>Deal name</label>
        <input value={value.dealName} onChange={text("dealName")} />
      </div>
      <div className="field">
        <label>Partner</label>
        <input value={value.partnerName} onChange={text("partnerName")} />
      </div>

      <div className="grid2">
        <div className="field">
          <label>Category</label>
          <select value={value.partnerCategory} onChange={text("partnerCategory")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Region</label>
          <select value={value.region} onChange={text("region")}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Deal type</label>
        <select value={value.dealType} onChange={text("dealType")}>
          {DEAL_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Term (months)</label>
          <input type="number" value={value.termMonths} onChange={num("termMonths")} />
        </div>
        <div className="field">
          <label>Ramp (months)</label>
          <input type="number" value={value.rampMonths} onChange={num("rampMonths")} />
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Committed units</label>
          <input type="number" value={value.committedUnits} onChange={num("committedUnits")} />
        </div>
        <div className="field">
          <label>Attach rate (%)</label>
          <input type="number" value={value.attachRatePct} onChange={num("attachRatePct")} />
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Revenue / unit ($)</label>
          <input type="number" value={value.revenuePerUnit} onChange={num("revenuePerUnit")} />
        </div>
        <div className="field">
          <label>Gross margin (%)</label>
          <input type="number" value={value.grossMarginPct} onChange={num("grossMarginPct")} />
        </div>
      </div>

      <div className="field">
        <label>Upfront investment ($)</label>
        <input type="number" value={value.upfrontInvestment} onChange={num("upfrontInvestment")} />
      </div>

      <div className="grid2">
        <div className="field">
          <label>Per-unit incentive ($)</label>
          <input type="number" value={value.perUnitIncentive} onChange={num("perUnitIncentive")} />
        </div>
        <div className="field">
          <label>Fixed annual ($)</label>
          <input type="number" value={value.fixedAnnualIncentive} onChange={num("fixedAnnualIncentive")} />
        </div>
      </div>

      <div className="field">
        <label>Discount rate (%)</label>
        <input type="number" value={value.discountRatePct} onChange={num("discountRatePct")} />
      </div>

      <button className="btn" onClick={onEvaluate} disabled={loading}>
        {loading ? "Evaluating…" : "Evaluate Deal"}
      </button>
    </div>
  );
}
