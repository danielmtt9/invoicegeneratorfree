export type InvoiceSequenceState = {
  lastInvoiceNo: string;
  nextInvoiceNo: string;
};

export function suggestNextInvoiceNo(current: string): string {
  const s = (current || "").trim();
  if (!s) return "INV-0001";
  const m = s.match(/^(.*?)(\d+)([^\d]*)$/);
  if (!m) return `${s}-1`;
  const prefix = m[1] || "";
  const digits = m[2] || "0";
  const suffix = m[3] || "";
  const next = String(Number(digits) + 1).padStart(digits.length, "0");
  return `${prefix}${next}${suffix}`;
}
