/**
 * Whether a sign-in rejection was just the person dismissing the Google popup.
 *
 * Worth isolating because these are not faults and must not be reported as
 * such: closing the popup, or clicking the button twice so the first request
 * is superseded, both reject. Showing "Could not sign in" for either trains
 * people to ignore the message that matters.
 *
 * Matched on Firebase's stable `code` values rather than on message text.
 */
const DISMISSAL_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

export function isPopupDismissal(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  return typeof code === "string" && DISMISSAL_CODES.has(code);
}
