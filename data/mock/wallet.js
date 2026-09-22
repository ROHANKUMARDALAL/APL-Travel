/**
 * Mock Travel Wallet data — shared conceptually with checkout credits.
 * Replace via lib/wallet.js later.
 */

export const MOCK_WALLET = {
  /** Available balance — same amounts checkout applies as mock credit. */
  available: {
    USD: 50,
    GBP: 40,
  },
  pending: {
    USD: 15,
    GBP: 12,
  },
  transactions: [
    {
      id: "wtx-001",
      description: "Referral reward — Priya K.",
      date: "2026-09-12",
      type: "credit",
      category: "referral_reward",
      amount: { USD: 20, GBP: 16 },
      status: "completed",
    },
    {
      id: "wtx-002",
      description: "Wallet used on checkout",
      date: "2026-09-08",
      type: "debit",
      category: "wallet_usage",
      amount: { USD: 25, GBP: 20 },
      status: "completed",
    },
    {
      id: "wtx-003",
      description: "Refund credit — TRV-228847",
      date: "2026-09-02",
      type: "credit",
      category: "refund_credit",
      amount: { USD: 57, GBP: 45 },
      status: "completed",
    },
    {
      id: "wtx-004",
      description: "Booking credit — welcome bonus",
      date: "2026-08-20",
      type: "credit",
      category: "booking_credit",
      amount: { USD: 15, GBP: 12 },
      status: "pending",
    },
    {
      id: "wtx-005",
      description: "Referral reward — pending review",
      date: "2026-09-18",
      type: "credit",
      category: "referral_reward",
      amount: { USD: 15, GBP: 12 },
      status: "pending",
    },
  ],
};
