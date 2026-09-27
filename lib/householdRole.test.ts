import { describe, expect, it } from "vitest";
import { relationshipLabel, shortRelationshipLabel, type RoleInput } from "./householdRole";

const member = (extra: Partial<RoleInput> = {}): RoleInput => ({
  relationship: null,
  isSelf: false,
  isAccountHolder: false,
  ownerUsername: "justin",
  ...extra,
});

describe("the bug: two accounts in one household both said 'Self'", () => {
  // CreateUserFromGoogle writes relationship: "Self" onto every account's own
  // row, so in a shared household both rows carry it. The label has to come from
  // who is looking, not from the column.
  const mine = member({ relationship: "Self", isSelf: true, isAccountHolder: true });
  const theirs = member({ relationship: "Self", isSelf: false, isAccountHolder: true, ownerUsername: "sam" });

  it("calls the viewer's own row 'You'", () => {
    expect(relationshipLabel(mine)).toBe("You");
  });

  it("does NOT call a housemate's account row 'Self'", () => {
    expect(relationshipLabel(theirs)).not.toBe("Self");
    expect(relationshipLabel(theirs)).toBe("Signs in to this household");
  });

  it("gives the two rows different labels, which is the whole point", () => {
    expect(relationshipLabel(mine)).not.toBe(relationshipLabel(theirs));
  });
});

describe("a tracked person who does not sign in", () => {
  it("keeps their stored relationship, which is written from the household's view", () => {
    expect(relationshipLabel(member({ relationship: "Daughter" }))).toBe("Daughter");
    expect(relationshipLabel(member({ relationship: "Spouse" }))).toBe("Spouse");
  });

  it("shows nothing when none was given, rather than inventing one", () => {
    expect(relationshipLabel(member())).toBeNull();
    expect(relationshipLabel(member({ relationship: "" }))).toBeNull();
    expect(relationshipLabel(member({ relationship: "   " }))).toBeNull();
  });

  it("trims what somebody typed", () => {
    expect(relationshipLabel(member({ relationship: "  Lodger  " }))).toBe("Lodger");
  });

  it("drops a stray 'Self' left by a backfill or a hand edit", () => {
    // Never true of a row with no account behind it, and showing it would
    // reproduce the original bug.
    expect(relationshipLabel(member({ relationship: "Self" }))).toBeNull();
    expect(relationshipLabel(member({ relationship: "self" }))).toBeNull();
    expect(relationshipLabel(member({ relationship: "SELF" }))).toBeNull();
  });
});

describe("precedence", () => {
  it("prefers 'You' over the account-holder wording", () => {
    // A viewer's own row is both; the more specific truth wins.
    expect(relationshipLabel(member({ isSelf: true, isAccountHolder: true }))).toBe("You");
  });

  it("prefers the account-holder wording over a stored relationship", () => {
    // Somebody may have renamed their own row's relationship to "Dad". From a
    // housemate's view that still describes them to themselves, not to the viewer.
    expect(
      relationshipLabel(member({ relationship: "Dad", isAccountHolder: true }))
    ).toBe("Signs in to this household");
  });
});

describe("shortRelationshipLabel", () => {
  it("shortens only the account-holder wording", () => {
    expect(shortRelationshipLabel(member({ isAccountHolder: true }))).toBe("Account holder");
    expect(shortRelationshipLabel(member({ isSelf: true, isAccountHolder: true }))).toBe("You");
    expect(shortRelationshipLabel(member({ relationship: "Daughter" }))).toBe("Daughter");
    expect(shortRelationshipLabel(member())).toBeNull();
  });
});
