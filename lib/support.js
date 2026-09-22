/**
 * Support repository — FAQ, contact helpers, mock ticket requests.
 * Replace with a real ticketing API later.
 */

import {
  SUPPORT_BOOKING_ISSUES,
  SUPPORT_FAQ,
  SUPPORT_HOURS,
  SUPPORT_TOPICS,
} from "@/data/mock/support";
import { FOOTER } from "@/data/static";

export const SUPPORT_REQUESTS_KEY = "apl-support-requests";

export function listSupportTopics() {
  return SUPPORT_TOPICS;
}

export function listSupportFaqs(topicId = "all") {
  if (!topicId || topicId === "all") return SUPPORT_FAQ;
  return SUPPORT_FAQ.filter((item) => item.topicId === topicId);
}

export function getSupportHours() {
  return SUPPORT_HOURS;
}

export function getSupportContact() {
  return {
    email: FOOTER.contact.email,
    phone: FOOTER.contact.phone,
    address: FOOTER.contact.address,
    liveChatLabel: "Start live chat",
    liveChatNote:
      "Live chat is unavailable in this build — please use email or the contact form.",
  };
}

export function listBookingIssueTypes() {
  return SUPPORT_BOOKING_ISSUES;
}

function readRequests() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SUPPORT_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRequests(items) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SUPPORT_REQUESTS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function listSupportRequests(email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  const items = readRequests();
  if (!normalized) return items;
  return items.filter(
    (item) => String(item.email || "").toLowerCase() === normalized,
  );
}

function generateTicketRef() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SUP-${n}`;
}

/**
 * Mock booking-related support request.
 */
export function submitBookingSupportRequest({
  email,
  name,
  bookingReference,
  issueType,
  message,
}) {
  if (!bookingReference) {
    return { ok: false, message: "Select a booking" };
  }
  if (!issueType) {
    return { ok: false, message: "Select an issue type" };
  }

  const issue =
    SUPPORT_BOOKING_ISSUES.find((item) => item.id === issueType)?.label ||
    issueType;

  const ticket = {
    id: generateTicketRef(),
    type: "booking",
    email: email || "",
    name: name || "",
    bookingReference,
    issueType,
    issueLabel: issue,
    message: String(message || "").trim(),
    status: "submitted",
    createdAt: new Date().toISOString(),
  };

  const next = [ticket, ...readRequests()];
  writeRequests(next);

  return {
    ok: true,
    ticket,
    message: "Request submitted. Our team will review it shortly.",
  };
}

/**
 * Mock general contact form submission.
 */
export function submitContactRequest({ name, email, topic, message }) {
  if (!String(name || "").trim()) {
    return { ok: false, message: "Enter your name" };
  }
  if (!String(email || "").trim() || !String(email).includes("@")) {
    return { ok: false, message: "Enter a valid email" };
  }
  if (!String(message || "").trim()) {
    return { ok: false, message: "Enter a short message" };
  }

  const ticket = {
    id: generateTicketRef(),
    type: "contact",
    name: String(name).trim(),
    email: String(email).trim(),
    topic: topic || "other",
    message: String(message).trim(),
    status: "submitted",
    createdAt: new Date().toISOString(),
  };

  writeRequests([ticket, ...readRequests()]);

  return {
    ok: true,
    ticket,
    message: "Message sent. We’ll get back to you by email.",
  };
}
