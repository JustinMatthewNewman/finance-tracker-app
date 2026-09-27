"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSelectMyPrivacyMode } from "@/src/dataconnect-generated/react";
import { useUserSettings } from "./UserSettingsContext";
import { currencySymbolOf, maskedMoney } from "@/lib/privacy";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyCompact,
  isCurrencyCode,
  type CurrencyCode,
  type Minor,
} from "@/lib/money";

type PrivacyModeContextType = {
  privacyMode: boolean;
  setPrivacyMode: (value: boolean) => void;
  /**
   * formatMoney, masked when privacy mode is on.
   *
   * EVERY AMOUNT ON SCREEN GOES THROUGH HERE rather than each component checking
   * the flag itself. A component that formats money directly is one the toggle
   * silently misses, and a screen that hides eleven figures out of twelve is
   * worse than one that hides none — the person believes they are covered.
   */
  formatAmount: (minor: Minor, currency?: CurrencyCode) => string;
  /** The compact form ("$1.2k"), masked identically. */
  formatAmountCompact: (minor: Minor, currency?: CurrencyCode) => string;
};

const PrivacyModeContext = createContext<PrivacyModeContextType | null>(null);

// Replaces every amount on screen with dots. See lib/privacy.ts for what this
// does and does not protect — it is a defence against a glance, not a boundary.
//
// Persisted like every other display preference, so it survives a reload and
// follows the account to another device. Somebody who turned it on for a reason
// should not find it silently off after a refresh.
//
// Defaults to false until the DB value loads. That direction is worth a note,
// because it is the opposite of the usual "fail closed": a default of true would
// mask every figure for a frame on every page load for everybody, and a ledger
// that flashes rows of dots on load reads as broken. The flag is not a security
// boundary, so the cost of showing a real amount for one frame to the person who
// is already looking at their own screen is nil.
export function PrivacyModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { privacyMode: dbPrivacyMode, currencyCode, refetch } = useUserSettings();
  const [privacyMode, setPrivacyModeState] = useState(false);
  const selectMutation = useSelectMyPrivacyMode();

  useEffect(() => {
    if (dbPrivacyMode == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrivacyModeState(dbPrivacyMode);
  }, [dbPrivacyMode]);

  const setPrivacyMode = useCallback(
    (value: boolean) => {
      setPrivacyModeState(value);
      if (user?.uid) {
        selectMutation.mutate({ privacyMode: value }, { onSuccess: () => refetch() });
      }
    },
    [user?.uid, selectMutation, refetch]
  );

  const fallback: CurrencyCode = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;

  const value = useMemo<PrivacyModeContextType>(() => {
    const mask = (currency: CurrencyCode) => maskedMoney(currencySymbolOf(currency));
    return {
      privacyMode,
      setPrivacyMode,
      formatAmount: (minor, currency = fallback) =>
        privacyMode ? mask(currency) : formatMoney(minor, currency),
      formatAmountCompact: (minor, currency = fallback) =>
        privacyMode ? mask(currency) : formatMoneyCompact(minor, currency),
    };
  }, [privacyMode, setPrivacyMode, fallback]);

  return <PrivacyModeContext.Provider value={value}>{children}</PrivacyModeContext.Provider>;
}

export function usePrivacyMode() {
  const ctx = useContext(PrivacyModeContext);
  if (!ctx) {
    throw new Error("usePrivacyMode must be used within a PrivacyModeProvider");
  }
  return ctx;
}
