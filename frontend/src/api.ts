import { DealInput, EvaluateResponse, SensitivityResult } from "./types";

// In dev, Vite proxies /api to the backend. In production set VITE_API_URL.
const BASE = (import.meta as any).env?.VITE_API_URL ?? "";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function fetchSampleDeals(): Promise<{ deals: DealInput[]; default: DealInput }> {
  const res = await fetch(`${BASE}/api/deals`);
  if (!res.ok) throw new Error("Failed to load sample deals");
  return res.json();
}

export function evaluateDeal(deal: DealInput): Promise<EvaluateResponse> {
  return postJson<EvaluateResponse>("/api/deals/evaluate", deal);
}

export function fetchSensitivity(
  deal: DealInput,
  variable: keyof DealInput,
  from: number,
  to: number,
  steps = 11
): Promise<SensitivityResult> {
  return postJson<SensitivityResult>("/api/deals/sensitivity", { deal, variable, from, to, steps });
}
