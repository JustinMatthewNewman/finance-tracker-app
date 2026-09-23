"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "@/hooks/useAuth";
import { getMyUser } from "@/src/dataconnect-generated";
import { DEFAULT_CURRENCY } from "@/lib/money";

type UserSettingsState = {
  // The account's own row id and the household it belongs to. Not
  // preferences, but they ride along here because they arrive in the same
  // GetMyUser response every preference below comes from, and the whole point
  // of this provider is that that response is fetched once. A FamilyContext
  // reading `family` would mean a second SERVER_ONLY GetMyUser on every page
  // load, to learn something already sitting in this one.
  userId: string | null;
  // Null means "has not joined or created a household yet", which is the
  // signal components/Onboarding/OnboardingGate.tsx acts on. It is not an
  // error and not a loading state — see `initialized` below for those.
  familyId: string | null;
  colorSchemeId: string | null;
  performanceMode: boolean | null;
  backgroundOpacity: number | null;
  externalAccountLinkTemplate: string | null;
  cardOpacity: number | null;
  cardBlur: number | null;
  bordersEnabled: boolean | null;
  categoryColorsEnabled: boolean | null;
  squareCorners: boolean | null;
  currencyCode: string | null;
};

type UserSettingsContextType = UserSettingsState & {
  loading: boolean;
  /**
   * False until the first fetch has resolved (or failed) at least once.
   *
   * Distinct from `!loading`, and the distinction matters: `loading` is false
   * before the first fetch starts as well as after it finishes, so a consumer
   * gating on `!loading` sees the initial empty state as a settled answer.
   * For a preference that is harmless — it renders a default for a frame.
   * For the onboarding gate it is not: `familyId === null` would read as "no
   * household" and bounce somebody who has one straight out of the app.
   */
  initialized: boolean;
  refetch: () => Promise<void>;
};

const EMPTY_STATE: UserSettingsState = {
  userId: null,
  familyId: null,
  colorSchemeId: null,
  performanceMode: null,
  backgroundOpacity: null,
  externalAccountLinkTemplate: null,
  cardOpacity: null,
  cardBlur: null,
  bordersEnabled: null,
  categoryColorsEnabled: null,
  squareCorners: null,
  currencyCode: null,
};

const UserSettingsContext = createContext<UserSettingsContextType | null>(null);

// Single shared GetMyUser fetch backing every per-account preference (color
// scheme, performance mode, background opacity, currency, external account
// link template). ThemeSelectionContext, PerformanceModeContext,
// BackgroundOpacityContext, CategoryColorsContext and the Settings page all
// read from here instead of each issuing their own SERVER_ONLY GetMyUser
// query — that would otherwise mean one extra full round-trip per preference
// on every page load.
export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<UserSettingsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setState(EMPTY_STATE);
      // A signed-out visitor is a settled answer, not a pending one — the
      // landing page must render rather than wait for a fetch that will
      // never happen.
      setInitialized(true);
      return;
    }
    setLoading(true);
    try {
      // SERVER_ONLY, not the default cache-preferring policy, so a value
      // just written by a mutation is never masked by a stale cached read.
      const result = await getMyUser({ fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
      const dbUser = result.data.user;
      const settings = dbUser?.userSetting;
      setState({
        userId: dbUser?.id ?? null,
        familyId: dbUser?.family?.id ?? null,
        colorSchemeId: settings?.colorScheme?.id ?? null,
        performanceMode: settings?.performanceMode ?? false,
        backgroundOpacity: settings?.backgroundOpacity ?? 100,
        externalAccountLinkTemplate: settings?.externalAccountLinkTemplate ?? null,
        cardOpacity: settings?.cardOpacity ?? 100,
        cardBlur: settings?.cardBlur ?? 0,
        bordersEnabled: settings?.bordersEnabled ?? true,
        categoryColorsEnabled: settings?.categoryColorsEnabled ?? true,
        squareCorners: settings?.squareCorners ?? false,
        currencyCode: settings?.currencyCode ?? DEFAULT_CURRENCY,
      });
    } finally {
      setLoading(false);
      // In `finally`, so a failed read still counts as answered. Otherwise a
      // network blip leaves every consumer waiting forever on a flag that
      // will never flip.
      setInitialized(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return (
    <UserSettingsContext.Provider value={{ ...state, loading, initialized, refetch }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return ctx;
}
