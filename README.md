# Strategic Deal ROI Modeler

A deal-desk web application for evaluating strategic partner deals — the kind of pricing,
incentive, and investment decisions a hardware-partner sales organization makes every day.
Enter a proposed deal (committed units, attach rate, revenue/unit, margin, and the incentive
stack) and the app returns full deal economics, scenario analysis, one-way sensitivity, and an
auto-generated business case with an approve / revise recommendation against funding hurdles.

Built as a portfolio project to demonstrate the analytics behind **Pricing, Strategic Deals &
Investments**: NPV / IRR / ROI / payback modeling, scenario and sensitivity analysis, and
turning numbers into an executive-ready recommendation.

## What it does

- **Deal economics** — gross revenue, gross profit, total incentive cost, net profit, ROI, NPV,
  IRR, payback period, and break-even units, with a cumulative cash-flow chart across the term.
- **Scenario analysis** — worst / base / best cases with volume, attach-rate, and margin shocks.
- **Sensitivity** — sweep any driver (attach rate, per-unit incentive, revenue/unit, margin,
  committed units, discount rate) and see ROI respond on a live chart.
- **Business case** — a recommendation (Approve / Approve with conditions / Revise) measured
  against ROI, NPV, and payback hurdles, plus a written deal summary.
- **Sample deals** — four fictional partner deals are bundled so the app is useful on first load.

## Tech stack

| Layer    | Stack                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Recharts, plain CSS             |
| Backend  | Node.js, Express, TypeScript                                |
| Shared   | A typed request/response contract mirrored on both sides    |

All financial math lives in `backend/src/lib/finance.ts` and is pure and unit-testable.

## Project structure

```
strategic-deal-roi-modeler/
├── backend/          Express + TypeScript API (deal evaluation, scenarios, sensitivity)
│   └── src/
│       ├── data/     Bundled sample deals
│       ├── lib/      finance.ts — NPV, IRR, payback, scenarios, recommendation
│       ├── routes/   /api/deals endpoints
│       ├── types.ts  Shared contract
│       └── server.ts
└── frontend/         React + Vite client
    └── src/
        ├── components/  DealForm, ResultsPanel, ScenarioTable, SensitivityChart, BusinessCase
        ├── api.ts       Typed fetch wrappers
        ├── format.ts    Money / units / percent formatters
        └── App.tsx
```

## Running locally

Open two terminals.

**1. Backend** (http://localhost:4000)

```bash
cd backend
npm install
npm run dev
```

**2. Frontend** (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend, so no extra configuration is needed. Open
http://localhost:5173 and the default sample deal is evaluated automatically.

To point the frontend at a deployed API instead of the proxy, set `VITE_API_URL`
(e.g. `VITE_API_URL=https://my-api.example.com`).

## API

| Method | Path                    | Body                              | Returns                                  |
| ------ | ----------------------- | --------------------------------- | ---------------------------------------- |
| GET    | `/api/health`           | —                                 | `{ ok: true }`                           |
| GET    | `/api/deals`            | —                                 | `{ deals, default }`                     |
| POST   | `/api/deals/evaluate`   | `DealInput`                       | `{ input, metrics, scenarios, recommendation }` |
| POST   | `/api/deals/sensitivity`| `{ deal, variable, from, to, steps }` | `{ variable, label, points }`       |

## Notes

All companies, partners, and figures in the sample data are fictional and for demonstration only.
