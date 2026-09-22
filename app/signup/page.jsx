import { Suspense } from "react";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata = {
  title: "Sign up | APL Travel",
  description: "Create a demo customer account.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <LoginPageClient initialMode="signup" />
    </Suspense>
  );
}
