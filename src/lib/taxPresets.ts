export type TaxPreset = {
  id: string;
  label: string;
  rate: number;
};

export const TAX_PRESETS: TaxPreset[] = [
  { id: "none", label: "No tax", rate: 0 },
  { id: "ca_gst_5", label: "GST (Canada)", rate: 5 },
  { id: "ca_hst_13", label: "HST (Ontario)", rate: 13 },
  { id: "ca_hst_15", label: "HST (Atlantic)", rate: 15 },
  { id: "vat_standard_20", label: "VAT (Standard)", rate: 20 },
  { id: "vat_reduced_5", label: "VAT (Reduced)", rate: 5 },
  { id: "sales_tax_8", label: "Sales Tax", rate: 8 },
];

export function getTaxPresetById(id: string): TaxPreset | null {
  return TAX_PRESETS.find((p) => p.id === id) || null;
}
