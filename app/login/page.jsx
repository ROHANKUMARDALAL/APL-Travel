import { Suspense } from "react";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata = {
  title: "Sign in | APL Travel",
  description: "Sign in to manage your trips (demo authentication).",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <LoginPageClient initialMode="login" />
    </Suspense>
  );
}
