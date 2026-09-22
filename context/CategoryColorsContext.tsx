"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSelectMyCategoryColorsEnabled } from "@/src/dataconnect-generated/react";
import { useUserSettings } from "./UserSettingsContext";

type CategoryColorsContextType = {
  categoryColorsEnabled: boolean;
  setCategoryColorsEnabled: (value: boolean) => void;
};

const CategoryColorsContext = createContext<CategoryColorsContextType | null>(null);

// Whether a category's assigned color (Category.color) tints the surfaces it
// appears on. Persisted per account, exactly like bordersEnabled — same
// fire-and-forget write, and the same default-to-true-until-loaded so the app
// doesn't flash uncolored before the DB value arrives.
//
// Purely a display switch: turning it off never clears a category's color. The
// color is shared data, this preference is personal, so muting the tints
// affects only the person who did it.
export function CategoryColorsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { categoryColorsEnabled: dbCategoryColorsEnabled, refetch } = useUserSettings();
  const [categoryColorsEnabled, setStateValue] = useState(true);
  const selectMutation = useSelectMyCategoryColorsEnabled();

  // Guards a real race. The stored value arrives asynchronously, and the
  // switch is interactive from first paint — so a user who lands on Settings
  // and clicks immediately can have their click silently undone by the
  // in-flight fetch resolving a moment later and writing the old value back
  // over it.
  //
  // Once either side has spoken — the fetch has hydrated, or the user has
  // chosen — the DB value stops being applied. User intent wins over a
  // response that was already stale when it landed.
  //
  // NOTE: the sibling preference providers (BordersProvider,
  // PerformanceModeProvider, ...) carry the source template's original pattern
  // and therefore the same latent race; only this one is fixed here.
  const settledRef = useRef(false);

  useEffect(() => {
    if (dbCategoryColorsEnabled == null || settledRef.current) return;
    settledRef.current = true;
    setStateValue(dbCategoryColorsEnabled);
  }, [dbCategoryColorsEnabled]);

  const setCategoryColorsEnabled = useCallback(
    (value: boolean) => {
      settledRef.current = true;
      setStateValue(value);
      // Fire-and-forget: local state already drives the UI, so the toggle
      // doesn't wait on the round trip.
      if (user?.uid) {
        selectMutation.mutate({ categoryColorsEnabled: value }, { onSuccess: () => refetch() });
      }
    },
    [user?.uid, selectMutation, refetch]
  );

  return (
    <CategoryColorsContext.Provider value={{ categoryColorsEnabled, setCategoryColorsEnabled }}>
      {children}
    </CategoryColorsContext.Provider>
  );
}

export function useCategoryColorsSetting() {
  const ctx = useContext(CategoryColorsContext);
  if (!ctx) {
    throw new Error("useCategoryColorsSetting must be used within a CategoryColorsProvider");
  }
  return ctx;
}
