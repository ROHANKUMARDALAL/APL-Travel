import { isValidPhoneNumber, validatePhoneNumberLength } from "libphonenumber-js";

export function phoneMessage(iso, mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (!iso) return "Choose a country.";
  if (!digits) return "Enter a mobile number.";
  const length = validatePhoneNumberLength(digits, iso);
  if (length === "TOO_SHORT") return "That number is too short for the selected country.";
  if (length === "TOO_LONG" || length === "INVALID_LENGTH") return "That number is too long for the selected country.";
  if (length || !isValidPhoneNumber(digits, iso)) return "Enter a valid mobile number for the selected country.";
  return "";
}
