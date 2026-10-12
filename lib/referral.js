import { apiGet } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";

export async function loadReferralProfile() {
  const token = getLoginToken();
  if (!token) return { code: "" };
  const data = await apiGet("/account/referral", { token });
  const code = data?.referralCode || "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    code,
    shareUrl: code ? `${origin}/?ref=${encodeURIComponent(code)}` : "",
  };
}
