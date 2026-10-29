"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type SelectedFamilyMemberContextType = {
  /**
   * Who the household panel is showing, or `null` for the whole household.
   *
   * NULL IS A REAL VIEW, not an empty state. Clicking the selected person in the
   * sidebar clears the selection and the panel combines everybody's figures into
   * one. That is why `selectionInitialized` below exists: "nobody is selected
   * yet" and "the household view is selected" are both `null`, and only the
   * first should be filled in automatically.
   */
  selectedFamilyMemberId: string | null;
  /**
   * Choose a person, or pass `null` for the household view.
   *
   * MARKS THE SELECTION AS MADE, so nothing auto-selects over it afterwards.
   * Deselecting used to be impossible for exactly that reason: the panel's
   * default-to-me effect saw `null`, could not tell it from a fresh page load,
   * and put the person straight back.
   */
  setSelectedFamilyMemberId: (id: string | null) => void;
  /**
   * The first-load default. A no-op once any choice has been made.
   *
   * Separate from the setter rather than a flag on it so the distinction lives
   * in the name at the call site: this one is the app guessing, that one is the
   * person deciding, and only the guess may be overruled.
   */
  initializeSelection: (id: string) => void;
  /** Whether anything — a guess or a choice — has settled the selection yet. */
  selectionInitialized: boolean;
  // One-shot "scroll to and flash this transaction" signal set by the search
  // bar when a transaction result is picked. The detail layout consumes it
  // (auto-expanding the transaction's day group) and clears it once handled,
  // so it doesn't linger and re-trigger on unrelated re-renders.
  focusTransactionId: string | null;
  setFocusTransactionId: (id: string | null) => void;
};

const SelectedFamilyMemberContext = createContext<SelectedFamilyMemberContextType | null>(null);

export function SelectedFamilyMemberProvider({ children }: { children: React.ReactNode }) {
  const [selectedFamilyMemberId, setSelected] = useState<string | null>(null);
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const [focusTransactionId, setFocusTransactionId] = useState<string | null>(null);

  // A ref as well as the state, and both are needed. The state drives rendering;
  // the ref is what initializeSelection reads, because it has to answer
  // "has anything been chosen yet" SYNCHRONOUSLY. Two members' effects can both
  // run before React re-renders, and a stale `false` from state would let the
  // second one overwrite the first one's choice.
  const initialized = useRef(false);

  const setSelectedFamilyMemberId = useCallback((id: string | null) => {
    initialized.current = true;
    setSelectionInitialized(true);
    setSelected(id);
  }, []);

  const initializeSelection = useCallback((id: string) => {
    // Guarded on the flag rather than on `selectedFamilyMemberId === null`,
    // which is the whole point: once somebody has chosen the household view
    // the id IS null, and a null check would read that as "still undecided"
    // and put a person back on the next render.
    if (initialized.current) return;
    initialized.current = true;
    setSelectionInitialized(true);
    setSelected(id);
  }, []);

  const value = useMemo(
    () => ({
      selectedFamilyMemberId,
      setSelectedFamilyMemberId,
      initializeSelection,
      selectionInitialized,
      focusTransactionId,
      setFocusTransactionId,
    }),
    [
      selectedFamilyMemberId,
      setSelectedFamilyMemberId,
      initializeSelection,
      selectionInitialized,
      focusTransactionId,
    ]
  );

  return (
    <SelectedFamilyMemberContext.Provider value={value}>
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
