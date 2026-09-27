// What to call a person in the household roster.
//
// THE BUG THIS FIXES. `CreateUserFromGoogle` stamps every account's own
// FamilyMember row with `relationship: "Self"`, because at the moment it runs
// that row is the new account's own entry and nothing else exists. Once two
// accounts share a household, BOTH of their self rows say "Self" — and the
// sidebar rendered that column verbatim, so somebody looking at their household
// saw themselves labelled "Self" and their partner labelled "Self" too.
//
// "Self" is not a fact about the row. It is a fact about WHO IS LOOKING, and a
// stored string cannot express that: the same row is "you" to one viewer and
// "the other account holder" to the next. So the label is derived per viewer
// from `isSelf`, and the stored value is ignored on any row that represents an
// account. Deriving it also means no migration and no repair script — rows
// already carrying "Self" render correctly from today.

export interface RoleInput {
  /** The stored, user-authored relationship ("Spouse", "Daughter"). */
  relationship: string | null;
  /** Whether this row represents the SIGNED-IN account. One row at most. */
  isSelf: boolean;
  /**
   * Whether this row represents any account — the viewer's or a housemate's.
   * True whenever FamilyMember.selfUser is set.
   */
  isAccountHolder: boolean;
  /** The username of the account that owns the row. */
  ownerUsername: string;
}

/**
 * The relationship line to show under a person's name.
 *
 * Null means "show nothing", which is a real answer and not a gap: a member
 * added without a relationship should not be given an invented one.
 */
export function relationshipLabel(member: RoleInput): string | null {
  // The viewer themselves. Checked first, because a viewer's own row is also an
  // account-holder row and this is the more specific truth about it.
  if (member.isSelf) return "You";

  // Another account in the household. Deliberately not "Self", and deliberately
  // not their stored relationship either — whatever that row says, from here it
  // describes somebody else's relationship to themselves, which is meaningless
  // to this viewer.
  if (member.isAccountHolder) return "Signs in to this household";

  // Somebody tracked but who does not sign in: their stored relationship is
  // exactly right, because it was written from the household's point of view.
  const stored = member.relationship?.trim();
  if (!stored) return null;

  // A tracked person carrying the literal "Self" can only have come from a
  // backfill or a hand edit — it is never true of a row with no account behind
  // it, and showing it would reproduce the bug this module exists to fix.
  if (stored.toLowerCase() === "self") return null;

  return stored;
}

/** Short form for a dense list, where "Signs in to this household" is too long. */
export function shortRelationshipLabel(member: RoleInput): string | null {
  if (member.isSelf) return "You";
  if (member.isAccountHolder) return "Account holder";
  return relationshipLabel(member);
}
