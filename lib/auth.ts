import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

/**
 * Thrown when Firebase Auth accepted the sign-in but the account's database
 * row could not be created.
 *
 * A distinct type because the two halves fail differently and the caller
 * needs to tell them apart: a popup that was closed is the user changing
 * their mind, while this is a real backend fault where the person is now
 * authenticated but has no records. Callers must not treat it as a
 * successful login.
 */
export class UserSyncError extends Error {
  readonly status: number;
  readonly detail: string | undefined;

  constructor(status: number, detail?: string) {
    super(
      "Signed in, but your account could not be set up. This is usually the " +
        "database being unreachable — please try again in a moment."
    );
    this.name = "UserSyncError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Creates the caller's `User` row if it does not exist yet.
 *
 * Separate from loginWithGoogle so it can also run for an *already* signed-in
 * session — see components/Utilities/UserRecordSync.tsx. Sign-in is not the
 * only moment the row can be missing: anyone who signed in while the database
 * was down is still authenticated afterwards, and would otherwise never get a
 * row, because the login path never runs again for them.
 */
export async function syncUserRecord(user: User): Promise<void> {
  const idToken = await user.getIdToken();

  const res = await fetch("/api/auth/sync-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  // THE BUG THIS FIXES: the response used to be ignored entirely. A 500 here
  // is indistinguishable from success to an unchecked `await fetch(...)`, so
  // a failed sync let the caller carry on and route into the app — signed in,
  // with no database row and nothing on screen to say so. Never drop this
  // check.
  if (!res.ok) {
    let detail: string | undefined;
    try {
      detail = (await res.json())?.details;
    } catch {
      // Body wasn't JSON (a proxy error page, say). The status is enough.
    }
    throw new UserSyncError(res.status, detail);
  }
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  await syncUserRecord(result.user);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}
