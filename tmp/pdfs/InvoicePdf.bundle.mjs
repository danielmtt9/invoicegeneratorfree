// src/pdf/InvoicePdf.tsx
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// src/lib/invoiceMath.ts
function safeNum(n) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}
function calcSubtotal(items) {
  return items.reduce((acc, it) => acc + safeNum(it.qty) * safeNum(it.rate), 0);
}
function calcTotals(items, taxRatePct) {
  const subtotal = calcSubtotal(items);
  const tax = subtotal * (safeNum(taxRatePct) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

// src/pdf/InvoicePdf.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function n2(n) {
  return Math.round(n * 100) / 100;
}
function money(n) {
  return `$${n2(n).toFixed(2)}`;
}
function safeNum2(n) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}
var styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0b1220"
  },
  header: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  h1: { fontSize: 22, fontWeight: 700 },
  muted: { color: "#556070" },
  metaBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10, minWidth: 200 },
  metaRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  metaKey: { color: "#6b7280" },
  blockRow: { display: "flex", flexDirection: "row", gap: 14, marginBottom: 16 },
  block: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10 },
  blockTitle: { fontSize: 10, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, overflow: "hidden" },
  tr: { display: "flex", flexDirection: "row" },
  th: { backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  cell: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#eef2f7" },
  cDesc: { flex: 1.5 },
  cQty: { width: 56, textAlign: "right" },
  cRate: { width: 76, textAlign: "right" },
  cAmt: { width: 84, textAlign: "right" },
  totals: { marginTop: 12, display: "flex", flexDirection: "row", justifyContent: "flex-end" },
  totalsBox: { width: 260, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10 },
  totalsRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalStrong: { fontWeight: 700 },
  notes: { marginTop: 14, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 10 },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, fontSize: 9, color: "#6b7280" }
});
function InvoicePdf(props) {
  const { subtotal, tax, total } = calcTotals(
    props.draft.items.map((it) => ({ qty: safeNum2(it.qty), rate: safeNum2(it.rate) })),
    safeNum2(props.draft.taxRatePct)
  );
  return /* @__PURE__ */ jsx(Document, { title: props.draft.invoiceNo || "Invoice", children: /* @__PURE__ */ jsxs(Page, { size: "LETTER", style: styles.page, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: styles.h1, children: "Invoice" }),
        /* @__PURE__ */ jsxs(Text, { style: styles.muted, children: [
          "Invoice No: ",
          props.draft.invoiceNo || "Untitled"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.metaBox, children: [
        /* @__PURE__ */ jsxs(View, { style: styles.metaRow, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.metaKey, children: "Issue date" }),
          /* @__PURE__ */ jsx(Text, { children: props.draft.issueDate || "-" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: styles.metaRow, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.metaKey, children: "Due date" }),
          /* @__PURE__ */ jsx(Text, { children: props.draft.dueDate || "-" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: styles.metaRow, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.metaKey, children: "Currency" }),
          /* @__PURE__ */ jsx(Text, { children: "USD" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: styles.blockRow, children: [
      /* @__PURE__ */ jsxs(View, { style: styles.block, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.blockTitle, children: "From" }),
        /* @__PURE__ */ jsx(Text, { children: props.draft.from || "-" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.block, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.blockTitle, children: "Bill to" }),
        /* @__PURE__ */ jsx(Text, { children: props.draft.billTo || "-" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: styles.table, children: [
      /* @__PURE__ */ jsxs(View, { style: [styles.tr, styles.th], children: [
        /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cDesc], children: "Description" }),
        /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cQty], children: "Qty" }),
        /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cRate], children: "Rate" }),
        /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cAmt], children: "Amount" })
      ] }),
      props.draft.items.map((it, idx) => {
        const qty = safeNum2(it.qty);
        const rate = safeNum2(it.rate);
        const amt = qty * rate;
        const isLast = idx === props.draft.items.length - 1;
        const rowStyle = isLast ? { borderBottomWidth: 0 } : {};
        return /* @__PURE__ */ jsxs(View, { style: styles.tr, children: [
          /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cDesc, rowStyle], children: it.description || "-" }),
          /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cQty, rowStyle], children: n2(qty).toString() }),
          /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cRate, rowStyle], children: money(rate) }),
          /* @__PURE__ */ jsx(Text, { style: [styles.cell, styles.cAmt, rowStyle], children: money(amt) })
        ] }, idx);
      })
    ] }),
    /* @__PURE__ */ jsx(View, { style: styles.totals, children: /* @__PURE__ */ jsxs(View, { style: styles.totalsBox, children: [
      /* @__PURE__ */ jsxs(View, { style: styles.totalsRow, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.metaKey, children: "Subtotal" }),
        /* @__PURE__ */ jsx(Text, { children: money(subtotal) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.totalsRow, children: [
        /* @__PURE__ */ jsxs(Text, { style: styles.metaKey, children: [
          "Tax (",
          n2(safeNum2(props.draft.taxRatePct)).toString(),
          "%)"
        ] }),
        /* @__PURE__ */ jsx(Text, { children: money(tax) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: [styles.totalsRow, { marginBottom: 0 }], children: [
        /* @__PURE__ */ jsx(Text, { style: [styles.totalStrong], children: "Total" }),
        /* @__PURE__ */ jsx(Text, { style: [styles.totalStrong], children: money(total) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: styles.notes, children: [
      /* @__PURE__ */ jsx(Text, { style: styles.blockTitle, children: "Notes" }),
      /* @__PURE__ */ jsx(Text, { children: props.draft.notes || "-" })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: styles.footer, children: "Generated by Invoice Generator (Maple-Tyne Technologies Inc.)." })
  ] }) });
}
export {
  InvoicePdf
};
