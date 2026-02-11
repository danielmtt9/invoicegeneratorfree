export type InvoiceLine = { qty: number; rate: number };

function safeNum(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function calcSubtotal(items: InvoiceLine[]) {
  return items.reduce((acc, it) => acc + safeNum(it.qty) * safeNum(it.rate), 0);
}

export function calcTotals(items: InvoiceLine[], taxRatePct: number) {
  const subtotal = calcSubtotal(items);
  const tax = subtotal * (safeNum(taxRatePct) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

