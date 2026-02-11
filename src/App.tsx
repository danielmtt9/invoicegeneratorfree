import React, { useMemo, useState } from "react";
import { downloadInvoicePdf } from "./pdf/downloadInvoicePdf";
import type { CurrencyCode } from "./pdf/types";
import { track } from "./lib/track";
import { calcTotals } from "./lib/invoiceMath";

type LineItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
  discountPct: number;
};

type InvoiceDraft = {
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
  items: LineItem[];
};

const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];
const LOGO_STORAGE_KEY = "invoice.logoDataUrl";
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg"]);

function money(n: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

function todayISO() {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function createDefaultDraft(logoDataUrl = ""): InvoiceDraft {
  return {
    invoiceNo: "INV-0001",
    poNo: "",
    issueDate: todayISO(),
    dueDate: todayISO(),
    paymentTerms: "Payment due within 15 days",
    from: "Your Company\nStreet\nCity, State ZIP",
    billTo: "Client Name\nStreet\nCity, State ZIP",
    notes: "Thanks for your business.",
    bankDetails: "Bank name\nAccount name\nAccount number / IBAN\nRouting / SWIFT",
    currency: "USD",
    taxRatePct: 0,
    invoiceDiscountAmount: 0,
    shippingFee: 0,
    amountPaid: 0,
    logoDataUrl,
    items: [{ id: uid(), description: "Service or product", qty: 1, rate: 100, discountPct: 0 }],
  };
}

function loadStoredLogo() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(LOGO_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function lineNetAmount(item: LineItem) {
  const qty = Number.isFinite(item.qty) ? item.qty : 0;
  const rate = Number.isFinite(item.rate) ? item.rate : 0;
  const discountPctRaw = Number.isFinite(item.discountPct) ? item.discountPct : 0;
  const discountPct = Math.min(100, Math.max(0, discountPctRaw));
  const base = qty * rate;
  return base - base * (discountPct / 100);
}

export default function App() {
  const [draft, setDraft] = useState<InvoiceDraft>(() => createDefaultDraft(loadStoredLogo()));
  const [logoError, setLogoError] = useState("");

  const totals = useMemo(
    () =>
      calcTotals({
        items: draft.items,
        taxRatePct: draft.taxRatePct,
        invoiceDiscountAmount: draft.invoiceDiscountAmount,
        shippingFee: draft.shippingFee,
        amountPaid: draft.amountPaid,
      }),
    [draft.items, draft.taxRatePct, draft.invoiceDiscountAmount, draft.shippingFee, draft.amountPaid]
  );

  function update<K extends keyof InvoiceDraft>(k: K, v: InvoiceDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setDraft((d) => ({
      ...d,
      items: [...d.items, { id: uid(), description: "", qty: 1, rate: 0, discountPct: 0 }],
    }));
  }

  function removeItem(id: string) {
    setDraft((d) => ({ ...d, items: d.items.filter((it) => it.id !== id) }));
  }

  function clearLogo() {
    try {
      window.localStorage.removeItem(LOGO_STORAGE_KEY);
    } catch {
      // Ignore storage failures; keep in-memory state consistent.
    }
    setDraft((d) => ({ ...d, logoDataUrl: "" }));
    setLogoError("");
  }

  async function handleLogoChange(file: File | null) {
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      setLogoError("Use a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError("Logo must be 5MB or smaller.");
      return;
    }

    let dataUrl = "";
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.readAsDataURL(file);
      });
    } catch {
      setLogoError("Failed to load logo file.");
      return;
    }

    if (!dataUrl) {
      setLogoError("Failed to load logo file.");
      return;
    }

    try {
      window.localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
    } catch {
      // Keep working even if storage is unavailable.
    }
    setDraft((d) => ({ ...d, logoDataUrl: dataUrl }));
    setLogoError("");
  }

  async function downloadPDF() {
    await downloadInvoicePdf({
      invoiceNo: draft.invoiceNo,
      poNo: draft.poNo,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      paymentTerms: draft.paymentTerms,
      from: draft.from,
      billTo: draft.billTo,
      notes: draft.notes,
      bankDetails: draft.bankDetails,
      currency: draft.currency,
      taxRatePct: draft.taxRatePct,
      invoiceDiscountAmount: draft.invoiceDiscountAmount,
      shippingFee: draft.shippingFee,
      amountPaid: draft.amountPaid,
      logoDataUrl: draft.logoDataUrl,
      items: draft.items,
    });
    void track("invoice_pdf_download", { items: draft.items.length });
  }

  function reset() {
    clearLogo();
    setDraft(createDefaultDraft());
  }

  return (
    <div>
      <div className="grid">
        <section className="panel">
          <div className="hd invoiceHd">
            <div className="invoiceHdTitle">
              <img className="invoiceMiniMark" src="/brand/logo-mark.svg" alt="" aria-hidden="true" />
              <div>
                <h2>Invoice Builder</h2>
                <p className="fineMuted">Wise-style structure with clearer spacing and faster data entry.</p>
              </div>
            </div>
            <div className="actions">
              <button className="btn" onClick={reset} type="button">
                Reset
              </button>
              <button className="btn primary" onClick={() => void downloadPDF()} type="button">
                Download PDF
              </button>
            </div>
          </div>
          <div className="bd invoiceForm">
            <section className="invoiceSection">
              <div className="sectionTitleRow">
                <h3 className="sectionTitle">Meta</h3>
                <div className="pill">
                  <span>Currency</span>
                  <strong>{draft.currency}</strong>
                </div>
              </div>

              <div className="row">
                <div>
                  <label htmlFor="invoiceNo">Invoice No.</label>
                  <input
                    id="invoiceNo"
                    value={draft.invoiceNo}
                    onChange={(e) => update("invoiceNo", e.target.value)}
                    placeholder="INV-0001"
                  />
                </div>
                <div>
                  <label htmlFor="poNo">PO number</label>
                  <input id="poNo" value={draft.poNo} onChange={(e) => update("poNo", e.target.value)} placeholder="PO-1001" />
                </div>
              </div>

              <div className="row">
                <div>
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    value={draft.currency}
                    onChange={(e) => update("currency", e.target.value as CurrencyCode)}
                  >
                    {CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="paymentTerms">Payment terms</label>
                  <input
                    id="paymentTerms"
                    value={draft.paymentTerms}
                    onChange={(e) => update("paymentTerms", e.target.value)}
                    placeholder="Payment due within 15 days"
                  />
                  <div className="fineMuted">Add due terms, accepted methods, and any late-fee policy.</div>
                </div>
              </div>

              <div className="row">
                <div>
                  <label htmlFor="issueDate">Issue date</label>
                  <input
                    id="issueDate"
                    type="date"
                    value={draft.issueDate}
                    onChange={(e) => update("issueDate", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="dueDate">Due date</label>
                  <input id="dueDate" type="date" value={draft.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
                </div>
              </div>

              <div className="row">
                <div>
                  <label htmlFor="logo">Logo</label>
                  <input
                    id="logo"
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      void handleLogoChange(f);
                    }}
                  />
                  <div className="fineMuted">JPG/PNG up to 5MB. Stored locally in your browser only.</div>
                  {logoError ? <div className="fineMuted">{logoError}</div> : null}
                  {draft.logoDataUrl ? (
                    <div className="logoPreviewRow">
                      <img src={draft.logoDataUrl} alt="Invoice logo preview" className="logoThumb" />
                      <button className="btn" type="button" onClick={clearLogo}>
                        Remove logo
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="pill pillTall">
                  <span>PDF export</span>
                  <strong>Ready</strong>
                </div>
              </div>
            </section>

            <section className="invoiceSection">
              <h3 className="sectionTitle">Parties</h3>
              <div className="row">
                <div>
                  <label htmlFor="from">From</label>
                  <textarea id="from" value={draft.from} onChange={(e) => update("from", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="billTo">Bill to</label>
                  <textarea id="billTo" value={draft.billTo} onChange={(e) => update("billTo", e.target.value)} />
                </div>
              </div>
            </section>

            <section className="invoiceSection">
              <h3 className="sectionTitle">Items</h3>
              <div className="itemsTableWrap">
                <table className="itemsTable">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "44%" }}>
                        Description
                      </th>
                      <th scope="col" className="num" style={{ width: "9%" }}>
                        Qty
                      </th>
                      <th scope="col" className="num" style={{ width: "12%" }}>
                        Rate
                      </th>
                      <th scope="col" className="num" style={{ width: "11%" }}>
                        Disc %
                      </th>
                      <th scope="col" className="num" style={{ width: "14%" }}>
                        Amount
                      </th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.items.map((it) => {
                      const amount = lineNetAmount(it);
                      return (
                        <tr key={it.id}>
                          <td>
                            <input
                              value={it.description}
                              onChange={(e) => updateItem(it.id, { description: e.target.value })}
                              placeholder="Line item description"
                            />
                          </td>
                          <td className="num">
                            <input
                              inputMode="decimal"
                              value={String(it.qty)}
                              onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) })}
                            />
                          </td>
                          <td className="num">
                            <input
                              inputMode="decimal"
                              value={String(it.rate)}
                              onChange={(e) => updateItem(it.id, { rate: Number(e.target.value) })}
                            />
                          </td>
                          <td className="num">
                            <input
                              inputMode="decimal"
                              value={String(it.discountPct)}
                              onChange={(e) => updateItem(it.id, { discountPct: Number(e.target.value) })}
                            />
                          </td>
                          <td className="num">{money(amount, draft.currency)}</td>
                          <td className="num">
                            <button className="btn danger" onClick={() => removeItem(it.id)} type="button">
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="itemsActions">
                <button className="btn" onClick={addItem} type="button">
                  Add item
                </button>
                <span className="pill">Line discounts are percent-based.</span>
              </div>
            </section>

            <section className="invoiceSection">
              <h3 className="sectionTitle">Payment & totals</h3>
              <div className="row">
                <div>
                  <label htmlFor="notes">Notes / payment terms</label>
                  <textarea id="notes" value={draft.notes} onChange={(e) => update("notes", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="bankDetails">Bank / payment details</label>
                  <textarea
                    id="bankDetails"
                    value={draft.bankDetails}
                    onChange={(e) => update("bankDetails", e.target.value)}
                  />
                </div>
              </div>

              <div className="row totalsRowWrap">
                <div className="totals totalsInputs">
                  <div>
                    <label htmlFor="taxRatePct">Tax rate (%)</label>
                    <input
                      id="taxRatePct"
                      inputMode="decimal"
                      value={String(draft.taxRatePct)}
                      onChange={(e) => update("taxRatePct", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="invoiceDiscountAmount">Invoice discount</label>
                    <input
                      id="invoiceDiscountAmount"
                      inputMode="decimal"
                      value={String(draft.invoiceDiscountAmount)}
                      onChange={(e) => update("invoiceDiscountAmount", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="shippingFee">Shipping fee</label>
                    <input
                      id="shippingFee"
                      inputMode="decimal"
                      value={String(draft.shippingFee)}
                      onChange={(e) => update("shippingFee", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="amountPaid">Amount paid</label>
                    <input
                      id="amountPaid"
                      inputMode="decimal"
                      value={String(draft.amountPaid)}
                      onChange={(e) => update("amountPaid", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="totals totalsSummary">
                  <div className="totalRow">
                    <span>Line subtotal</span>
                    <span>{money(totals.lineSubtotal, draft.currency)}</span>
                  </div>
                  <div className="totalRow">
                    <span>Line discounts</span>
                    <span>-{money(totals.lineDiscountTotal, draft.currency)}</span>
                  </div>
                  <div className="totalRow">
                    <span>Subtotal</span>
                    <span>{money(totals.subtotal, draft.currency)}</span>
                  </div>
                  <div className="totalRow">
                    <span>Invoice discount</span>
                    <span>-{money(totals.invoiceDiscountAmountApplied, draft.currency)}</span>
                  </div>
                  <div className="totalRow">
                    <span>Shipping</span>
                    <span>{money(totals.shippingFeeApplied, draft.currency)}</span>
                  </div>
                  <div className="totalRow">
                    <span>Tax</span>
                    <span>{money(totals.tax, draft.currency)}</span>
                  </div>
                  <div className="totalRow totalStrongRow">
                    <strong>Grand total</strong>
                    <strong>{money(totals.grandTotal, draft.currency)}</strong>
                  </div>
                  <div className="totalRow">
                    <span>Amount paid</span>
                    <span>{money(totals.amountPaidApplied, draft.currency)}</span>
                  </div>
                  <div className="totalRow totalAccentRow">
                    <strong>Balance due</strong>
                    <strong>{money(totals.balanceDue, draft.currency)}</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <aside className="panel">
          <div className="hd">
            <h2>Preview</h2>
          </div>
          <div className="bd">
            <div className="previewBrand">
              <img src="/brand/logo-mark.svg" alt="" aria-hidden="true" />
              <div>
                <strong>{draft.invoiceNo || "Untitled"}</strong>
                <div className="fineMuted">{draft.currency} invoice</div>
              </div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
              <strong style={{ color: "var(--text)" }}>From</strong>
              {"\n"}
              {draft.from}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Bill to</strong>
              {"\n"}
              {draft.billTo}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Meta</strong>
              {"\n"}
              Invoice: {draft.invoiceNo || "-"}
              {"\n"}
              PO: {draft.poNo || "-"}
              {"\n"}
              Currency: {draft.currency}
              {"\n"}
              Terms: {draft.paymentTerms || "-"}
              {"\n"}
              Issue: {draft.issueDate}
              {"\n"}
              Due: {draft.dueDate}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Totals</strong>
              {"\n"}
              Subtotal: {money(totals.subtotal, draft.currency)}
              {"\n"}
              Tax: {money(totals.tax, draft.currency)}
              {"\n"}
              Grand total: {money(totals.grandTotal, draft.currency)}
              {"\n"}
              Paid: {money(totals.amountPaidApplied, draft.currency)}
              {"\n"}
              Balance due: {money(totals.balanceDue, draft.currency)}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Bank / payment details</strong>
              {"\n"}
              {draft.bankDetails}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Notes</strong>
              {"\n"}
              {draft.notes}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
