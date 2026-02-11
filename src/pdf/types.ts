export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "INR" | "JPY";

export type InvoicePdfDraft = {
  invoiceNo: string;
  poNo: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  from: string;
  billTo: string;
  notes: string;
  bankDetails: string;
  currency: CurrencyCode;
  taxRatePct: number;
  invoiceDiscountAmount: number;
  shippingFee: number;
  amountPaid: number;
  logoDataUrl: string;
  items: Array<{ description: string; qty: number; rate: number; discountPct: number }>;
};
