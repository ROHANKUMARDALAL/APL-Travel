/**
 * Mock payment simulator — replace with a real payment provider later.
 * Never stores card details.
 */

export function formatCardNumber(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateCardFields(card) {
  const errors = {};
  const number = String(card.number || "").replace(/\D/g, "");
  const expiry = String(card.expiry || "").replace(/\D/g, "");
  const cvv = String(card.cvv || "").replace(/\D/g, "");
  const name = String(card.name || "").trim();
  const country = String(card.country || "").trim();

  if (number.length < 15) errors.number = "Enter a valid card number";
  if (expiry.length !== 4) errors.expiry = "Use MM/YY";
  else {
    const month = Number(expiry.slice(0, 2));
    if (month < 1 || month > 12) errors.expiry = "Invalid month";
  }
  if (cvv.length < 3) errors.cvv = "Enter CVV";
  if (name.length < 2) errors.name = "Enter the name on card";
  if (!country) errors.country = "Select a billing country";

  return errors;
}

/**
 * Simulate async payment.
 * Cards ending in 0000 force failure for testing.
 * forceFail overrides for a dedicated failure toggle.
 */
export function simulateMockPayment({ method, card, forceFail = false }) {
  return new Promise((resolve) => {
    const delay = 900 + Math.floor(Math.random() * 500);
    setTimeout(() => {
      if (forceFail) {
        resolve({
          ok: false,
          status: "failed",
          message:
            "Mock payment failed. You were not charged. Try again or use another method.",
        });
        return;
      }

      if (method === "card") {
        const number = String(card?.number || "").replace(/\D/g, "");
        if (number.endsWith("0000")) {
          resolve({
            ok: false,
            status: "failed",
            message:
              "Mock decline: cards ending in 0000 are rejected for testing. You were not charged.",
          });
          return;
        }
      }

      resolve({
        ok: true,
        status: "paid",
        message: "Mock payment approved (demo only — no real charge).",
        method,
        // Never include raw card number — last4 only for display.
        last4:
          method === "card"
            ? String(card?.number || "")
                .replace(/\D/g, "")
                .slice(-4)
            : null,
      });
    }, delay);
  });
}
