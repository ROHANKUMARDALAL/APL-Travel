import { apiGet } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { formatMoney, getActiveMarketId } from "@/data/markets";

const SERVICE_NAMES = {
  flight: "Flight",
  hotel: "Hotel",
  bus: "Bus",
  transfer: "Cab",
  cab: "Cab",
  insurance: "Insurance",
};

export function bookingPaymentLabel(serviceCode, reversal = false) {
  const name = SERVICE_NAMES[String(serviceCode || "").trim().toLowerCase()];
  const base = reversal ? "Booking payment reversal" : "Booking Payment";
  return name ? `${base} (${name})` : base;
}

export function displayTransactionType(row) {
  const type = String(row?.type || "");
  const reason = String(row?.reason || "");
  if (/^Booking Payment( \([A-Za-z ]+\))?$/.test(type)) return type;
  if (/^Booking payment reversal( \([A-Za-z ]+\))?$/.test(type) && type !== "Booking payment reversal") return type;
  const reversal = type === "BOOKING_REVERSAL" || type === "Booking payment reversal";
  const payment = type === "BOOKING_DEBIT" || type === "Booking payment";
  if (!payment && !reversal) return reason || type || "Wallet";
  if (/^Booking Payment \(/.test(reason) || /^Booking payment reversal \(/.test(reason)) return reason;
  const rawService = String(row?.service || "").toUpperCase();
  const code = ["WALLET", "BOOKING", ""].includes(rawService)
    ? row?.serviceCode
    : (row?.serviceCode || row?.service);
  const labeled = bookingPaymentLabel(code, reversal);
  if (!row?.serviceCode && !row?.service && reason && reason !== "Booking payment" && reason !== "Booking payment reversal") {
    return reason;
  }
  return labeled;
}

/** Checkout must not spend a shared mock balance. */
export function getWalletBalance() {
  return 0;
}

export async function loadWallet(marketId = getActiveMarketId()) {
  const token = getLoginToken();
  if (!token) {
    return { currency: "INR", balance: 0, transactions: [], availableLabel: formatMoney(0, marketId, "INR") };
  }
  const data = await apiGet("/account/wallet", { token });
  const balance = Number(data?.balance || 0);
  const currency = data?.currency || "INR";
  return {
    currency,
    balance,
    totalCredits: Number(data?.totalCredits || 0),
    totalDebits: Number(data?.totalDebits || 0),
    demoTopUp: data?.demoTopUp !== false,
    availableLabel: formatMoney(balance, marketId, currency),
    transactions: (data?.transactions || []).map((row) => ({
      id: row.id,
      type: row.type || "",
      service: row.service || "",
      serviceCode: row.serviceCode || "",
      reason: row.reason || row.type || "Wallet",
      date: row.createdAt,
      direction: row.direction,
      status: row.status || "success",
      reference: row.reference || "",
      method: row.method || "",
      feeAmount: Number(row.feeAmount || 0),
      amountLabel: formatMoney(Number(row.amount || 0), marketId, row.currency || currency),
      signedLabel: row.direction === "DEBIT"
        ? `−${formatMoney(Number(row.amount || 0), marketId, row.currency || currency)}`
        : row.direction === "CREDIT"
          ? `+${formatMoney(Number(row.amount || 0), marketId, row.currency || currency)}`
          : formatMoney(Number(row.amount || 0), marketId, row.currency || currency),
    })),
  };
}
