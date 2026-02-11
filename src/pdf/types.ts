export type TemplateId = "minimalist" | "creative" | "traditional";

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
  currency: string;
  taxRatePct: number;
  taxLabel: string;
  taxPresetId: string;
  invoiceDiscountAmount: number;
  shippingFee: number;
  amountPaid: number;
  logoDataUrl: string;
  paymentLink: string;
  qrDataUrl?: string;
  templateId: TemplateId;
  brandColor: string;
  items: Array<{ description: string; qty: number; rate: number; discountPct: number; unitType: string }>;
};
