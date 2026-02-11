import React, { useEffect, useMemo, useRef, useState } from "react";
import { downloadInvoicePdf } from "./pdf/downloadInvoicePdf";
import type { TemplateId } from "./pdf/types";
import { track } from "./lib/track";
import { calcTotals } from "./lib/invoiceMath";
import { getCurrencyOptions } from "./lib/currencies";
import { TAX_PRESETS, getTaxPresetById } from "./lib/taxPresets";
import { suggestNextInvoiceNo } from "./lib/invoiceNumber";
import { FEATURES } from "./shared/features";

type UnitType = "hours" | "quantity" | "service" | "fixed_rate";

type LineItem = {
  id: string;
  description: string;
  unitType: UnitType;
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
  currency: string;
  taxRatePct: number;
  taxPresetId: string;
  taxLabel: string;
  invoiceDiscountAmount: number;
  shippingFee: number;
  amountPaid: number;
  logoDataUrl: string;
  paymentLink: string;
  templateId: TemplateId;
  brandColor: string;
  items: LineItem[];
};

type DraftEnvelope = {
  version: 1;
  savedAt: string;
  draft: InvoiceDraft;
};

type SequenceEnvelope = {
  version: 1;
  lastInvoiceNo: string;
  nextInvoiceNo: string;
};

const DRAFT_STORAGE_KEY = "invoice.draft.v1";
const SEQUENCE_STORAGE_KEY = "invoice.sequence.v1";
const LEGACY_LOGO_KEY = "invoice.logoDataUrl";
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg"]);
const UNIT_OPTIONS: UnitType[] = ["hours", "quantity", "service", "fixed_rate"];
const BRAND_SWATCHES = [
  "#FFD166",
  "#2563EB",
  "#0EA5E9",
  "#0891B2",
  "#059669",
  "#16A34A",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#BE185D",
  "#7C3AED",
  "#475569",
];

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  }
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

function normalizeBrandColor(value: string): string {
  const v = (value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#FFD166";
}

function createDefaultDraft(invoiceNo = "INV-0001", logoDataUrl = ""): InvoiceDraft {
  return {
    invoiceNo,
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
    taxPresetId: "none",
    taxLabel: "Tax",
    invoiceDiscountAmount: 0,
    shippingFee: 0,
    amountPaid: 0,
    logoDataUrl,
    paymentLink: "",
    templateId: "minimalist",
    brandColor: "#FFD166",
    items: [{ id: uid(), description: "Service or product", unitType: "quantity", qty: 1, rate: 100, discountPct: 0 }],
  };
}

function sanitizeDraft(raw: unknown): InvoiceDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<InvoiceDraft>;
  const base = createDefaultDraft(r.invoiceNo || "INV-0001", typeof r.logoDataUrl === "string" ? r.logoDataUrl : "");
  const itemsRaw = Array.isArray(r.items) ? r.items : base.items;
  const items = itemsRaw.map((it) => {
    const x = it as Partial<LineItem>;
    return {
      id: typeof x.id === "string" && x.id ? x.id : uid(),
      description: typeof x.description === "string" ? x.description : "",
      unitType: UNIT_OPTIONS.includes((x.unitType as UnitType) || "quantity") ? (x.unitType as UnitType) : "quantity",
      qty: Number.isFinite(Number(x.qty)) ? Number(x.qty) : 0,
      rate: Number.isFinite(Number(x.rate)) ? Number(x.rate) : 0,
      discountPct: Number.isFinite(Number(x.discountPct)) ? Number(x.discountPct) : 0,
    };
  });
  return {
    ...base,
    ...r,
    brandColor: normalizeBrandColor(typeof r.brandColor === "string" ? r.brandColor : base.brandColor),
    currency: typeof r.currency === "string" ? r.currency : base.currency,
    taxPresetId: typeof r.taxPresetId === "string" ? r.taxPresetId : base.taxPresetId,
    taxLabel: typeof r.taxLabel === "string" ? r.taxLabel : base.taxLabel,
    paymentLink: typeof r.paymentLink === "string" ? r.paymentLink : "",
    templateId: (r.templateId as TemplateId) || "minimalist",
    items: items.length ? items : base.items,
  };
}

function loadPersistedDraft(): InvoiceDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftEnvelope>;
    if (parsed.version !== 1 || !parsed.draft) return null;
    return sanitizeDraft(parsed.draft);
  } catch {
    return null;
  }
}

function loadLegacyLogo(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(LEGACY_LOGO_KEY) || "";
  } catch {
    return "";
  }
}

function loadSequence(): SequenceEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SEQUENCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SequenceEnvelope>;
    if (parsed.version !== 1) return null;
    if (typeof parsed.nextInvoiceNo !== "string" || typeof parsed.lastInvoiceNo !== "string") return null;
    return parsed as SequenceEnvelope;
  } catch {
    return null;
  }
}

function saveSequence(seq: SequenceEnvelope) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEQUENCE_STORAGE_KEY, JSON.stringify(seq));
  } catch {
    // ignore
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

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export default function App() {
  const initialSequence = useMemo(() => loadSequence(), []);
  const [draft, setDraft] = useState<InvoiceDraft>(() => {
    const restored = loadPersistedDraft();
    if (restored) return restored;
    const logo = loadLegacyLogo();
    return createDefaultDraft(initialSequence?.nextInvoiceNo || "INV-0001", logo);
  });
  const [logoError, setLogoError] = useState("");
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [currencyInput, setCurrencyInput] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const saveTimerRef = useRef<number | null>(null);

  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const selectedCurrency = useMemo(
    () => currencyOptions.find((c) => c.code === draft.currency) || null,
    [currencyOptions, draft.currency]
  );

  useEffect(() => {
    if (selectedCurrency) {
      setCurrencyInput(selectedCurrency.label);
    }
  }, [selectedCurrency]);

  useEffect(() => {
    if (!FEATURES.pwa) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  useEffect(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      const payload: DraftEnvelope = {
        version: 1,
        savedAt: new Date().toISOString(),
        draft,
      };
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore storage errors
      }
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [draft]);

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
      items: [...d.items, { id: uid(), description: "", unitType: "quantity", qty: 1, rate: 0, discountPct: 0 }],
    }));
  }

  function removeItem(id: string) {
    setDraft((d) => ({ ...d, items: d.items.filter((it) => it.id !== id) }));
  }

  function clearLogo() {
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

    setDraft((d) => ({ ...d, logoDataUrl: dataUrl }));
    setLogoError("");
  }

  function applyTaxPreset(id: string) {
    const p = getTaxPresetById(id);
    if (!p) return;
    setDraft((d) => ({
      ...d,
      taxPresetId: p.id,
      taxLabel: p.id === "none" ? "Tax" : p.label,
      taxRatePct: p.rate,
    }));
  }

  function handleCurrencyInput(value: string) {
    setCurrencyInput(value);
    const raw = value.trim();
    if (!raw) return;
    const byCode = currencyOptions.find((c) => c.code === raw.toUpperCase());
    if (byCode) {
      update("currency", byCode.code);
      return;
    }
    const lower = raw.toLowerCase();
    const byLabel = currencyOptions.find((c) => c.label.toLowerCase() === lower);
    if (byLabel) {
      update("currency", byLabel.code);
    }
  }

  function useNextInvoiceNumber() {
    update("invoiceNo", suggestNextInvoiceNo(draft.invoiceNo));
  }

  async function installPwa() {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
    }
  }

  async function downloadPDF() {
    const paymentLink = draft.paymentLink.trim();
    if (paymentLink && !isHttpUrl(paymentLink)) {
      alert("Payment link must be a valid http(s) URL.");
      return;
    }

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
      taxPresetId: draft.taxPresetId,
      taxLabel: draft.taxLabel,
      invoiceDiscountAmount: draft.invoiceDiscountAmount,
      shippingFee: draft.shippingFee,
      amountPaid: draft.amountPaid,
      logoDataUrl: draft.logoDataUrl,
      paymentLink: paymentLink,
      templateId: draft.templateId,
      brandColor: normalizeBrandColor(draft.brandColor),
      items: draft.items,
    });

    const next = suggestNextInvoiceNo(draft.invoiceNo);
    const seq: SequenceEnvelope = { version: 1, lastInvoiceNo: draft.invoiceNo, nextInvoiceNo: next };
    saveSequence(seq);
    setDraft((d) => ({ ...d, invoiceNo: next }));
    void track("invoice_pdf_download", { items: draft.items.length });
  }

  function reset() {
    const seq = loadSequence();
    setDraft(createDefaultDraft(seq?.nextInvoiceNo || "INV-0001", ""));
    setLogoError("");
  }

  function clearLocalData() {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(SEQUENCE_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_LOGO_KEY);
    } catch {
      // ignore
    }
    setDraft(createDefaultDraft("INV-0001", ""));
    setLogoError("");
  }

  return (
    <div className={`template-${draft.templateId}`} style={{ ["--brand-color" as any]: normalizeBrandColor(draft.brandColor) }}>
      <div className="grid">
        <section className="panel">
          <div className="hd invoiceHd">
            <div className="invoiceHdTitle">
              <img className="invoiceMiniMark" src="/brand/logo-mark.svg" alt="" aria-hidden="true" />
              <div>
                <h2>Invoice Builder</h2>
                <p className="fineMuted">Structured layout with clear spacing and faster data entry.</p>
              </div>
            </div>
            <div className="actions">
              <span className="pill privateBadge" role="status" aria-live="polite">
                <strong>Private</strong>
                <span>Invoice data stays local</span>
                <button className="linkBtn" type="button" onClick={() => setShowPrivacyInfo(true)}>
                  Learn more
                </button>
              </span>
              {FEATURES.pwa && installPrompt ? (
                <button className="btn" onClick={() => void installPwa()} type="button">
                  Install app
                </button>
              ) : null}
              <button className="btn" onClick={reset} type="button">
                Reset
              </button>
              <button className="btn" onClick={clearLocalData} type="button">
                Clear local data
              </button>
              <button className="btn primary" onClick={() => void downloadPDF()} type="button">
                Download PDF
              </button>
            </div>
          </div>
          <div className="bd invoiceForm">
            <section className="invoiceSection">
              <div className="sectionTitleRow">
                <h3 className="sectionTitle">Invoice details</h3>
                <div className="pill">
                  <span>Currency</span>
                  <strong>{draft.currency}</strong>
                </div>
              </div>

              <div className="row">
                <div>
                  <label htmlFor="invoiceNo">Invoice No.</label>
                  <div className="fieldActionRow">
                    <input
                      id="invoiceNo"
                      value={draft.invoiceNo}
                      onChange={(e) => update("invoiceNo", e.target.value)}
                      placeholder="INV-0001"
                    />
                    <button className="btn" type="button" onClick={useNextInvoiceNumber}>
                      Use next
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="poNo">PO number</label>
                  <input id="poNo" value={draft.poNo} onChange={(e) => update("poNo", e.target.value)} placeholder="PO-1001" />
                </div>
              </div>

              <div className="row">
                <div>
                  <label htmlFor="currencySelect">Currency</label>
                  <input
                    id="currencySelect"
                    list="currency-options"
                    value={currencyInput}
                    onChange={(e) => handleCurrencyInput(e.target.value)}
                    onBlur={() => {
                      if (selectedCurrency) setCurrencyInput(selectedCurrency.label);
                    }}
                    placeholder="Type USD, EUR, NGN, CAD..."
                  />
                  <datalist id="currency-options">
                    {currencyOptions.map((c) => (
                      <option key={c.code} value={c.label} />
                    ))}
                  </datalist>
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
                  <label htmlFor="templateId">Template</label>
                  <select id="templateId" value={draft.templateId} onChange={(e) => update("templateId", e.target.value as TemplateId)}>
                    <option value="minimalist">Minimalist</option>
                    <option value="creative">Creative</option>
                    <option value="traditional">Traditional</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="brandColor">Brand color</label>
                  <div id="brandColor" className="swatchGrid" role="radiogroup" aria-label="Brand color">
                    {BRAND_SWATCHES.map((swatch) => {
                      const selected = normalizeBrandColor(draft.brandColor) === swatch;
                      return (
                        <button
                          key={swatch}
                          type="button"
                          className={`swatchBtn${selected ? " selected" : ""}`}
                          style={{ backgroundColor: swatch }}
                          onClick={() => update("brandColor", swatch)}
                          aria-label={`Select ${swatch} brand color`}
                          aria-checked={selected}
                          role="radio"
                        />
                      );
                    })}
                  </div>
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
                <div>
                  <label htmlFor="paymentLink">Stripe payment link (optional)</label>
                  <input
                    id="paymentLink"
                    value={draft.paymentLink}
                    onChange={(e) => update("paymentLink", e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                  />
                  {draft.paymentLink && !isHttpUrl(draft.paymentLink) ? (
                    <div className="fineMuted">Enter a valid http(s) URL.</div>
                  ) : null}
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
                      <th scope="col" style={{ width: "40%" }}>
                        Description
                      </th>
                      <th scope="col" style={{ width: "12%" }}>
                        Unit
                      </th>
                      <th scope="col" className="num" style={{ width: "8%" }}>
                        Qty
                      </th>
                      <th scope="col" className="num" style={{ width: "12%" }}>
                        Rate
                      </th>
                      <th scope="col" className="num" style={{ width: "10%" }}>
                        Disc %
                      </th>
                      <th scope="col" className="num" style={{ width: "12%" }}>
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
                          <td className="descCell">
                            <textarea
                              className="itemDescInput"
                              value={it.description}
                              onChange={(e) => updateItem(it.id, { description: e.target.value })}
                              placeholder="Line item description"
                            />
                          </td>
                          <td>
                            <select value={it.unitType} onChange={(e) => updateItem(it.id, { unitType: e.target.value as UnitType })}>
                              {UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
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
                <span className="pill">Choose unit per line: hours, quantity, service, or fixed rate.</span>
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
                    <label htmlFor="taxPreset">Tax preset</label>
                    <select id="taxPreset" value={draft.taxPresetId} onChange={(e) => applyTaxPreset(e.target.value)}>
                      {TAX_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label} ({p.rate}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="taxLabel">Tax label</label>
                    <input id="taxLabel" value={draft.taxLabel} onChange={(e) => update("taxLabel", e.target.value)} />
                  </div>
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
                    <span>{draft.taxLabel || "Tax"}</span>
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

        <aside className="panel previewPanel">
          <div className="hd">
            <h2>Preview</h2>
          </div>
          <div className="bd previewBody">
            <div className="previewPaper">
              <div className="previewHeader">
                <div className="previewHeaderLeft">
                  {draft.logoDataUrl ? <img className="previewLogo" src={draft.logoDataUrl} alt="Invoice logo preview" /> : null}
                  <div>
                    <div className="previewTitle">Invoice</div>
                    <div className="previewMuted">Invoice No: {draft.invoiceNo || "Untitled"}</div>
                    <div className="previewMuted">PO No: {draft.poNo || "-"}</div>
                  </div>
                </div>
                <div className="previewMetaBox">
                  <div className="previewMetaRow">
                    <span>Issue date</span>
                    <strong>{draft.issueDate || "-"}</strong>
                  </div>
                  <div className="previewMetaRow">
                    <span>Due date</span>
                    <strong>{draft.dueDate || "-"}</strong>
                  </div>
                  <div className="previewMetaRow">
                    <span>Currency</span>
                    <strong>{draft.currency}</strong>
                  </div>
                  <div className="previewMetaRow">
                    <span>Payment terms</span>
                    <strong>{draft.paymentTerms || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="previewPartyGrid">
                <section className="previewBlock">
                  <h4>From</h4>
                  <p>{draft.from || "-"}</p>
                </section>
                <section className="previewBlock">
                  <h4>Bill to</h4>
                  <p>{draft.billTo || "-"}</p>
                </section>
              </div>

              <div className="previewTableWrap">
                <table className="previewTable">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="num">Unit</th>
                      <th className="num">Qty</th>
                      <th className="num">Rate</th>
                      <th className="num">Disc %</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.items.map((it) => (
                      <tr key={`preview-${it.id}`}>
                        <td className="previewWrap">{it.description || "-"}</td>
                        <td className="num">{it.unitType || "quantity"}</td>
                        <td className="num">{it.qty}</td>
                        <td className="num">{money(it.rate, draft.currency)}</td>
                        <td className="num">{it.discountPct}</td>
                        <td className="num">{money(lineNetAmount(it), draft.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="previewTotalsWrap">
                <div className="previewTotalsBox">
                  <div className="previewTotalRow">
                    <span>Line subtotal</span>
                    <strong>{money(totals.lineSubtotal, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow">
                    <span>Line discounts</span>
                    <strong>-{money(totals.lineDiscountTotal, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow">
                    <span>Subtotal</span>
                    <strong>{money(totals.subtotal, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow">
                    <span>Invoice discount</span>
                    <strong>-{money(totals.invoiceDiscountAmountApplied, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow">
                    <span>Shipping</span>
                    <strong>{money(totals.shippingFeeApplied, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow">
                    <span>
                      {draft.taxLabel || "Tax"} ({Number.isFinite(draft.taxRatePct) ? draft.taxRatePct : 0}%)
                    </span>
                    <strong>{money(totals.tax, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow previewTotalStrong">
                    <span>Grand total</span>
                    <strong>{money(totals.grandTotal, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow">
                    <span>Amount paid</span>
                    <strong>{money(totals.amountPaidApplied, draft.currency)}</strong>
                  </div>
                  <div className="previewTotalRow previewTotalAccent">
                    <span>Balance due</span>
                    <strong>{money(totals.balanceDue, draft.currency)}</strong>
                  </div>
                </div>
              </div>

              {draft.paymentLink ? (
                <section className="previewBlock previewPayBlock">
                  <h4>Pay online</h4>
                  <p className="previewWrap">{draft.paymentLink}</p>
                </section>
              ) : null}

              <section className="previewBlock">
                <h4>Bank / payment details</h4>
                <p>{draft.bankDetails || "-"}</p>
              </section>
              <section className="previewBlock">
                <h4>Notes</h4>
                <p>{draft.notes || "-"}</p>
              </section>
            </div>
          </div>
        </aside>
      </div>

      {showPrivacyInfo ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="Privacy info">
          <div className="modalCard">
            <div className="modalHd">
              <div className="modalTitle">Privacy-first invoice generation</div>
              <button className="iconBtn" type="button" onClick={() => setShowPrivacyInfo(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modalBd">
              <p className="fine" style={{ marginTop: 0 }}>
                Invoice content stays on your device. We do not upload invoice fields to our server. Analytics is optional
                and does not include invoice line-item content.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
