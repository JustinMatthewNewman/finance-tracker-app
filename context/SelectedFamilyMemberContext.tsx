"use client";

import { createContext, useContext, useState } from "react";

type SelectedFamilyMemberContextType = {
  selectedFamilyMemberId: string | null;
  setSelectedFamilyMemberId: (id: string | null) => void;
  // One-shot "scroll to and flash this transaction" signal set by the search
  // bar when a transaction result is picked. The detail layout consumes it
  // (auto-expanding the transaction's day group) and clears it once handled,
  // so it doesn't linger and re-trigger on unrelated re-renders.
  focusTransactionId: string | null;
  setFocusTransactionId: (id: string | null) => void;
};

const SelectedFamilyMemberContext = createContext<SelectedFamilyMemberContextType | null>(null);

export function SelectedFamilyMemberProvider({ children }: { children: React.ReactNode }) {
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [focusTransactionId, setFocusTransactionId] = useState<string | null>(null);

  return (
    <SelectedFamilyMemberContext.Provider
      value={{
        selectedFamilyMemberId,
        setSelectedFamilyMemberId,
        focusTransactionId,
        setFocusTransactionId,
      }}
    >
      {children}
    </SelectedFamilyMemberContext.Provider>
  );
}

export function useSelectedFamilyMember() {
  const ctx = useContext(SelectedFamilyMemberContext);
  if (!ctx) {
    throw new Error("useSelectedFamilyMember must be used within a SelectedFamilyMemberProvider");
  }
  return ctx;
}
