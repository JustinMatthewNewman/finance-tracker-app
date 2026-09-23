"use client";

import { useCallback, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import {
  approveJoinRequest,
  denyJoinRequest,
  getMyFamilyDetail,
  leaveMyFamily,
  regenerateFamilyInviteCode,
} from "@/src/dataconnect-generated";
import { generateInviteCode } from "@/lib/inviteCode";
import { toJoinRequestStatus } from "@/lib/familyStatus";

export interface HouseholdAccount {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
}

export interface PendingRequest {
  requesterId: string;
  username: string;
  email: string | null;
  createdAt: string;
}

export interface MyFamily {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  ownerUserId: string;
  ownerUsername: string;
  members: HouseholdAccount[];
  pendingRequests: PendingRequest[];
}

/**
 * The signed-in account's household, for the Family panel in Settings.
 *
 * CALL THIS ONCE PER PAGE, for the same reason useFamilyMembers says so: the
 * state is a plain useState, so a second caller gets a second copy that goes
 * stale the moment the first one approves somebody.
 *
 * Every action here re-reads afterwards rather than patching local state.
 * Approving somebody changes two rows in two tables — the request and the
 * requester's User — and reconstructing that by hand is how a list ends up
 * disagreeing with the database it came from.
 */
export function useFamily() {
  const { user } = useAuth();
  // The caller's row id comes from UserSettingsContext rather than a
  // GetMyUser of our own. That query is already issued once per page load for
  // the preferences, and it carries `id` — fetching it again here would be a
  // second full round trip to learn something already in memory.
  const { userId: myUserId, refetch: refetchUserSettings } = useUserSettings();

  const [family, setFamily] = useState<MyFamily | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setFamily(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // SERVER_ONLY, per the app-wide rule: the generated hooks' default
      // cache is never invalidated by a mutation, so a cached read here would
      // show an approved member as still pending indefinitely.
      const detail = await getMyFamilyDetail({ fetchPolicy: QueryFetchPolicy.SERVER_ONLY });

      // The query is scoped to "a family I am a member of" and limited to
      // one, so this list is either empty or a single row. It is a list at
      // all only because Data Connect has no way to express a correlated
      // EXISTS against a single-object field.
      const row = detail.data.families[0];
      if (!row) {
        setFamily(null);
        return;
      }

      setFamily({
        id: row.id,
        name: row.name,
        inviteCode: row.inviteCode,
        createdAt: row.createdAt,
        ownerUserId: row.ownerUser.id,
        ownerUsername: row.ownerUser.username,
        members: row.members.map((m) => ({
          id: m.id,
          username: m.username,
          email: m.email ?? null,
          createdAt: m.createdAt,
        })),
        pendingRequests: row.pendingRequests
          // The query already filters to PENDING. Filtering again is not
          // belt-and-braces paranoia — it keeps an unrecognized status out
          // of a list whose every row renders an Approve button.
          .filter((r) => toJoinRequestStatus(r.status) === "PENDING")
          .map((r) => ({
            requesterId: r.requester.id,
            username: r.requester.username,
            email: r.requester.email ?? null,
            createdAt: r.createdAt,
          })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your household");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  /**
   * Whether the caller is the household's primary user.
   *
   * A rendering hint and nothing more — ApproveJoinRequest and its siblings
   * carry their own `@check` on Family.ownerUser, so this deciding wrongly
   * hides a button rather than granting anything. Same relationship as
   * feature flags to requireFeature().
   *
   * Both ids come from a database read, so both arrive with hyphens stripped
   * and compare directly. An id that has been through crypto.randomUUID()
   * would not — see the note in useFamilyMembers.
   */
  const isOwner = !!family && !!myUserId && family.ownerUserId === myUserId;

  const approve = useCallback(
    async (requesterId: string) => {
      if (!family) throw new Error("No household loaded");
      await approveJoinRequest({ familyId: family.id, requesterId });
      await refetch();
    },
    [family, refetch]
  );

  const deny = useCallback(
    async (requesterId: string) => {
      if (!family) throw new Error("No household loaded");
      await denyJoinRequest({ familyId: family.id, requesterId });
      await refetch();
    },
    [family, refetch]
  );

  const leave = useCallback(async () => {
    if (!myUserId) throw new Error("User profile not found");
    await leaveMyFamily({ userId: myUserId });
    // The shared context holds `familyId`, and OnboardingGate acts on it —
    // so leaving has to refresh that too, or the person stays in an app they
    // are no longer a member of until the next full page load.
    await Promise.all([refetch(), refetchUserSettings()]);
  }, [myUserId, refetch, refetchUserSettings]);

  /**
   * Issues a new invite code, invalidating the old one.
   *
   * The new code is generated client-side, exactly as at creation. That is
   * safe because it is generated from a CSPRNG (see lib/inviteCode.ts) and
   * because the column is @unique — a caller cannot set a code another
   * household already holds, whatever it sends.
   */
  const rotateInviteCode = useCallback(async () => {
    if (!family) throw new Error("No household loaded");
    const inviteCode = generateInviteCode();
    await regenerateFamilyInviteCode({ familyId: family.id, inviteCode });
    await refetch();
    return inviteCode;
  }, [family, refetch]);

  return {
    family,
    myUserId,
    isOwner,
    loading,
    error,
    refetch,
    approve,
    deny,
    leave,
    rotateInviteCode,
  };
}
