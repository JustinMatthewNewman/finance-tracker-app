"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSelectMyShowInternalTransfers } from "@/src/dataconnect-generated/react";
import { useUserSettings } from "./UserSettingsContext";

type InternalTransfersContextType = {
  showInternalTransfers: boolean;
  setShowInternalTransfers: (value: boolean) => void;
};

const InternalTransfersContext = createContext<InternalTransfersContextType | null>(null);

// Whether money moved between the household's own accounts counts as income and
// spending.
//
// UNLIKE THE OTHER TOGGLES, THIS ONE CHANGES THE TOTALS — deliberately, and it is
// the reason the feature exists. A transfer's two legs are a real credit and a
// real debit, so each sweep into savings adds the same amount to both sides of the
// month.
//
// It changes the NET too, but only where one leg is missing. With both accounts
// imported the legs cancel and only in and out move; with just one imported,
// money swept into the un-imported account is reported as spending when it never
// left the household, and excluding it is what makes the net right.
//
// Because it moves figures, every screen that applies it also has to SAY it is
// applying it — see `excludedTransferCount` in lib/ledgerTotals.ts. A total that
// silently omits rows the table below it shows is unreconcilable by hand, which
// is the one thing somebody does when they distrust a ledger.
//
// Defaults TRUE until the DB value loads, matching both the column default and
// the plain reading of a statement: the lines are on it.
export function InternalTransfersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showInternalTransfers: dbShow, refetch } = useUserSettings();
  const [showInternalTransfers, setShowState] = useState(true);
  const selectMutation = useSelectMyShowInternalTransfers();

  useEffect(() => {
    if (dbShow == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowState(dbShow);
  }, [dbShow]);

  const setShowInternalTransfers = useCallback(
    (value: boolean) => {
      setShowState(value);
      if (user?.uid) {
        selectMutation.mutate({ showInternalTransfers: value }, { onSuccess: () => refetch() });
      }
    },
    [user?.uid, selectMutation, refetch]
  );

  return (
    <InternalTransfersContext.Provider value={{ showInternalTransfers, setShowInternalTransfers }}>
      {children}
    </InternalTransfersContext.Provider>
  );
}

export function useInternalTransfers() {
  const ctx = useContext(InternalTransfersContext);
  if (!ctx) {
    throw new Error("useInternalTransfers must be used within an InternalTransfersProvider");
  }
  return ctx;
}
