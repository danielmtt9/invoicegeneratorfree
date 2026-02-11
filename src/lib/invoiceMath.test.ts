import { describe, expect, test } from "vitest";
import { calcTotals } from "./invoiceMath";

describe("invoiceMath", () => {
  test("calculates totals with tax", () => {
    const { subtotal, tax, total } = calcTotals(
      [
        { qty: 2, rate: 10 },
        { qty: 1, rate: 5 }
      ],
      10
    );
    expect(subtotal).toBe(25);
    expect(tax).toBe(2.5);
    expect(total).toBe(27.5);
  });

  test("treats non-finite numbers as 0", () => {
    const { subtotal } = calcTotals(
      // Intentionally pass non-finite values to confirm sanitization.
      [{ qty: Number.NaN, rate: 100 }, { qty: 1, rate: Number.POSITIVE_INFINITY }],
      0
    );
    expect(subtotal).toBe(0);
  });
});
