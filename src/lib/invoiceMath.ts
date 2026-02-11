export type InvoiceLine = { qty: number; rate: number; discountPct: number };

export type TotalsInput = {
  items: InvoiceLine[];
  taxRatePct: number;
  invoiceDiscountAmount: number;
  shippingFee: number;
  amountPaid: number;
};

export type TotalsOutput = {
  lineSubtotal: number;
  lineDiscountTotal: number;
  subtotal: number;
  invoiceDiscountAmountApplied: number;
  shippingFeeApplied: number;
  taxableBase: number;
  tax: number;
  grandTotal: number;
  amountPaidApplied: number;
  balanceDue: number;
};

function safeNum(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function calcTotals(input: TotalsInput): TotalsOutput {
  const lineParts = input.items.map((it) => {
    const qty = safeNum(it.qty);
    const rate = safeNum(it.rate);
    const lineAmount = qty * rate;
    const discountPct = clamp(safeNum(it.discountPct), 0, 100);
    const lineDiscount = lineAmount * (discountPct / 100);
    return { lineAmount, lineDiscount };
  });

  const lineSubtotal = lineParts.reduce((acc, p) => acc + p.lineAmount, 0);
  const lineDiscountTotal = lineParts.reduce((acc, p) => acc + p.lineDiscount, 0);
  const subtotal = lineSubtotal - lineDiscountTotal;

  const shippingFeeApplied = Math.max(0, safeNum(input.shippingFee));
  const discountCap = Math.max(0, subtotal + shippingFeeApplied);
  const invoiceDiscountAmountApplied = clamp(safeNum(input.invoiceDiscountAmount), 0, discountCap);

  const taxableBase = subtotal - invoiceDiscountAmountApplied + shippingFeeApplied;
  const taxRatePct = Math.max(0, safeNum(input.taxRatePct));
  const tax = taxableBase * (taxRatePct / 100);
  const grandTotal = taxableBase + tax;

  const amountPaidApplied = clamp(safeNum(input.amountPaid), 0, Math.max(0, grandTotal));
  const balanceDue = grandTotal - amountPaidApplied;

  return {
    lineSubtotal,
    lineDiscountTotal,
    subtotal,
    invoiceDiscountAmountApplied,
    shippingFeeApplied,
    taxableBase,
    tax,
    grandTotal,
    amountPaidApplied,
    balanceDue,
  };
}
