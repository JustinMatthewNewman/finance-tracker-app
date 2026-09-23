"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";

/** Where an account without a household is sent. */
export const ONBOARDING_ROUTE = "/onboarding";

/**
 * Sends a signed-in account with no household to onboarding.
 *
 * Rendered by the `(app)` route group's layout, so it covers every page
 * behind the app's chrome and none of the chrome-free ones — which is what
 * keeps it from bouncing somebody off the very page it is sending them to.
 *
 * THIS IS A REDIRECT, NOT A SECURITY BOUNDARY, and the difference is worth
 * being explicit about because the code looks like a guard. Nothing here
 * protects data. An account that skipped onboarding and navigated straight to
 * /household would see an empty page, not somebody else's money, because the
 * queries themselves are scoped by auth.uid and household membership in the
 * connector (see the visibility rule at the top of queries.gql). This exists
 * so that people are not dropped into an app with nothing in it and no
 * explanation — same relationship as a hidden nav tab to requireFeature().
 *
 * THE THREE CONDITIONS, each of which has a way of going wrong:
 *
 *   user          — a signed-out visitor belongs on the landing page. Without
 *                   this, `/` redirects every anonymous visitor to onboarding.
 *   initialized   — `familyId` is null before the first fetch resolves as
 *                   well as when there is genuinely no household. Acting on
 *                   the first would throw members out of the app on every
 *                   page load, which is why the flag exists at all.
 *   userId        — a verified session whose User row has not been created
 *                   yet (UserRecordSync is repairing it, or sync-user failed).
 *                   Onboarding cannot do anything for them — every mutation
 *                   it offers needs that row's id — so sending them there
 *                   trades an empty page for a broken form.
 */
export default function OnboardingGate() {
  const { user } = useAuth();
  const { userId, familyId, initialized } = useUserSettings();
  const router = useRouter();
  const pathname = usePathname();

  const needsOnboarding = !!user && initialized && !!userId && !familyId;

  useEffect(() => {
    if (!needsOnboarding) return;
    if (pathname === ONBOARDING_ROUTE) return;
    // replace, not push: onboarding is not somewhere the back button should
    // return them to, and a push would let Back bounce them between the two
    // routes for as long as they keep pressing it.
    router.replace(ONBOARDING_ROUTE);
  }, [needsOnboarding, pathname, router]);

  return null;
}
