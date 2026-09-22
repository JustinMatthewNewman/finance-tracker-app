"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyUser } from "@/src/dataconnect-generated/react";
import { syncUserRecord } from "@/lib/auth";

/**
 * Repairs an authenticated session that has no `User` row behind it.
 *
 * WHY THIS IS NEEDED AT ALL. Creating the row used to happen in exactly one
 * place — the sign-in path — and Firebase Auth persists sessions. So anyone
 * whose sign-in landed while the database was unreachable stayed signed in
 * afterwards with no row, and the login path never ran for them again. The
 * account did not recover when the database came back; it stayed broken until
 * the person happened to sign out and in again. That is why the original bug
 * looked permanent rather than transient.
 *
 * The trigger is precise and costs no extra request: GetMyUser is already
 * fetched on every page by the settings and feature contexts. If it resolves
 * successfully and reports no user, the row is genuinely missing and we
 * create it. A loading or errored query tells us nothing, so neither is
 * treated as "missing" — inferring absence from a failed read would fire a
 * write on every network blip.
 */
export function UserRecordSync() {
  const { user } = useAuth();
  const myUserQuery = useGetMyUser({ enabled: !!user?.uid });

  // One attempt per account per page load. Without this the repair can loop:
  // if the sync fails, or succeeds but the refetch still reports no row, the
  // effect's inputs are unchanged and it would fire again immediately.
  const attemptedForUid = useRef<string | null>(null);

  const uid = user?.uid;
  const isMissing = myUserQuery.isSuccess && !myUserQuery.data?.user;
  const refetch = myUserQuery.refetch;

  useEffect(() => {
    if (!uid || !isMissing) return;
    if (attemptedForUid.current === uid) return;
    attemptedForUid.current = uid;

    let cancelled = false;

    (async () => {
      const current = (await import("@/lib/firebase")).auth.currentUser;
      if (!current || cancelled) return;
      try {
        await syncUserRecord(current);
        if (!cancelled) await refetch();
      } catch (err) {
        // Deliberately not surfaced to the user. This runs in the background
        // on an ordinary page load, and the person did not ask for it — a
        // toast here would be noise they can do nothing about. The pages that
        // actually need the row show their own empty/error states, and the
        // sign-in path still reports failures loudly because there the person
        // is waiting on the result.
        console.error("[UserRecordSync] could not create the missing user row:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, isMissing, refetch]);

  return null;
}

export default UserRecordSync;
