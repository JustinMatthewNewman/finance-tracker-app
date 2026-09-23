// app/api/auth/sync-user/route.ts
import { NextRequest, NextResponse } from "next/server";
// Imported dynamically at runtime inside getAdminAuth, not statically here —
// see the note in lib/firebase-admin.ts.
import { getAdminAuth } from "@/lib/firebase-admin";
import {
  createUserFromGoogle,
  createUserSettingForUser,
  getUserProvisioningByGoogleUid,
} from "@/src/dataconnect-admin-generated";

/**
 * Both "already exists" races this route can lose, in one predicate.
 *
 * Kept as a named function rather than an inline regex because it is now
 * consulted from two places, and the two must agree: a divergence would show
 * up only under concurrent sign-ins, which is exactly the condition nobody
 * reproduces on purpose.
 */
function isUniqueViolation(message: string): boolean {
  return /unique constraint|already exists|duplicate key/i.test(message);
}

/**
 * Adds the missing settings row for a pre-existing account.
 *
 * Deliberately does NOT fail the sign-in if it cannot. The person is standing
 * at a login screen waiting to get into the app, and their account works
 * without this row — preferences fall back to defaults in
 * context/UserSettingsContext.tsx. Turning a repair we chose to attempt into
 * a failed sign-in would make things strictly worse for them. It is logged
 * instead, and the next sign-in tries again.
 *
 * The unique-violation swallow covers the same race as the user insert:
 * `UserSetting.user` is @unique, so two concurrent sign-ins for one account
 * both see no row and both insert. The loser's error means the row exists,
 * which is the outcome it wanted.
 */
async function backfillUserSetting(userId: string): Promise<void> {
  try {
    await createUserSettingForUser({ userId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (isUniqueViolation(message)) return;
    console.error("[sync-user] could not backfill the settings row:", message);
  }
}

/**
 * Brings the signed-in account's database rows up to date: the `User` row and
 * the `UserSetting` row that hangs off it.
 *
 * Called on every sign-in, and also whenever the app notices an authenticated
 * session with no row behind it (see components/Utilities/UserRecordSync.tsx).
 * It must therefore be idempotent and safe to call repeatedly.
 *
 * The uid comes from verifying the ID token, never from the request body — a
 * caller must not be able to create or claim a row for somebody else's
 * account.
 *
 * WHY THIS HANDLES SETTINGS AT ALL. New accounts get their settings row from
 * the nested insert inside CreateUserFromGoogle, atomically, and need nothing
 * here. But every account created before that nesting existed has no settings
 * row and never will — and because a `userSetting_update` matching zero rows
 * reports success, those accounts fail silently forever: every preference
 * they change appears to save and is gone on reload. Sign-in is the one
 * moment we are already talking to the database on their behalf, so it is
 * where the backfill belongs. It costs nothing for an account that is already
 * whole.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const adminAuth = await getAdminAuth();

    // Fails closed: an invalid or expired token throws and lands in the catch
    // below as a 500 rather than creating anything.
    const decoded = await adminAuth.verifyIdToken(idToken);

    const googleUid = decoded.uid;
    const email = decoded.email ?? null;
    const username = decoded.name ?? email?.split("@")[0] ?? "User";

    // Look first, then insert.
    //
    // This used to be insert-then-catch, deciding "already exists" by
    // string-matching the Postgres error for `user_googleUid_uidx`. That
    // works only for as long as nobody renames that index: the day it
    // changes, every returning user's sign-in starts 500ing, and the failure
    // would land on returning users rather than on whoever made the change.
    // Asking the database whether the row exists has no such coupling.
    const existing = await getUserProvisioningByGoogleUid({ googleUid });

    if (existing.data.user) {
      // The account is here. The only thing that can still be missing is the
      // settings row, and only for accounts predating the nested insert.
      if (!existing.data.user.userSetting) {
        await backfillUserSetting(existing.data.user.id);
        return NextResponse.json({ success: true, created: false, repairedSettings: true });
      }
      return NextResponse.json({ success: true, created: false });
    }

    try {
      // Creates the User and its UserSetting in one transaction — see the
      // nested `userSetting_on_user` in CreateUserFromGoogle. Nothing else is
      // needed for a brand-new account.
      await createUserFromGoogle({
        googleUid,
        username,
        email: email ?? "",
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr: unknown) {
      // Backstop for the race the lookup above cannot close: two sign-ins for
      // a brand-new account arriving together both see "no row" and both
      // insert. The loser hits the unique constraint, and that is a success —
      // the row it wanted exists. Any other database error is real and must
      // propagate, so this stays a narrow check rather than a blanket catch.
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr);
      if (!isUniqueViolation(message)) {
        throw dbErr;
      }
      return NextResponse.json({ success: true, created: false });
    }

    return NextResponse.json({ success: true, created: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-user] failed:", message);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
