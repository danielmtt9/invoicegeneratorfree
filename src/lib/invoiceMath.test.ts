import { describe, expect, test } from "vitest";
import { calcTotals } from "./invoiceMath";

describe("invoiceMath", () => {
  test("calculates totals with line discounts, invoice discount, shipping, tax, and amount paid", () => {
    const totals = calcTotals({
      items: [
        { qty: 2, rate: 100, discountPct: 10 },
        { qty: 1, rate: 50, discountPct: 0 },
      ],
      taxRatePct: 10,
      invoiceDiscountAmount: 20,
      shippingFee: 15,
      amountPaid: 30,
    });

    expect(totals.lineSubtotal).toBe(250);
    expect(totals.lineDiscountTotal).toBe(20);
    expect(totals.subtotal).toBe(230);
    expect(totals.invoiceDiscountAmountApplied).toBe(20);
    expect(totals.shippingFeeApplied).toBe(15);
    expect(totals.taxableBase).toBe(225);
    expect(totals.tax).toBe(22.5);
    expect(totals.grandTotal).toBe(247.5);
    expect(totals.amountPaidApplied).toBe(30);
    expect(totals.balanceDue).toBe(217.5);
  });

  test("clamps invalid and non-finite values", () => {
    const totals = calcTotals({
      items: [
        { qty: Number.NaN, rate: 100, discountPct: 5 },
        { qty: 1, rate: Number.POSITIVE_INFINITY, discountPct: Number.NaN },
      ],
      taxRatePct: Number.NaN,
      invoiceDiscountAmount: Number.POSITIVE_INFINITY,
      shippingFee: -10,
      amountPaid: Number.POSITIVE_INFINITY,
    });

    expect(totals.lineSubtotal).toBe(0);
    expect(totals.lineDiscountTotal).toBe(0);
    expect(totals.subtotal).toBe(0);
    expect(totals.shippingFeeApplied).toBe(0);
    expect(totals.invoiceDiscountAmountApplied).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.grandTotal).toBe(0);
    expect(totals.amountPaidApplied).toBe(0);
    expect(totals.balanceDue).toBe(0);
  });

  test("caps line discount at 100% and amount paid at grand total", () => {
    const totals = calcTotals({
      items: [{ qty: 2, rate: 10, discountPct: 500 }],
      taxRatePct: 0,
      invoiceDiscountAmount: 0,
      shippingFee: 0,
      amountPaid: 999,
    });

    expect(totals.subtotal).toBe(0);
    expect(totals.grandTotal).toBe(0);
    expect(totals.amountPaidApplied).toBe(0);
    expect(totals.balanceDue).toBe(0);
  });

  test("caps invoice discount to subtotal plus shipping", () => {
    const totals = calcTotals({
      items: [{ qty: 1, rate: 100, discountPct: 0 }],
      taxRatePct: 0,
      invoiceDiscountAmount: 500,
      shippingFee: 10,
      amountPaid: 0,
    });

    expect(totals.subtotal).toBe(100);
    expect(totals.shippingFeeApplied).toBe(10);
    expect(totals.invoiceDiscountAmountApplied).toBe(110);
    expect(totals.taxableBase).toBe(0);
    expect(totals.grandTotal).toBe(0);
  });
});
