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
  USD: { code: "USD", label: "US Dollar", symbolHint: "$" },
  GBP: { code: "GBP", label: "British Pound", symbolHint: "£" },
  EUR: { code: "EUR", label: "Euro", symbolHint: "€" },
  AED: { code: "AED", label: "UAE Dirham", symbolHint: "AED" },
  INR: { code: "INR", label: "Indian Rupee", symbolHint: "₹" },
  CAD: { code: "CAD", label: "Canadian Dollar", symbolHint: "CA$" },
  AUD: { code: "AUD", label: "Australian Dollar", symbolHint: "A$" },
  SGD: { code: "SGD", label: "Singapore Dollar", symbolHint: "S$" },
  JPY: { code: "JPY", label: "Japanese Yen", symbolHint: "¥" },
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

/**
 * Optional display-currency override (independent of market / destination).
 * null → follow the active market’s default currency.
 */
let activeCurrencyOverride = null;

export function getActiveMarketId() {
  return activeMarketId;
}

export function setActiveMarketId(marketId) {
  if (MARKETS[marketId]) {
    activeMarketId = marketId;
    // Market change resets currency override so shoppers see that market’s default.
    activeCurrencyOverride = null;
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
 * Active display currency — may differ from market default once a Header
 * currency selector sets an override. Never derived from travel destination.
 */
export function getActiveCurrencyCode(marketId = activeMarketId) {
  if (activeCurrencyOverride && CURRENCIES[activeCurrencyOverride]) {
    return activeCurrencyOverride;
  }
  return getMarketCurrency(marketId);
}

export function setActiveCurrency(currencyCode) {
  const code = String(currencyCode || "").toUpperCase();
  if (!CURRENCIES[code]) return getActiveCurrencyCode();
  activeCurrencyOverride = code;
  return activeCurrencyOverride;
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
  const fractionDigits = currency === "JPY" ? 0 : 0;
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
  const amount = pickPriceAmount(priceByCurrency, marketId);
  if (amount == null) return "";
  // If we fell back to another currency’s amount, still label with preferred code
  // only when that key exists; otherwise format with the currency we actually used.
  const usedCurrency =
    priceByCurrency?.[currency] != null
      ? currency
      : priceByCurrency?.USD != null
        ? "USD"
        : priceByCurrency?.GBP != null
          ? "GBP"
          : currency;
  const formatted = formatMoney(amount, marketId, usedCurrency);
  return options.suffix ? `${formatted}${options.suffix}` : formatted;
}
