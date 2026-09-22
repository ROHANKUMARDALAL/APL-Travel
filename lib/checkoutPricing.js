import { formatMoney, getActiveMarketId, getActiveCurrencyCode } from "@/data/markets";
import { BOOKING_EXTRAS, getExtraPrice } from "@/lib/booking";

export { getWalletBalance } from "@/lib/wallet";

/** Mock promo codes — not a real coupon engine. */
export const MOCK_PROMO_CODES = {
  SAVE10: {
    code: "SAVE10",
    type: "percent",
    value: 10,
    label: "10% off",
  },
  WELCOME20: {
    code: "WELCOME20",
    type: "flat",
    value: { USD: 20, GBP: 16 },
    label: "Welcome discount",
  },
};

/** Mock service fee added at checkout (by display currency). */
export const MOCK_SERVICE_FEE = {
  USD: 12,
  GBP: 10,
};

export function getServiceFee(marketId = getActiveMarketId()) {
  const currency = getActiveCurrencyCode(marketId);
  return MOCK_SERVICE_FEE[currency] ?? MOCK_SERVICE_FEE.USD ?? 0;
}

export function applyPromoCode(code, usedCodes = []) {
  const normalized = String(code || "")
    .trim()
    .toUpperCase();
  if (!normalized) {
    return { ok: false, status: "empty", message: "Enter a promo or referral code" };
  }
  if (usedCodes.includes(normalized)) {
    return { ok: false, status: "used", message: "This code was already used" };
  }
  const promo = MOCK_PROMO_CODES[normalized];
  if (!promo) {
    return { ok: false, status: "invalid", message: "Invalid promo or referral code" };
  }
  return {
    ok: true,
    status: "applied",
    message: `${promo.label} applied`,
    promo: { ...promo, code: normalized },
  };
}

export function calcPromoDiscount(promo, amountBeforeDiscount, marketId = getActiveMarketId()) {
  if (!promo || amountBeforeDiscount <= 0) return 0;
  const currency = getActiveCurrencyCode(marketId);
  if (promo.type === "percent") {
    return Math.min(
      amountBeforeDiscount,
      Math.round((amountBeforeDiscount * promo.value) / 100),
    );
  }
  const flat = typeof promo.value === "object" ? promo.value[currency] || 0 : promo.value;
  return Math.min(amountBeforeDiscount, flat);
}

/**
 * Full checkout payable breakdown.
 * Does not allow negative totals.
 */
export function calcCheckoutPayable({
  draftTotals,
  service,
  selectedExtraIds = [],
  nights = 1,
  promo = null,
  walletApplied = 0,
  marketId = getActiveMarketId(),
}) {
  const currency = getActiveCurrencyCode(marketId);
  const base = draftTotals?.base || 0;
  const taxes = draftTotals?.taxes || 0;

  const catalog = BOOKING_EXTRAS[service] || [];
  const selectedExtras = catalog.filter((extra) =>
    selectedExtraIds.includes(extra.id),
  );
  const extras = selectedExtras.reduce(
    (sum, extra) => sum + getExtraPrice(extra, nights, marketId),
    0,
  );

  const serviceFee = getServiceFee(marketId);
  const beforeDiscount = base + taxes + serviceFee + extras;
  const discount = calcPromoDiscount(promo, beforeDiscount, marketId);
  const afterDiscount = Math.max(0, beforeDiscount - discount);
  const wallet = Math.min(Math.max(0, walletApplied), afterDiscount);
  const totalPayable = Math.max(0, afterDiscount - wallet);

  return {
    currency,
    base,
    taxes,
    serviceFee,
    extras,
    discount,
    wallet,
    totalPayable,
    selectedExtras,
    baseLabel: formatMoney(base, marketId),
    taxesLabel: formatMoney(taxes, marketId),
    serviceFeeLabel: formatMoney(serviceFee, marketId),
    extrasLabel: formatMoney(extras, marketId),
    discountLabel: formatMoney(discount, marketId),
    walletLabel: formatMoney(wallet, marketId),
    totalPayableLabel: formatMoney(totalPayable, marketId),
  };
}
