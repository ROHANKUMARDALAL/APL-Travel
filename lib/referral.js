/**
 * Referral repository — replace MOCK_REFERRAL with API later.
 * Rewards use the global display-currency helpers (not tied to a country).
 */

import { MOCK_REFERRAL } from "@/data/mock/referral";
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

export function getReferralProfile(options = {}) {
  const marketId = options.marketId || getActiveMarketId();
  const data = MOCK_REFERRAL;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://apltravel.demo";
  const pending = resolveAmountMap(data.pendingRewards, marketId);
  const earned = resolveAmountMap(data.earnedRewards, marketId);

  return {
    code: data.code,
    sharePath: data.sharePath,
    shareUrl: `${origin}${data.sharePath}`,
    successful: data.successful,
    pendingRewards: pending.amount,
    earnedRewards: earned.amount,
    pendingRewardsLabel: formatMoney(pending.amount, marketId, pending.currency),
    earnedRewardsLabel: formatMoney(earned.amount, marketId, earned.currency),
    explanation:
      "Share your referral code with friends. When eligible bookings are completed, rewards may be credited to your Travel Wallet.",
  };
}

export function listReferrals(options = {}) {
  const marketId = options.marketId || getActiveMarketId();

  return (MOCK_REFERRAL.referrals || []).map((item) => {
    const reward = resolveAmountMap(item.reward, marketId);
    return {
      ...item,
      rewardAmount: reward.amount,
      rewardLabel: formatMoney(reward.amount, marketId, reward.currency),
      statusLabel: item.status === "pending" ? "Pending" : "Completed",
    };
  });
}
