export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
  label: string;
};

const FALLBACK_CODES = [
  "USD","EUR","GBP","CAD","AUD","NZD","JPY","CNY","INR","NGN","ZAR","KES","GHS","XOF","XAF","CHF","SEK","NOK","DKK","SGD","HKD","AED","SAR","QAR","PKR","BDT","MYR","THB","IDR","PHP","VND","KRW","BRL","MXN","ARS","CLP","COP","PEN","TRY","PLN","CZK","HUF","RON","ILS","EGP","MAD","TND","RUB","UAH"
];

function getCodes(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  if (typeof intl.supportedValuesOf === "function") {
    try {
      return intl.supportedValuesOf("currency").map((c) => c.toUpperCase());
    } catch {
      // fallback below
    }
  }
  return FALLBACK_CODES;
}

function symbolFor(code: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(1);
    const p = parts.find((part) => part.type === "currency")?.value;
    return p || code;
  } catch {
    return code;
  }
}

function nameFor(code: string): string {
  try {
    const dn = new Intl.DisplayNames([navigator.language || "en"], { type: "currency" });
    return dn.of(code) || code;
  } catch {
    return code;
  }
}

export function getCurrencyOptions(): CurrencyOption[] {
  const codes = Array.from(new Set(getCodes())).sort((a, b) => a.localeCompare(b));
  return codes.map((code) => {
    const name = nameFor(code);
    const symbol = symbolFor(code);
    return {
      code,
      name,
      symbol,
      label: `${code} - ${name} (${symbol})`,
    };
  });
}
