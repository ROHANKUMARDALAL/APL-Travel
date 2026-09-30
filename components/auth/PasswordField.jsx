"use client";

import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.5 10.7A2.5 2.5 0 0 0 12 14.5" />
      <path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 3.8" />
      <path d="M6.1 6.3C3.7 8 2 12 2 12a17 17 0 0 0 6.2 5.5c1.2.6 2.5.9 3.8.9" />
    </svg>
  );
}

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  invalid = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="search-field">
      <span className="field-label">{label}</span>
      <span className="password-field">
        <input
          className={`field-input ${invalid ? "is-invalid" : ""}`}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((open) => !open)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}
