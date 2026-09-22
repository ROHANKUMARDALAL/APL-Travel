/**
 * Mock customer bookings — shaped like Phase 3 confirmation records
 * so UI can treat live confirmations and account trips the same way.
 * Replace with API responses later via lib/userBookings.js.
 */

import { DEMO_USER } from "@/data/mock/user";

/**
 * Shared booking shape (aligned with saveConfirmation payload):
 * reference, service, id, searchQuery, travellers, contact, extras,
 * selectedRoomId?, selectedSeat?, payable, payment, bookingStatus, tripPhase, createdAt
 */
export const MOCK_USER_BOOKINGS = [
  {
    reference: "TRV-482731",
    service: "flight",
    id: "fl-atl-001",
    tripPhase: "upcoming",
    bookingStatus: "confirmed",
    searchQuery: {
      from: "New York (JFK)",
      to: "London (LHR)",
      depart: "2026-10-18",
      return: "2026-10-25",
      adults: 1,
      children: 0,
      infants: 0,
      fareType: "normal",
    },
    travellers: [
      {
        title: "Mr",
        firstName: "Rahul",
        lastName: "Sharma",
        dob: "1992-04-12",
      },
    ],
    contact: {
      email: DEMO_USER.email,
      phone: DEMO_USER.phone,
    },
    extras: ["bag-23"],
    payable: {
      currency: "USD",
      base: 420,
      taxes: 69,
      serviceFee: 12,
      extras: 55,
      discount: 0,
      wallet: 0,
      totalPayable: 556,
      baseLabel: "$420",
      taxesLabel: "$69",
      serviceFeeLabel: "$12",
      extrasLabel: "$55",
      discountLabel: "$0",
      walletLabel: "$0",
      totalPayableLabel: "$556",
    },
    payment: {
      status: "paid",
      method: "card",
      last4: "4242",
      paidAt: "2026-09-10T14:22:00.000Z",
    },
    policy:
      "Changes allowed · Refundable with fee. Free date change once within 24h of booking.",
    createdAt: "2026-09-10T14:22:00.000Z",
  },
  {
    reference: "TRV-391204",
    service: "hotel",
    id: "ht-001",
    selectedRoomId: "ht-001-room-std",
    tripPhase: "completed",
    bookingStatus: "completed",
    searchQuery: {
      destination: "London",
      checkIn: "2026-08-02",
      checkOut: "2026-08-05",
      guests: 2,
      rooms: 1,
    },
    travellers: {
      lead: { firstName: "Rahul", lastName: "Sharma" },
      additional: [{ firstName: "Priya", lastName: "Sharma" }],
    },
    contact: {
      email: DEMO_USER.email,
      phone: DEMO_USER.phone,
    },
    extras: ["breakfast"],
    payable: {
      currency: "USD",
      base: 594,
      taxes: 126,
      serviceFee: 12,
      extras: 84,
      discount: 20,
      wallet: 0,
      totalPayable: 796,
      baseLabel: "$594",
      taxesLabel: "$126",
      serviceFeeLabel: "$12",
      extrasLabel: "$84",
      discountLabel: "$20",
      walletLabel: "$0",
      totalPayableLabel: "$796",
    },
    payment: {
      status: "paid",
      method: "card",
      last4: "1111",
      paidAt: "2026-07-20T09:10:00.000Z",
    },
    policy:
      "Free cancellation until 24h before check-in. No-shows are non-refundable.",
    createdAt: "2026-07-20T09:10:00.000Z",
  },
  {
    reference: "TRV-228847",
    service: "bus",
    id: "bs-001",
    selectedSeat: "2A",
    tripPhase: "cancelled",
    bookingStatus: "cancelled",
    searchQuery: {
      from: "New York",
      to: "Boston",
      date: "2026-09-01",
      passengers: 1,
    },
    travellers: {
      firstName: "Rahul",
      lastName: "Sharma",
    },
    contact: {
      email: DEMO_USER.email,
      phone: DEMO_USER.phone,
    },
    extras: ["priority-board"],
    payable: {
      currency: "USD",
      base: 32,
      taxes: 7,
      serviceFee: 12,
      extras: 6,
      discount: 0,
      wallet: 0,
      totalPayable: 57,
      baseLabel: "$32",
      taxesLabel: "$7",
      serviceFeeLabel: "$12",
      extrasLabel: "$6",
      discountLabel: "$0",
      walletLabel: "$0",
      totalPayableLabel: "$57",
    },
    payment: {
      status: "refunded",
      method: "card",
      last4: "4242",
      paidAt: "2026-08-15T18:40:00.000Z",
    },
    policy:
      "Free cancellation up to 24h before departure. Refund issued to original payment method.",
    createdAt: "2026-08-15T18:40:00.000Z",
  },
];
