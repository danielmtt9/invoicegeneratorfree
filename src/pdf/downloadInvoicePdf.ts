import React from "react";
import QRCode from "qrcode";
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

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function downloadInvoicePdf(draft: InvoicePdfDraft) {
  let qrDataUrl: string | undefined;
  const paymentLink = (draft.paymentLink || "").trim();
  if (paymentLink && isHttpUrl(paymentLink)) {
    try {
      qrDataUrl = await QRCode.toDataURL(paymentLink, { width: 180, margin: 1 });
    } catch {
      qrDataUrl = undefined;
    }
  }

  const [{ pdf }, { InvoicePdf }] = await Promise.all([import("@react-pdf/renderer"), import("./InvoicePdf")]);
  const element = React.createElement(
    InvoicePdf as unknown as React.FC<{ draft: InvoicePdfDraft }>,
    { draft: { ...draft, qrDataUrl } }
  ) as any;
  const blob = await pdf(element).toBlob();
  const name = (draft.invoiceNo || "invoice").replace(/[^a-zA-Z0-9._-]+/g, "-");
  downloadBlob(blob, `${name}.pdf`);
}
