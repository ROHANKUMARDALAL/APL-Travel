/**
 * Mock referral program data for the demo customer.
 * Replace via lib/referral.js later.
 */

import { DEMO_USER } from "@/data/mock/user";

export const MOCK_REFERRAL = {
  userId: DEMO_USER.id,
  code: "TRAVELRAHUL",
  sharePath: "/signup?ref=TRAVELRAHUL",
  successful: 2,
  pendingRewards: {
    USD: 15,
    GBP: 12,
  },
  earnedRewards: {
    USD: 40,
    GBP: 32,
  },
  referrals: [
    {
      id: "ref-001",
      name: "Priya K.",
      status: "completed",
      bookedAt: "2026-08-28",
      reward: { USD: 20, GBP: 16 },
    },
    {
      id: "ref-002",
      name: "Amit S.",
      status: "completed",
      bookedAt: "2026-07-14",
      reward: { USD: 20, GBP: 16 },
    },
    {
      id: "ref-003",
      name: "Guest invite",
      status: "pending",
      bookedAt: "2026-09-16",
      reward: { USD: 15, GBP: 12 },
    },
  ],
};
