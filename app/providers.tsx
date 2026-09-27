// app/providers.tsx
"use client";

import "@/lib/dataconnectEmulator";
import { SidebarProvider } from "@/context/SideBarContext";
import { SelectedFamilyMemberProvider } from "@/context/SelectedFamilyMemberContext";
import { ThemeSelectionProvider } from "@/context/ThemeSelectionContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { UserSettingsProvider } from "@/context/UserSettingsContext";
import { PerformanceModeProvider } from "@/context/PerformanceModeContext";
import { BackgroundOpacityProvider } from "@/context/BackgroundOpacityContext";
import { CardStyleProvider } from "@/context/CardStyleContext";
import { BordersProvider } from "@/context/BordersContext";
import { CategoryColorsProvider } from "@/context/CategoryColorsContext";
import { SquareCornersProvider } from "@/context/SquareCornersContext";
import { CalendarViewProvider } from "@/context/CalendarViewContext";
import { InternalTransfersProvider } from "@/context/InternalTransfersContext";
import { PrivacyModeProvider } from "@/context/PrivacyModeContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import DbThemeApplier from "@/components/Utilities/DbThemeApplier";
import UserRecordSync from "@/components/Utilities/UserRecordSync";

// ORDER MATTERS in one specific way: every preference provider below reads
// its stored value from UserSettingsProvider, which owns the single shared
// GetMyUser fetch. Moving any of them above it turns that one round trip back
// into one per preference, which is what this nesting exists to prevent.
// Beyond that constraint the nesting is arbitrary.
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <UserSettingsProvider>
            <PerformanceModeProvider>
              <BackgroundOpacityProvider>
                <CardStyleProvider>
                  <BordersProvider>
                    <SquareCornersProvider>
                      <ThemeSelectionProvider>
                        <CategoriesProvider>
                          <CategoryColorsProvider>
                            {/* All three read their stored value from
                                UserSettingsProvider's single GetMyUser, so they
                                belong below it — see the note on this file. */}
                            <CalendarViewProvider>
                            <InternalTransfersProvider>
                            <PrivacyModeProvider>
                            <SidebarProvider>
                              <SelectedFamilyMemberProvider>
                                <DbThemeApplier />
                                <UserRecordSync />
                                {children}
                              </SelectedFamilyMemberProvider>
                            </SidebarProvider>
                            </PrivacyModeProvider>
                            </InternalTransfersProvider>
                            </CalendarViewProvider>
                          </CategoryColorsProvider>
                        </CategoriesProvider>
                      </ThemeSelectionProvider>
                    </SquareCornersProvider>
                  </BordersProvider>
                </CardStyleProvider>
              </BackgroundOpacityProvider>
            </PerformanceModeProvider>
          </UserSettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
