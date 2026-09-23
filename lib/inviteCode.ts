// Invite codes: the single place a household's join code is generated,
// normalized and formatted.
//
// THE RULE: a code is a capability, not an identifier. Holding one is what
// authorizes an account to ask to join a household (see Family.inviteCode in
// dataconnect/schema/schema.gql), and there is no directory of families to
// browse — so the code is the *only* way in, and a guessable one is a way
// into a stranger's finances.
//
// That makes two things non-negotiable:
//
//   1. It comes from a CSPRNG. Never Math.random(), which is seeded
//      predictably and is not intended to resist anyone.
//   2. It is long enough that guessing is hopeless. 10 characters over a
//      32-symbol alphabet is 32^10 ≈ 1.1e15, or ~50 bits.
//
// Everything else here is about the code surviving contact with a human, who
// will read it off a screen, say it out loud, or paste it with a stray space.

/**
 * Crockford's base32 alphabet: the digits plus the uppercase letters, minus
 * I, L, O and U.
 *
 * I and L are dropped because they are indistinguishable from 1 in most
 * fonts, and O because it is indistinguishable from 0 — those three are the
 * difference between a code that can be read aloud and one that generates a
 * support request. U is dropped for a less obvious reason: excluding it means
 * a randomly generated code cannot accidentally spell an obscenity, which
 * matters when the string is shown to a family.
 *
 * Exactly 32 symbols, which is what makes the rejection-free sampling in
 * generateInviteCode() uniform.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Characters per code. 32^10 ≈ 2^50. */
export const INVITE_CODE_LENGTH = 10;

/**
 * A fresh, unguessable invite code.
 *
 * Uniform over the alphabet without rejection sampling, and that is a
 * property of the numbers rather than luck: 256 is an exact multiple of 32,
 * so `byte % 32` maps exactly eight byte values onto each symbol. With an
 * alphabet whose length did not divide 256 — 36, say — the same modulo would
 * quietly bias the first few symbols, which is the classic way a token space
 * ends up smaller than its length suggests.
 */
export function generateInviteCode(): string {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/**
 * Turns whatever a person typed into the canonical form stored in the
 * database, or null if it cannot be one.
 *
 * Returning null rather than a best-effort string is deliberate: the caller
 * is about to ask the server to resolve this code, and a malformed one should
 * produce "that doesn't look like a code" immediately rather than a round
 * trip that comes back "no such household" and reads like the household is
 * gone.
 *
 * The confusable characters are folded rather than rejected, per Crockford:
 * somebody reading "0" aloud as "oh" and typing O should land on the right
 * household, not on an error. U has no digit to fold onto, so a code
 * containing one was never valid and is rejected.
 */
export function normalizeInviteCode(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const folded = raw
    .toUpperCase()
    // Spaces and hyphens are formatting, not content — formatInviteCode()
    // puts a hyphen in, and people paste codes with both.
    .replace(/[\s-]+/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");

  if (folded.length !== INVITE_CODE_LENGTH) return null;
  // Anything outside the alphabet after folding — U, punctuation, a letter
  // from another script — means this is not a code.
  for (const char of folded) {
    if (!ALPHABET.includes(char)) return null;
  }
  return folded;
}

/**
 * Groups a code for display: "HTBQ4F91XZ" -> "HTBQ4-F91XZ".
 *
 * Purely cosmetic, and never stored — normalizeInviteCode() strips the hyphen
 * straight back out. Chunking is what makes a 10-character string possible to
 * copy accurately by eye, which is exactly what someone reading it to a
 * housemate over the phone is doing.
 */
export function formatInviteCode(code: string): string {
  const normalized = code.toUpperCase().replace(/[\s-]+/g, "");
  const half = Math.ceil(normalized.length / 2);
  return `${normalized.slice(0, half)}-${normalized.slice(half)}`;
}
