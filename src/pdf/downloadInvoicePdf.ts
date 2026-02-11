import React from "react";
import type { InvoicePdfDraft } from "./types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(draft: InvoicePdfDraft) {
  // Lazy-load the heavy PDF renderer only when needed to keep initial bundle small.
  const [{ pdf }, { InvoicePdf }] = await Promise.all([import("@react-pdf/renderer"), import("./InvoicePdf")]);
  // @react-pdf/renderer types expect a <Document/> element; our component returns <Document/>.
  // Cast to keep the call site simple.
  const element = React.createElement(InvoicePdf as unknown as React.FC<{ draft: InvoicePdfDraft }>, { draft }) as any;
  const blob = await pdf(element).toBlob();
  const name = (draft.invoiceNo || "invoice").replace(/[^a-zA-Z0-9._-]+/g, "-");
  downloadBlob(blob, `${name}.pdf`);
}
