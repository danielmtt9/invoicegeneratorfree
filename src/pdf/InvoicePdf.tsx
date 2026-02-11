import React from "react";
import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { calcTotals } from "../lib/invoiceMath";
import type { InvoicePdfDraft, TemplateId } from "./types";

function n2(n: number) {
  return Math.round(n * 100) / 100;
}

function money(n: number, currency: string) {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "\u20ac",
    GBP: "\u00a3",
    CAD: "C$",
    AUD: "A$",
    INR: "\u20b9",
    JPY: "\u00a5",
    NGN: "\u20a6",
  };
  const symbol = symbols[currency] || `${currency} `;
  return `${symbol}${n2(n).toFixed(2)}`;
}

function safeNum(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function normalizeColor(hex: string): string {
  const v = (hex || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#FFD166";
}

function themeFor(templateId: TemplateId) {
  switch (templateId) {
    case "creative":
      return { headingSize: 24, tableHeaderBg: "#f1f5f9", borderStyle: "dashed" as const };
    case "traditional":
      return { headingSize: 20, tableHeaderBg: "#f8fafc", borderStyle: "solid" as const };
    default:
      return { headingSize: 22, tableHeaderBg: "#f8fafc", borderStyle: "solid" as const };
  }
}

function buildStyles(accent: string, templateId: TemplateId) {
  const t = themeFor(templateId);
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 36,
      paddingHorizontal: 36,
      fontSize: 11,
      fontFamily: "Helvetica",
      color: "#0b1220",
    },
    header: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 18, gap: 12 },
    headerLeft: { flexDirection: "row", gap: 10, alignItems: "flex-start", maxWidth: 310 },
    logo: { width: 48, height: 48, objectFit: "contain" },
    h1: { fontSize: t.headingSize, fontWeight: 700, color: accent },
    muted: { color: "#556070" },
    metaBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10, minWidth: 240, borderStyle: t.borderStyle },
    metaRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 4 },
    metaKey: { color: "#6b7280" },
    blockRow: { display: "flex", flexDirection: "row", gap: 14, marginBottom: 16 },
    block: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderRadius: 6,
      padding: 10,
      borderTopWidth: 3,
      borderTopColor: accent,
    },
    blockTitle: { fontSize: 10, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
    table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, overflow: "hidden" },
    tr: { display: "flex", flexDirection: "row" },
    th: { backgroundColor: t.tableHeaderBg, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    cell: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#eef2f7" },
    cDesc: { flex: 1.1 },
    cUnit: { width: 64, textAlign: "right" },
    cQty: { width: 52, textAlign: "right" },
    cRate: { width: 72, textAlign: "right" },
    cDisc: { width: 62, textAlign: "right" },
    cAmt: { width: 84, textAlign: "right" },
    totals: { marginTop: 12, display: "flex", flexDirection: "row", justifyContent: "flex-end" },
    totalsBox: { width: 320, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10 },
    totalsRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    totalStrong: { fontWeight: 700 },
    balanceDue: { color: accent, fontWeight: 700 },
    notes: { marginTop: 14, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10 },
    payment: { marginTop: 12, borderWidth: 1, borderColor: accent, borderRadius: 6, padding: 10 },
    payLink: { color: accent, textDecoration: "underline" },
    qrRow: { marginTop: 6, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    qrImg: { width: 72, height: 72 },
    footer: { position: "absolute", bottom: 18, left: 36, right: 36, fontSize: 9, color: "#6b7280" },
  });
}

export function InvoicePdf(props: { draft: InvoicePdfDraft }) {
  const accent = normalizeColor(props.draft.brandColor);
  const styles = buildStyles(accent, props.draft.templateId);
  const totals = calcTotals({
    items: props.draft.items.map((it) => ({
      qty: safeNum(it.qty),
      rate: safeNum(it.rate),
      discountPct: safeNum(it.discountPct),
    })),
    taxRatePct: safeNum(props.draft.taxRatePct),
    invoiceDiscountAmount: safeNum(props.draft.invoiceDiscountAmount),
    shippingFee: safeNum(props.draft.shippingFee),
    amountPaid: safeNum(props.draft.amountPaid),
  });

  return (
    <Document title={props.draft.invoiceNo || "Invoice"}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {props.draft.logoDataUrl ? <Image src={props.draft.logoDataUrl} style={styles.logo} /> : null}
            <View>
              <Text style={styles.h1}>Invoice</Text>
              <Text style={styles.muted}>Invoice No: {props.draft.invoiceNo || "Untitled"}</Text>
              <Text style={styles.muted}>PO No: {props.draft.poNo || "-"}</Text>
            </View>
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Issue date</Text>
              <Text>{props.draft.issueDate || "-"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Due date</Text>
              <Text>{props.draft.dueDate || "-"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Currency</Text>
              <Text>{props.draft.currency}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Payment terms</Text>
              <Text>{props.draft.paymentTerms || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.blockRow}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>From</Text>
            <Text>{props.draft.from || "-"}</Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Bill to</Text>
            <Text>{props.draft.billTo || "-"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tr, styles.th]}>
            <Text style={[styles.cell, styles.cDesc]}>Description</Text>
            <Text style={[styles.cell, styles.cUnit]}>Unit</Text>
            <Text style={[styles.cell, styles.cQty]}>Qty</Text>
            <Text style={[styles.cell, styles.cRate]}>Rate</Text>
            <Text style={[styles.cell, styles.cDisc]}>Disc %</Text>
            <Text style={[styles.cell, styles.cAmt]}>Amount</Text>
          </View>

          {props.draft.items.map((it, idx) => {
            const qty = safeNum(it.qty);
            const rate = safeNum(it.rate);
            const discountPct = Math.min(100, Math.max(0, safeNum(it.discountPct)));
            const lineAmount = qty * rate;
            const lineNet = lineAmount - lineAmount * (discountPct / 100);
            const isLast = idx === props.draft.items.length - 1;
            const rowStyle = isLast ? { borderBottomWidth: 0 } : {};

            return (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.cell, styles.cDesc, rowStyle]}>{it.description || "-"}</Text>
                <Text style={[styles.cell, styles.cUnit, rowStyle]}>{it.unitType || "quantity"}</Text>
                <Text style={[styles.cell, styles.cQty, rowStyle]}>{n2(qty).toString()}</Text>
                <Text style={[styles.cell, styles.cRate, rowStyle]}>{money(rate, props.draft.currency)}</Text>
                <Text style={[styles.cell, styles.cDisc, rowStyle]}>{n2(discountPct).toString()}</Text>
                <Text style={[styles.cell, styles.cAmt, rowStyle]}>{money(lineNet, props.draft.currency)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>Line subtotal</Text>
              <Text>{money(totals.lineSubtotal, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>Line discounts</Text>
              <Text>-{money(totals.lineDiscountTotal, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>Subtotal</Text>
              <Text>{money(totals.subtotal, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>Invoice discount</Text>
              <Text>-{money(totals.invoiceDiscountAmountApplied, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>Shipping</Text>
              <Text>{money(totals.shippingFeeApplied, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>{props.draft.taxLabel || "Tax"} ({n2(safeNum(props.draft.taxRatePct)).toString()}%)</Text>
              <Text>{money(totals.tax, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalStrong}>Grand total</Text>
              <Text style={styles.totalStrong}>{money(totals.grandTotal, props.draft.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.metaKey}>Amount paid</Text>
              <Text>{money(totals.amountPaidApplied, props.draft.currency)}</Text>
            </View>
            <View style={[styles.totalsRow, { marginBottom: 0 }]}>
              <Text style={styles.balanceDue}>Balance due</Text>
              <Text style={styles.balanceDue}>{money(totals.balanceDue, props.draft.currency)}</Text>
            </View>
          </View>
        </View>

        {props.draft.paymentLink ? (
          <View style={styles.payment}>
            <Text style={styles.blockTitle}>Pay online</Text>
            <Link style={styles.payLink} src={props.draft.paymentLink}>
              {props.draft.paymentLink}
            </Link>
            {props.draft.qrDataUrl ? (
              <View style={styles.qrRow}>
                <Text style={styles.metaKey}>Scan to pay</Text>
                <Image style={styles.qrImg} src={props.draft.qrDataUrl} />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.notes}>
          <Text style={styles.blockTitle}>Bank / payment details</Text>
          <Text>{props.draft.bankDetails || "-"}</Text>
        </View>

        <View style={styles.notes}>
          <Text style={styles.blockTitle}>Notes</Text>
          <Text>{props.draft.notes || "-"}</Text>
        </View>

        <Text style={styles.footer}>Generated by Invoice Generator (Maple-Tyne Technologies Inc.).</Text>
      </Page>
    </Document>
  );
}
