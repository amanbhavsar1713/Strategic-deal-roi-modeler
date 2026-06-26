import { Router, Request, Response } from "express";
import { DealInput, EvaluateResponse } from "../types";
import { evaluateDeal, runScenarios, recommend, sensitivity } from "../lib/finance";
import { sampleDeals, defaultDeal } from "../data/sampleDeals";

const router = Router();

const REQUIRED_NUMERIC: (keyof DealInput)[] = [
  "termMonths",
  "rampMonths",
  "committedUnits",
  "attachRatePct",
  "revenuePerUnit",
  "grossMarginPct",
  "upfrontInvestment",
  "perUnitIncentive",
  "fixedAnnualIncentive",
  "discountRatePct",
];

function validateDeal(body: any): string | null {
  if (!body || typeof body !== "object") return "Request body must be a deal object.";
  for (const key of REQUIRED_NUMERIC) {
    const v = body[key];
    if (typeof v !== "number" || Number.isNaN(v)) return `Field "${key}" must be a number.`;
    if (v < 0) return `Field "${key}" cannot be negative.`;
  }
  if (body.termMonths < 1) return "termMonths must be at least 1.";
  if (body.attachRatePct > 100) return "attachRatePct cannot exceed 100.";
  if (body.grossMarginPct > 100) return "grossMarginPct cannot exceed 100.";
  return null;
}

/** List the built-in sample deals. */
router.get("/", (_req: Request, res: Response) => {
  res.json({ deals: sampleDeals, default: defaultDeal });
});

/** Full evaluation: metrics + scenarios + recommendation. */
router.post("/evaluate", (req: Request, res: Response) => {
  const error = validateDeal(req.body);
  if (error) return res.status(400).json({ error });

  const input = req.body as DealInput;
  const metrics = evaluateDeal(input);
  const scenarios = runScenarios(input);
  const recommendation = recommend(input, metrics, scenarios);

  const response: EvaluateResponse = { input, metrics, scenarios, recommendation };
  res.json(response);
});

/** One-way sensitivity sweep of a single variable. */
router.post("/sensitivity", (req: Request, res: Response) => {
  const { deal, variable, from, to, steps } = req.body ?? {};
  const error = validateDeal(deal);
  if (error) return res.status(400).json({ error });
  if (typeof variable !== "string" || !(variable in deal)) {
    return res.status(400).json({ error: `Unknown variable "${variable}".` });
  }
  if (typeof from !== "number" || typeof to !== "number") {
    return res.status(400).json({ error: "from and to must be numbers." });
  }
  const result = sensitivity(deal as DealInput, variable as keyof DealInput, from, to, steps ?? 11);
  res.json(result);
});

export default router;
