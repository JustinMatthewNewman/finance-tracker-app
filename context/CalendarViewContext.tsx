"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSelectMyHideWeekends } from "@/src/dataconnect-generated/react";
import { useUserSettings } from "./UserSettingsContext";

type CalendarViewContextType = {
  hideWeekends: boolean;
  setHideWeekends: (value: boolean) => void;
};

const CalendarViewContext = createContext<CalendarViewContextType | null>(null);

// Whether the calendar draws Saturday and Sunday.
//
// A VIEW SETTING, NOT A FILTER, and the distinction is the whole design: hiding
// the columns must not change a single total. Weekend transactions still exist,
// still count in the month's in/out, and still show on Income and Expenses. A
// toggle that quietly moved the headline figure would be a different and much
// worse feature — somebody would reconcile against their bank and find the app
// short by a weekend's spending with nothing on screen to explain it.
//
// Defaults to false until the DB value loads, matching the full seven-column
// grid, for the same reason BordersProvider defaults to true: start on the
// familiar appearance so nothing flashes into another layout and back.
export function CalendarViewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { hideWeekends: dbHideWeekends, refetch } = useUserSettings();
  const [hideWeekends, setHideWeekendsState] = useState(false);
  const selectMutation = useSelectMyHideWeekends();

  useEffect(() => {
    if (dbHideWeekends == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHideWeekendsState(dbHideWeekends);
  }, [dbHideWeekends]);

  const setHideWeekends = useCallback(
    (value: boolean) => {
      setHideWeekendsState(value);
      // Fire-and-forget: local state already drives the UI, so the mutation
      // does not block the toggle.
      if (user?.uid) {
        selectMutation.mutate({ hideWeekends: value }, { onSuccess: () => refetch() });
      }
    },
    [user?.uid, selectMutation, refetch]
  );

  return (
    <CalendarViewContext.Provider value={{ hideWeekends, setHideWeekends }}>
      {children}
    </CalendarViewContext.Provider>
  );
}

export function useCalendarView() {
  const ctx = useContext(CalendarViewContext);
  if (!ctx) {
    throw new Error("useCalendarView must be used within a CalendarViewProvider");
  }
  return ctx;
}
