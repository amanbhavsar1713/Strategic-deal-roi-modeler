import { useEffect, useState } from "react";
import { DealInput, EvaluateResponse } from "./types";
import { fetchSampleDeals, evaluateDeal } from "./api";
import DealForm from "./components/DealForm";
import ResultsPanel from "./components/ResultsPanel";
import ScenarioTable from "./components/ScenarioTable";
import SensitivityChart from "./components/SensitivityChart";
import BusinessCase from "./components/BusinessCase";

export default function App() {
  const [samples, setSamples] = useState<DealInput[]>([]);
  const [deal, setDeal] = useState<DealInput | null>(null);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the built-in sample deals once, evaluate the default immediately.
  useEffect(() => {
    fetchSampleDeals()
      .then(({ deals, default: def }) => {
        setSamples(deals);
        setDeal(def);
        return evaluateDeal(def);
      })
      .then((r) => setResult(r))
      .catch((e) => setError(e.message ?? "Could not reach the API. Is the backend running on :4000?"));
  }, []);

  async function runEvaluate() {
    if (!deal) return;
    setLoading(true);
    setError(null);
    try {
      const r = await evaluateDeal(deal);
      setResult(r);
    } catch (e: any) {
      setError(e.message ?? "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  function loadSample(index: number) {
    const s = samples[index];
    if (s) {
      setDeal(s);
      evaluateDeal(s).then(setResult).catch((e) => setError(e.message));
    }
  }

  return (
    <div>
      <header className="appbar">
        <h1>Strategic Deal ROI Modeler</h1>
        <p>Deal-desk analytics for partner pricing, incentives &amp; investment decisions</p>
      </header>

      <div className="layout">
        <div>
          {deal && (
            <DealForm
              value={deal}
              samples={samples}
              loading={loading}
              onChange={setDeal}
              onEvaluate={runEvaluate}
              onLoadSample={loadSample}
            />
          )}
        </div>

        <div>
          {error && <div className="card"><div className="error">{error}</div></div>}

          {!result && !error && (
            <div className="card">
              <div className="muted">Loading sample deal…</div>
            </div>
          )}

          {result && (
            <>
              <ResultsPanel metrics={result.metrics} />
              <BusinessCase
                input={result.input}
                metrics={result.metrics}
                recommendation={result.recommendation}
              />
              <ScenarioTable scenarios={result.scenarios} />
              {deal && <SensitivityChart deal={deal} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
