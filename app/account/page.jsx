import { Suspense } from "react";
import ProfileClient from "@/components/account/ProfileClient";

export const metadata = {
  title: "Account | APL Travel",
  description: "Your APL Travel customer profile.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="account-loading" />}>
      <ProfileClient />
    </Suspense>
  );
}
