import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { build } from "esbuild";

// PDF skill helper:
// 1) Bundle the TSX invoice PDF component for Node using esbuild (no dev server, no IPC).
// 2) Render a stable sample PDF to tmp/pdfs/invoice-sample.pdf.

const root = process.cwd();
const outDir = path.join(root, "tmp/pdfs");
fs.mkdirSync(outDir, { recursive: true });

const bundlePath = path.join(outDir, "InvoicePdf.bundle.mjs");

await build({
  entryPoints: [path.join(root, "src/pdf/InvoicePdf.tsx")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: ["node18"],
  outfile: bundlePath,
  jsx: "automatic",
  external: ["react", "@react-pdf/renderer"]
});

const mod = await import(pathToFileURL(bundlePath).toString());
const InvoicePdf = mod.InvoicePdf;

const draft = {
  invoiceNo: "INV-SAMPLE-0001",
  issueDate: "2026-02-09",
  dueDate: "2026-02-23",
  from: "Maple-Tyne Technologies Inc.\n123 Example Street\nCity, Province",
  billTo: "Client Company\n456 Client Road\nCity, Province",
  notes: "Payment due within 14 days.\nThank you for your business.",
  taxRatePct: 5,
  items: [
    { description: "Consulting services (Discovery + implementation)", qty: 10, rate: 125 },
    { description: "Support and maintenance", qty: 1, rate: 250 }
  ]
};

const element = React.createElement(InvoicePdf, { draft });
const buf = await renderToBuffer(element);
const outPath = path.join(outDir, "invoice-sample.pdf");
fs.writeFileSync(outPath, buf);
process.stdout.write(outPath + "\n");
