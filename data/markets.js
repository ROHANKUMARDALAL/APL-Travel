/**
 * Global market / locale / currency helpers for APL Travel.
 *
 * PRODUCT MODEL (keep these concepts separate):
 * 1. User market / locale  — how we format dates & copy tone (en-US, en-GB, …)
 * 2. Display currency      — what the shopper sees priced in (USD, GBP, AED, …)
 * 3. Language              — i18n-ready; English variants prepared, full i18n later
 * 4. Travel origin         — search “from” (independent of currency)
 * 5. Travel destination    — search “to” / hotel city (independent of currency)
 * 6. Booking/service country — supplier/property locality (independent of currency)
 *
 * Destination MUST NOT drive display currency.
 * A Dubai user can pay in AED while booking Vietnam; a UK user can pay in GBP
 * for Japan; etc.
 *
 * This is a GLOBAL B2C platform. US/UK products are competitive UX benchmarks,
 * not a geographic product restriction.
 */

/** Supported display currencies — catalog for a future Header selector. */
export const CURRENCIES = {
  USD: { code: "USD", label: "US Dollar", symbolHint: "$", flag: "🇺🇸" },
  GBP: { code: "GBP", label: "British Pound", symbolHint: "£", flag: "🇬🇧" },
  EUR: { code: "EUR", label: "Euro", symbolHint: "€", flag: "🇪🇺" },
  AED: { code: "AED", label: "UAE Dirham", symbolHint: "AED", flag: "🇦🇪" },
  INR: { code: "INR", label: "Indian Rupee", symbolHint: "₹", flag: "🇮🇳" },
  CAD: { code: "CAD", label: "Canadian Dollar", symbolHint: "CA$", flag: "🇨🇦" },
  AUD: { code: "AUD", label: "Australian Dollar", symbolHint: "A$", flag: "🇦🇺" },
  SGD: { code: "SGD", label: "Singapore Dollar", symbolHint: "S$", flag: "🇸🇬" },
  JPY: { code: "JPY", label: "Japanese Yen", symbolHint: "¥", flag: "🇯🇵" },
};

/** Currencies with mock price coverage in current static/demo data. */
export const ACTIVE_DEMO_CURRENCIES = ["USD", "GBP"];

/**
 * Locales prepared for English markets.
 * Full translation infrastructure is intentionally deferred.
 */
export const LOCALES = {
  "en-US": { id: "en-US", language: "en", label: "English (US)" },
  "en-GB": { id: "en-GB", language: "en", label: "English (UK)" },
  "en-IN": { id: "en-IN", language: "en", label: "English (India)" },
  "en-AE": { id: "en-AE", language: "en", label: "English (UAE)" },
};

/**
 * User market profiles: locale + default currency + contact chrome.
 * Market ≠ destination. Switching market only changes presentation defaults.
 */
export const MARKETS = {
  us: {
    id: "us",
    label: "United States",
    locale: "en-US",
    currency: "USD",
    phone: "+1 (800) 555-0142",
    address: "200 Park Avenue, New York, NY 10166, USA",
  },
  uk: {
    id: "uk",
    label: "United Kingdom",
    locale: "en-GB",
    currency: "GBP",
    phone: "+44 20 7946 0958",
    address: "1 Canada Square, Canary Wharf, London E14 5AB, UK",
  },
  in: {
    id: "in",
    label: "India",
    locale: "en-IN",
    currency: "INR",
    phone: "+91 22 6218 0000",
    address: "Bandra Kurla Complex, Mumbai 400051, India",
  },
  ae: {
    id: "ae",
    label: "United Arab Emirates",
    locale: "en-AE",
    currency: "AED",
    phone: "+971 4 365 0000",
    address: "Sheikh Zayed Road, Dubai, UAE",
  },
};

/** Demo default until Header market/currency selectors ship. */
export const DEFAULT_MARKET_ID = "us";

let activeMarketId = DEFAULT_MARKET_ID;

/** Indicative INR per 1 unit. Used only when the shopper switches display currency. */
export const INR_PER_UNIT = {
  INR: 1,
  USD: 83.5,
  GBP: 106,
  EUR: 91,
  AED: 22.75,
  CAD: 61,
  AUD: 55,
  SGD: 63,
  JPY: 0.56,
};

const CURRENCY_STORAGE_KEY = "apl-display-currency";
export const CURRENCY_EVENT = "apl-currency-change";

/**
 * Display currency override. Inventory from the booking API is priced in INR.
 * null is not used — INR is the default until the profile currency is changed.
 */
let activeCurrencyOverride = "INR";

export function getActiveMarketId() {
  return activeMarketId;
}

export function setActiveMarketId(marketId) {
  if (MARKETS[marketId]) {
    activeMarketId = marketId;
  }
  return activeMarketId;
}

export function getMarket(marketId = activeMarketId) {
  return MARKETS[marketId] || MARKETS[DEFAULT_MARKET_ID];
}

export function getLocale(marketId = activeMarketId) {
  return getMarket(marketId).locale;
}

export function getLanguage(marketId = activeMarketId) {
  const locale = getLocale(marketId);
  return LOCALES[locale]?.language || "en";
}

/** Default currency for a market (before any shopper override). */
export function getMarketCurrency(marketId = activeMarketId) {
  return getMarket(marketId).currency;
}

/**
 * Signed-in currency comes from the account document. Registered from lib/auth
 * so this module does not import the session store.
 */
let readAccountCurrency = () => null;

export function registerAccountCurrencyReader(reader) {
  readAccountCurrency = typeof reader === "function" ? reader : () => null;
}

/**
 * Active display currency. A signed-in account always wins over the guest
 * header choice. Never derived from the travel destination.
 */
export function getActiveCurrencyCode(marketId = activeMarketId) {
  const accountCurrency = String(readAccountCurrency() || "").toUpperCase();
  if (CURRENCIES[accountCurrency]) return accountCurrency;
  if (activeCurrencyOverride && CURRENCIES[activeCurrencyOverride]) {
    return activeCurrencyOverride;
  }
  return getMarketCurrency(marketId);
}

export function hydrateDisplayCurrency() {
  if (typeof window === "undefined") return getActiveCurrencyCode();
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && CURRENCIES[stored]) activeCurrencyOverride = stored;
  } catch {
    // ignore
  }
  return activeCurrencyOverride;
}

export function setActiveCurrency(currencyCode) {
  const code = String(currencyCode || "").toUpperCase();
  if (!CURRENCIES[code]) return getActiveCurrencyCode();
  const changed = activeCurrencyOverride !== code;
  activeCurrencyOverride = code;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored !== code) window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // ignore
    }
    if (changed) window.dispatchEvent(new Event(CURRENCY_EVENT));
  }
  return activeCurrencyOverride;
}

export function convertAmount(amount, fromCurrency, toCurrency) {
  const from = String(fromCurrency || "INR").toUpperCase();
  const to = String(toCurrency || getActiveCurrencyCode()).toUpperCase();
  const value = Number(amount) || 0;
  if (!value || from === to) return value;
  const fromRate = INR_PER_UNIT[from];
  const toRate = INR_PER_UNIT[to];
  if (!fromRate || !toRate) return value;
  const converted = (value * fromRate) / toRate;
  if (to === "INR" || to === "JPY") return Math.round(converted);
  return Math.round(converted * 100) / 100;
}

export function clearActiveCurrencyOverride() {
  activeCurrencyOverride = null;
  return getActiveCurrencyCode();
}

export function listCurrencies() {
  return Object.values(CURRENCIES);
}

/**
 * Resolve an amount from a multi-currency price map.
 * Prefers the active display currency; falls back to USD then GBP then first value.
 * Destination never influences this lookup.
 */
export function pickPriceAmount(priceByCurrency, marketId = activeMarketId) {
  if (!priceByCurrency || typeof priceByCurrency !== "object") return null;
  const preferred = getActiveCurrencyCode(marketId);
  if (priceByCurrency[preferred] != null) return priceByCurrency[preferred];
  if (priceByCurrency.USD != null) return priceByCurrency.USD;
  if (priceByCurrency.GBP != null) return priceByCurrency.GBP;
  const first = Object.values(priceByCurrency).find((value) => value != null);
  return first ?? null;
}

export function formatMoney(amount, marketId = activeMarketId, currencyCode) {
  const market = getMarket(marketId);
  const currency = currencyCode || getActiveCurrencyCode(marketId);
  const fractionDigits = currency === "JPY" || currency === "INR" ? 0 : 2;
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatMoneyByCurrency(amount, currency, locale) {
  return new Intl.NumberFormat(locale || getLocale(), {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 0,
  }).format(amount);
}

/**
 * Format an offer/result price map for the active display currency.
 * Prices are keyed by currency code — not by destination country.
 */
export function formatOfferPrice(priceByCurrency, options = {}) {
  const marketId = options.marketId || activeMarketId;
  const currency = getActiveCurrencyCode(marketId);
  const sourceCode = ["INR", "USD", "GBP", "EUR"].find(
    (code) => priceByCurrency?.[code] != null,
  );
  if (!sourceCode) return "";
  const amount = convertAmount(priceByCurrency[sourceCode], sourceCode, currency);
  const formatted = formatMoney(amount, marketId, currency);
  return options.suffix ? `${formatted}${options.suffix}` : formatted;
}
