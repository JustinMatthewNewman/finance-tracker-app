// The four states a FamilyJoinRequest can be in.
//
// Data Connect has no enum table or CHECK constraint to hang these on (the
// same constraint that puts Transaction.direction's two values in
// lib/money.ts), so the column is plain text and this module is the only
// place the legal values are written down. Anything reading `status` off a
// row goes through here.

export const JOIN_REQUEST_STATUSES = ["PENDING", "APPROVED", "DENIED", "CANCELLED"] as const;
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUSES)[number];

export function isJoinRequestStatus(value: string | null | undefined): value is JoinRequestStatus {
  return !!value && (JOIN_REQUEST_STATUSES as readonly string[]).includes(value);
}

/**
 * Narrows a status read from the database.
 *
 * Unrecognized text resolves to "DENIED" rather than "PENDING", and the
 * asymmetry is the point: an unreadable status must never leave somebody
 * parked on a waiting screen forever believing an answer is still coming. It
 * should show them the outcome they can act on — ask again, or start their
 * own household.
 */
export function toJoinRequestStatus(value: string | null | undefined): JoinRequestStatus {
  return isJoinRequestStatus(value) ? value : "DENIED";
}
