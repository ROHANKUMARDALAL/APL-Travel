import { Suspense } from "react";
import TransactionsClient from "@/components/account/TransactionsClient";

export const metadata = {
  title: "All Transactions | APL Travel",
  description: "Payments, wallet movements and refunds for your account.",
};

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="account-loading" />}>
      <TransactionsClient />
    </Suspense>
  );
}
