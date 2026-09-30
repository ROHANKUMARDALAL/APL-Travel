"use client";

import { useEffect, useState } from "react";
import { AUTH_EVENT, getCurrentUser, refreshAccountFromServer } from "@/lib/auth";
import { CURRENCY_EVENT, hydrateDisplayCurrency, setActiveCurrency } from "@/data/markets";

/** Keeps prices in sync after the profile currency changes. */
export default function CurrencySync({ children }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    function sync() {
      setTick((value) => value + 1);
    }
    function applyAccountCurrency() {
      const accountCurrency = getCurrentUser()?.currency;
      if (accountCurrency) setActiveCurrency(accountCurrency);
      else hydrateDisplayCurrency();
      sync();
    }
    applyAccountCurrency();
    refreshAccountFromServer().finally(sync);
    window.addEventListener(CURRENCY_EVENT, sync);
    window.addEventListener(AUTH_EVENT, applyAccountCurrency);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, sync);
      window.removeEventListener(AUTH_EVENT, applyAccountCurrency);
    };
  }, []);

  return children;
}
