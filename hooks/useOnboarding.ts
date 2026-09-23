"use client";

import { useCallback, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import {
  cancelMyJoinRequest,
  createFamily,
  getFamilyByInviteCode,
  getMyJoinRequests,
  requestToJoinFamily,
} from "@/src/dataconnect-generated";
import { generateInviteCode, normalizeInviteCode } from "@/lib/inviteCode";
import { toJoinRequestStatus, type JoinRequestStatus } from "@/lib/familyStatus";

/** A household resolved from an invite code, before anyone commits to it. */
export interface ResolvedFamily {
  id: string;
  name: string;
  ownerUsername: string;
}

export interface MyJoinRequest {
  familyId: string;
  familyName: string;
  ownerUsername: string;
  status: JoinRequestStatus;
  createdAt: string;
  decidedAt: string | null;
}

/**
 * Everything the onboarding flow needs, and nothing the rest of the app does.
 *
 * Kept separate from useFamily() because the two answer different questions
 * at different times. This one runs for an account with no household, and its
 * job is to get them one; useFamily() runs for an account that has one.
 * Folding them together would mean each page carrying the other's queries.
 */
export function useOnboarding() {
  const { user } = useAuth();
  // `userId` and `familyId` come from the one GetMyUser the app already
  // makes. Refreshing here therefore means refreshing that context — which is
  // also what OnboardingGate reads, so the two can never disagree about
  // whether this account has a household.
  const {
    userId: myUserId,
    familyId,
    initialized,
    refetch: refetchUserSettings,
  } = useUserSettings();

  const [requests, setRequests] = useState<MyJoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setRequests([]);
      setLoadingRequests(false);
      return;
    }
    setError(null);
    try {
      const [, mine] = await Promise.all([
        refetchUserSettings(),
        getMyJoinRequests({ fetchPolicy: QueryFetchPolicy.SERVER_ONLY }),
      ]);
      setRequests(
        mine.data.familyJoinRequests.map((r) => ({
          familyId: r.family.id,
          familyName: r.family.name,
          ownerUsername: r.family.ownerUser.username,
          status: toJoinRequestStatus(r.status),
          createdAt: r.createdAt,
          decidedAt: r.decidedAt ?? null,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your account");
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.uid, refetchUserSettings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  /**
   * Resolves a typed invite code to a household, so the UI can name it before
   * anybody commits.
   *
   * Returns null both for "that is not a well-formed code" and for "no
   * household has that code", and the caller shows one message for both. The
   * distinction is real but telling somebody which of the two they hit turns
   * this into an oracle for probing which codes exist — and the codes are the
   * only thing protecting a household from strangers knocking.
   */
  const lookupInviteCode = useCallback(async (raw: string): Promise<ResolvedFamily | null> => {
    const code = normalizeInviteCode(raw);
    if (!code) return null;

    const res = await getFamilyByInviteCode(
      { inviteCode: code },
      { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }
    );
    const found = res.data.family;
    if (!found) return null;

    return { id: found.id, name: found.name, ownerUsername: found.ownerUser.username };
  }, []);

  /**
   * Starts a new household with the caller as its primary user.
   *
   * The retry loop is for the invite code's @unique constraint. A collision
   * is vanishingly unlikely — 32^10, and a household is created once per
   * account — but it is not impossible, and the alternative to retrying is
   * showing somebody an error about a code they never saw and cannot
   * influence. Three attempts, then let it surface: at that point the failure
   * is not a collision.
   */
  const createMyFamily = useCallback(
    async (name: string) => {
      if (!myUserId) throw new Error("User profile not found");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Please give your household a name");

      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        const inviteCode = generateInviteCode();
        try {
          await createFamily({
            userId: myUserId,
            familyId: crypto.randomUUID(),
            name: trimmed,
            inviteCode,
          });
          await refresh();
          return inviteCode;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!/unique constraint|already exists|duplicate key/i.test(message)) throw err;
          lastErr = err;
        }
      }
      throw lastErr;
    },
    [myUserId, refresh]
  );

  const requestToJoin = useCallback(
    async (targetFamilyId: string) => {
      if (!myUserId) throw new Error("User profile not found");
      await requestToJoinFamily({ userId: myUserId, familyId: targetFamilyId });
      await refresh();
    },
    [myUserId, refresh]
  );

  const cancelRequest = useCallback(
    async (targetFamilyId: string) => {
      if (!myUserId) throw new Error("User profile not found");
      await cancelMyJoinRequest({ familyId: targetFamilyId, userId: myUserId });
      await refresh();
    },
    [myUserId, refresh]
  );

  // Requests come back newest-first, so the head is the one the waiting
  // screen is about. Only a PENDING one holds somebody on that screen; a
  // denied or cancelled request is history they can act past.
  const pendingRequest = requests.find((r) => r.status === "PENDING") ?? null;
  const latestRequest = requests[0] ?? null;

  return {
    myUserId,
    /** Null until the person joins or creates one. This is what the gate reads. */
    familyId,
    hasFamily: !!familyId,
    requests,
    pendingRequest,
    latestRequest,
    // Both halves have to have answered. The requests list alone is not
    // enough: `familyId` is null before the shared fetch resolves as well as
    // when there is genuinely no household, so reporting "loaded" too early
    // flashes the join-or-create fork at somebody who already has one.
    loading: loadingRequests || !initialized,
    error,
    refresh,
    lookupInviteCode,
    createMyFamily,
    requestToJoin,
    cancelRequest,
  };
}
