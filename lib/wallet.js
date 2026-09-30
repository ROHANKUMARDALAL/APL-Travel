/**
 * Wallet repository — single source for account wallet + checkout credit balance.
 * Swap MOCK_WALLET for API responses later.
 * Amounts use the global display-currency helpers (not tied to a country).
 */

import { MOCK_WALLET } from "@/data/mock/wallet";
import {
  convertAmount,
  formatMoney,
  getActiveCurrencyCode,
  getActiveMarketId,
} from "@/data/markets";

function currencyFor(marketId = getActiveMarketId()) {
  return getActiveCurrencyCode(marketId);
}

function resolveAmountMap(map, marketId = getActiveMarketId()) {
  const preferred = currencyFor(marketId);
  if (!map || typeof map !== "object") return { amount: 0, currency: preferred };
  if (map[preferred] != null) return { amount: map[preferred], currency: preferred };
  const sourceCode =
    ["INR", "USD", "GBP", "EUR"].find((code) => map[code] != null) ||
    Object.keys(map).find((code) => map[code] != null);
  if (!sourceCode || map[sourceCode] == null) return { amount: 0, currency: preferred };
  return {
    amount: convertAmount(map[sourceCode], sourceCode, preferred),
    currency: preferred,
  };
}

/**
 * Available balance for checkout mock credit.
 * Only returns a balance when the active display currency has a mock amount.
 */
export function getWalletBalance(marketId = getActiveMarketId()) {
  return resolveAmountMap(MOCK_WALLET.available, marketId).amount;
}

export function getPendingCredits(marketId = getActiveMarketId()) {
  const { amount } = resolveAmountMap(MOCK_WALLET.pending, marketId);
  return amount;
}

export function getWalletSummary(marketId = getActiveMarketId()) {
  const availableResolved = resolveAmountMap(MOCK_WALLET.available, marketId);
  const pendingResolved = resolveAmountMap(MOCK_WALLET.pending, marketId);
  // Checkout-usable balance stays currency-exact; summary can show fallback labels.
  const available = getWalletBalance(marketId);
  return {
    marketId,
    currency: currencyFor(marketId),
    available,
    pending: pendingResolved.amount,
    availableLabel: formatMoney(
      available || availableResolved.amount,
      marketId,
      available ? currencyFor(marketId) : availableResolved.currency,
    ),
    pendingLabel: formatMoney(
      pendingResolved.amount,
      marketId,
      pendingResolved.currency,
    ),
  };
}

export function listWalletTransactions(options = {}) {
  const marketId = options.marketId || getActiveMarketId();
  const items = (MOCK_WALLET.transactions || []).map((tx) => {
    const resolved = resolveAmountMap(tx.amount, marketId);
    return {
      ...tx,
      currency: resolved.currency,
      amount: resolved.amount,
      amountLabel: formatMoney(resolved.amount, marketId, resolved.currency),
      signedLabel:
        tx.type === "debit"
          ? `−${formatMoney(resolved.amount, marketId, resolved.currency)}`
          : `+${formatMoney(resolved.amount, marketId, resolved.currency)}`,
      typeLabel: tx.type === "debit" ? "Debit" : "Credit",
      statusLabel:
        tx.status === "pending"
          ? "Pending"
          : tx.status === "completed"
            ? "Completed"
            : tx.status,
    };
  });

  return items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
