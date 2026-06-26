export function money(n: number, compact = false): string {
  if (!isFinite(n)) return "—";
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

export function units(n: number): string {
  if (!isFinite(n)) return "—";
  return Math.round(n).toLocaleString();
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function months(n: number | null): string {
  if (n === null) return "Never";
  return `${n.toFixed(0)} mo`;
}
