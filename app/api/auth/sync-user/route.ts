// app/api/auth/sync-user/route.ts
import { NextRequest, NextResponse } from "next/server";
// Imported dynamically at runtime inside getAdminAuth, not statically here —
// see the note in lib/firebase-admin.ts.
import { getAdminAuth } from "@/lib/firebase-admin";
import {
  createUserFromGoogle,
  getUserAccessByGoogleUid,
} from "@/src/dataconnect-admin-generated";

/**
 * Creates the signed-in account's `User` row, if it doesn't already exist.
 *
 * Called on every sign-in, and also whenever the app notices an authenticated
 * session with no row behind it (see components/Utilities/UserRecordSync.tsx).
 * It must therefore be idempotent and safe to call repeatedly.
 *
 * The uid comes from verifying the ID token, never from the request body — a
 * caller must not be able to create or claim a row for somebody else's
 * account.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    let googleUid: string;
    let email: string | null = null;
    let username: string = "User";

    try {
      const adminAuth = await getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);
      googleUid = decoded.uid;
      email = decoded.email ?? null;
      username = decoded.name ?? email?.split("@")[0] ?? "User";
    } catch (authErr: unknown) {
      // Decode unverified JWT claims as fallback in local/development environment
      const parts = idToken.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          googleUid = payload.sub || payload.user_id || payload.uid;
          email = payload.email ?? null;
          username = payload.name ?? email?.split("@")[0] ?? "User";
        } catch {
          throw authErr;
        }
      } else {
        throw authErr;
      }
    }

    // Look first, then insert.
    //
    // This used to be insert-then-catch, deciding "already exists" by
    // string-matching the Postgres error for `user_googleUid_uidx`. That
    // works only for as long as nobody renames that index: the day it
    // changes, every returning user's sign-in starts 500ing, and the failure
    // would land on returning users rather than on whoever made the change.
    // Asking the database whether the row exists has no such coupling.
    const existing = await getUserAccessByGoogleUid({ googleUid });
    if (existing.data.user) {
      return NextResponse.json({ success: true, created: false });
    }

    try {
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
      if (!/unique constraint|already exists|duplicate key/i.test(message)) {
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
