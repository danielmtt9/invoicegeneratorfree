export type InvoicePdfDraft = {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  from: string;
  billTo: string;
  notes: string;
  taxRatePct: number;
  items: Array<{ description: string; qty: number; rate: number }>;
};

