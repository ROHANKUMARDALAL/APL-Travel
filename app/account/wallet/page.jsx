import { Suspense } from "react";
import WalletClient from "@/components/account/WalletClient";

export const metadata = {
  title: "My Wallet | APL Travel",
  description: "View your customer wallet balance, credits and recent activity.",
};

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="account-loading" />}>
      <WalletClient />
    </Suspense>
  );
}
