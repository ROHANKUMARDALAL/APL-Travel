import { apiGet } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { formatMoney, getActiveMarketId } from "@/data/markets";

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
    availableLabel: formatMoney(balance, marketId, currency),
    transactions: (data?.transactions || []).map((row) => ({
      id: row.id,
      reason: row.reason || row.type || "Wallet",
      date: row.createdAt,
      direction: row.direction,
      amountLabel: formatMoney(Number(row.amount || 0), marketId, row.currency || currency),
      signedLabel:
        row.direction === "DEBIT"
          ? `−${formatMoney(Number(row.amount || 0), marketId, row.currency || currency)}`
          : `+${formatMoney(Number(row.amount || 0), marketId, row.currency || currency)}`,
    })),
  };
}
