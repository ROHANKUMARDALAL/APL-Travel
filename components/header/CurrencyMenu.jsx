"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/useAuth";
import {
  CURRENCY_EVENT,
  getActiveCurrencyCode,
  hydrateDisplayCurrency,
  listCurrencies,
  setActiveCurrency,
} from "@/data/markets";
import { AUTH_EVENT } from "@/lib/auth";

function sortedCurrencies() {
  return listCurrencies().slice().sort((a, b) => {
    if (a.code === "INR") return -1;
    if (b.code === "INR") return 1;
    return a.label.localeCompare(b.label);
  });
}

export default function CurrencyMenu() {
  const { user } = useAuth();
  const locked = Boolean(user?.currency);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("INR");
  const rootRef = useRef(null);
  const currencies = sortedCurrencies();
  const displayCode = user?.currency || code;
  const active = currencies.find((item) => item.code === displayCode) || currencies[0];

  useEffect(() => {
    function sync() {
      if (user?.currency) {
        setActiveCurrency(user.currency);
        setCode(user.currency);
        return;
      }
      setCode(hydrateDisplayCurrency() || getActiveCurrencyCode());
    }
    sync();
    window.addEventListener(CURRENCY_EVENT, sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, [user?.currency]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(nextCode) {
    setOpen(false);
    if (nextCode === code) return;
    setActiveCurrency(nextCode);
    window.location.reload();
  }

  if (locked) {
    return (
      <div className="header-currency" aria-label={`Currency ${active?.code || "INR"}`}>
        <span className="header-currency-trigger is-locked">
          <span className="header-flag" aria-hidden="true">
            {active?.flag}
          </span>
          <span className="header-currency-trigger-code">{active?.code}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="header-currency" ref={rootRef}>
      <button
        type="button"
        className="header-currency-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency ${active?.code || "INR"}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="header-flag" aria-hidden="true">
          {active?.flag}
        </span>
        <span className="header-currency-trigger-code">{active?.code}</span>
        <span className="header-currency-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div className="header-currency-menu" role="listbox" aria-label="Display currency">
          <p className="header-currency-menu-label">Display currency</p>
          {currencies.map((currency) => {
            const selected = currency.code === code;
            return (
              <button
                key={currency.code}
                type="button"
                role="option"
                aria-selected={selected}
                className={`header-currency-option ${selected ? "is-active" : ""}`}
                onClick={() => choose(currency.code)}
              >
                <span className="header-flag" aria-hidden="true">
                  {currency.flag}
                </span>
                <span className="header-currency-copy">
                  <span className="header-currency-name">{currency.label}</span>
                  <span className="header-currency-code">{currency.code}</span>
                </span>
                <span className="header-currency-symbol" aria-hidden="true">
                  {selected ? "✓" : currency.symbolHint}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
