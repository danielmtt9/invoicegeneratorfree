import React, { useMemo, useState } from "react";
import { downloadInvoicePdf } from "./pdf/downloadInvoicePdf";
import { track } from "./lib/track";
import { calcTotals } from "./lib/invoiceMath";

type LineItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

type InvoiceDraft = {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  from: string;
  billTo: string;
  notes: string;
  taxRatePct: number;
  items: LineItem[];
};

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
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

export default function App() {
  const [draft, setDraft] = useState<InvoiceDraft>(() => ({
    invoiceNo: "INV-0001",
    issueDate: todayISO(),
    dueDate: todayISO(),
    from: "Your Company\nStreet\nCity, State ZIP",
    billTo: "Client Name\nStreet\nCity, State ZIP",
    notes: "Thanks for your business.",
    taxRatePct: 0,
    items: [
      { id: uid(), description: "Service or product", qty: 1, rate: 100 }
    ]
  }));

  const totals = useMemo(() => calcTotals(draft.items, draft.taxRatePct), [draft.items, draft.taxRatePct]);
  const subtotal = totals.subtotal;
  const tax = totals.tax;
  const total = totals.total;

  function update<K extends keyof InvoiceDraft>(k: K, v: InvoiceDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    }));
  }

  function addItem() {
    setDraft((d) => ({
      ...d,
      items: [...d.items, { id: uid(), description: "", qty: 1, rate: 0 }]
    }));
  }

  function removeItem(id: string) {
    setDraft((d) => ({ ...d, items: d.items.filter((it) => it.id !== id) }));
  }

  async function downloadPDF() {
    await downloadInvoicePdf({
      invoiceNo: draft.invoiceNo,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      from: draft.from,
      billTo: draft.billTo,
      notes: draft.notes,
      taxRatePct: draft.taxRatePct,
      items: draft.items
    });
    void track("invoice_pdf_download", { items: draft.items.length });
  }

  function reset() {
    setDraft({
      invoiceNo: "INV-0001",
      issueDate: todayISO(),
      dueDate: todayISO(),
      from: "Your Company\nStreet\nCity, State ZIP",
      billTo: "Client Name\nStreet\nCity, State ZIP",
      notes: "Thanks for your business.",
      taxRatePct: 0,
      items: [{ id: uid(), description: "Service or product", qty: 1, rate: 100 }]
    });
  }

  return (
    <div>
      <div className="grid">
        <section className="panel">
          <div className="hd">
            <h2>Invoice</h2>
          </div>
          <div className="bd">
            <div className="row">
              <div className="pill" style={{ justifyContent: "space-between" }}>
                <span>PDF export</span>
                <strong>Ready</strong>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="btn" onClick={reset} type="button">
                  Reset
                </button>
                <button className="btn primary" onClick={() => void downloadPDF()} type="button">
                  Download PDF
                </button>
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
              <div className="pill" style={{ justifyContent: "space-between" }}>
                <span>Currency</span>
                <strong>USD</strong>
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
                <input
                  id="dueDate"
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                />
              </div>
            </div>

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

            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "56%" }}>
                      Description
                    </th>
                    <th scope="col" className="num" style={{ width: "12%" }}>
                      Qty
                    </th>
                    <th scope="col" className="num" style={{ width: "16%" }}>
                      Rate
                    </th>
                    <th scope="col" className="num" style={{ width: "16%" }}>
                      Amount
                    </th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((it) => {
                    const amount = (Number.isFinite(it.qty) ? it.qty : 0) * (Number.isFinite(it.rate) ? it.rate : 0);
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
                        <td className="num">{money(amount)}</td>
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

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn" onClick={addItem} type="button">
                Add item
              </button>
              <span className="pill">Tip: keep this simple for the free version.</span>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" value={draft.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>
              <div className="totals">
                <div>
                  <label htmlFor="taxRatePct">Tax rate (%)</label>
                  <input
                    id="taxRatePct"
                    inputMode="decimal"
                    value={String(draft.taxRatePct)}
                    onChange={(e) => update("taxRatePct", Number(e.target.value))}
                  />
                </div>
                <div className="totalRow">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="totalRow">
                  <span>Tax</span>
                  <span>{money(tax)}</span>
                </div>
                <div className="totalRow">
                  <strong>Total</strong>
                  <strong>{money(total)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="hd">
            <h2>Preview</h2>
          </div>
          <div className="bd">
            <div className="pill" style={{ marginBottom: 10 }}>
              <span>Invoice</span>
              <strong>{draft.invoiceNo || "Untitled"}</strong>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
              <strong style={{ color: "var(--text)" }}>From</strong>
              {"\n"}
              {draft.from}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Bill to</strong>
              {"\n"}
              {draft.billTo}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Dates</strong>
              {"\n"}
              Issue: {draft.issueDate}
              {"\n"}
              Due: {draft.dueDate}
              {"\n\n"}
              <strong style={{ color: "var(--text)" }}>Totals</strong>
              {"\n"}
              Subtotal: {money(subtotal)}
              {"\n"}
              Tax: {money(tax)}
              {"\n"}
              Total: {money(total)}
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
