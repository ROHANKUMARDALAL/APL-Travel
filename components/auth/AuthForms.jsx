"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, signUp } from "@/lib/auth";
import { listCurrencies } from "@/data/markets";
import PasswordField from "@/components/auth/PasswordField";
import CaptchaField, { useCaptcha } from "@/components/auth/CaptchaField";

function safeNextPath(next) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/my-trips";
  return next;
}

export default function AuthForms({ initialMode = "login", onSuccess = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const captcha = useCaptcha();
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    currency: "INR",
  });
  const currencies = listCurrencies()
    .slice()
    .sort((a, b) => {
      if (a.code === "INR") return -1;
      if (b.code === "INR") return 1;
      return a.label.localeCompare(b.label);
    });

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login({
      email: loginForm.email,
      password: loginForm.password,
      captchaId: captcha.captcha?.captchaId,
      captchaAnswer: captcha.answer,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      captcha.refresh();
      return;
    }
    if (onSuccess) {
      onSuccess(result.user);
      return;
    }
    router.replace(nextPath);
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await signUp({
      ...signUpForm,
      captchaId: captcha.captcha?.captchaId,
      captchaAnswer: captcha.answer,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      captcha.refresh();
      return;
    }
    if (onSuccess) {
      onSuccess(result.user);
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
            <h1 className="section-title" id="auth-modal-title">
              Welcome back
            </h1>
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
          <PasswordField
            label="Password"
            autoComplete="current-password"
            invalid={Boolean(error)}
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />
          <CaptchaField
            captcha={captcha.captcha}
            answer={captcha.answer}
            onAnswer={captcha.setAnswer}
            onRefresh={captcha.refresh}
            loading={captcha.loading}
            loadError={captcha.loadError}
          />

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
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleSignUp} noValidate>
          <h1 className="section-title" id="auth-modal-title">
            Create an account
          </h1>
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
            <span className="field-label">Currency</span>
            <select
              className="field-select"
              value={signUpForm.currency}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, currency: e.target.value })
              }
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} · {currency.label}
                </option>
              ))}
            </select>
          </label>
          <p className="dev-note">
            Profile, searches, and payment stay in this currency.
          </p>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            invalid={Boolean(error)}
            value={signUpForm.password}
            onChange={(e) =>
              setSignUpForm({ ...signUpForm, password: e.target.value })
            }
          />
          <CaptchaField
            captcha={captcha.captcha}
            answer={captcha.answer}
            onAnswer={captcha.setAnswer}
            onRefresh={captcha.refresh}
            loading={captcha.loading}
            loadError={captcha.loadError}
          />

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
