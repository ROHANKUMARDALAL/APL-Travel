"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, signUp } from "@/lib/auth";
import { DEMO_AUTH_EMAIL } from "@/data/mock/user";

function safeNextPath(next) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/my-trips";
  return next;
}

export default function AuthForms({ initialMode = "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace(nextPath);
  }

  function handleSignUp(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = signUp(signUpForm);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace(nextPath);
  }

  return (
    <div className="auth-card">
      <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={`auth-mode-tab ${mode === "login" ? "is-active" : ""}`}
          onClick={() => switchMode("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-mode-tab ${mode === "signup" ? "is-active" : ""}`}
          onClick={() => switchMode("signup")}
        >
          Sign up
        </button>
      </div>

      {mode === "login" ? (
        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <h1 className="section-title">Welcome back</h1>
          <p className="section-copy">
            Sign in to manage trips, wallet, and referrals.
          </p>

          <label className="search-field">
            <span className="field-label">Email</span>
            <input
              className={`field-input ${error ? "is-invalid" : ""}`}
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
            />
          </label>
          <label className="search-field">
            <span className="field-label">Password</span>
            <input
              className={`field-input ${error ? "is-invalid" : ""}`}
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
            />
          </label>

          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="auth-demo-hint">
            <p className="field-label">Sample credentials</p>
            <p className="dev-note">Email: {DEMO_AUTH_EMAIL}</p>
            <p className="dev-note">Password: Test@123</p>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleSignUp} noValidate>
          <h1 className="section-title">Create an account</h1>
          <p className="section-copy">
            Create an account to save trips and manage your profile.
          </p>

          <label className="search-field">
            <span className="field-label">Full name</span>
            <input
              className="field-input"
              autoComplete="name"
              value={signUpForm.name}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, name: e.target.value })
              }
            />
          </label>
          <label className="search-field">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              autoComplete="email"
              value={signUpForm.email}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, email: e.target.value })
              }
            />
          </label>
          <label className="search-field">
            <span className="field-label">Phone</span>
            <input
              className="field-input"
              type="tel"
              autoComplete="tel"
              value={signUpForm.phone}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, phone: e.target.value })
              }
            />
          </label>
          <label className="search-field">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={signUpForm.password}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, password: e.target.value })
              }
            />
          </label>

          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
      )}

      <p className="auth-footer-links">
        <Link href="/find-booking">Find your booking</Link>
        <span aria-hidden="true">·</span>
        <Link href="/support">Support</Link>
      </p>
    </div>
  );
}
