const RATES_BPS = {
  UPI: 0,
  CARD: 250,
  NETBANKING: 300,
  WALLET: 0,
};

export function paymentMethodKey(method) {
  const key = String(method || "upi").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (key === "NET_BANKING") return "NETBANKING";
  if (key === "CUSTOMER_WALLET") return "WALLET";
  return key;
}

export function quotePaymentFee(baseAmount, method) {
  const key = paymentMethodKey(method);
  const rateBps = RATES_BPS[key];
  if (rateBps == null) {
    return { method: key, rateBps: 0, baseAmount: 0, feeAmount: 0, totalAmount: 0, simulated: true };
  }
  const baseMinor = Math.round(Number(baseAmount || 0) * 100);
  const feeMinor = Math.round((baseMinor * rateBps) / 10000);
  return {
    method: key,
    rateBps,
    baseAmount: baseMinor / 100,
    feeAmount: feeMinor / 100,
    totalAmount: (baseMinor + feeMinor) / 100,
    simulated: true,
    provider: "APL_MOCK_PAY",
  };
}
