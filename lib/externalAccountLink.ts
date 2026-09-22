// Builds the outbound "open at your institution" link from the household's
// externalAccountLinkTemplate (see User in schema.gql).
//
// Kept out of the component for the same reason the template's version was:
// the template is user-entered text that ends up in an href, and an href is
// an injection surface. `javascript:` and `data:` URLs in particular execute
// in the page's origin when clicked, so validation has to happen in one place
// that every call site goes through rather than at each <a>.

export const ACCOUNT_ID_PLACEHOLDER = "{account_id}";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Whether a template is usable. A template without the placeholder is
 * rejected too: it would produce the same link for every member, which is
 * silently wrong rather than obviously broken.
 */
export function isValidLinkTemplate(template: string | null | undefined): boolean {
  if (!template) return false;
  const trimmed = template.trim();
  if (!trimmed.includes(ACCOUNT_ID_PLACEHOLDER)) return false;

  try {
    // Parsed with a dummy substitution so the placeholder's braces (which are
    // not legal URL characters) don't fail the parse on their own.
    const url = new URL(trimmed.replaceAll(ACCOUNT_ID_PLACEHOLDER, "1"));
    return ALLOWED_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

/**
 * The link for one member's external account, or null when there is nothing
 * safe to link to.
 *
 * The reference is percent-encoded before substitution — it is free text, so
 * without this a value containing "?" or "#" would silently rewrite the rest
 * of the URL into a query string or fragment.
 */
export function buildAccountLink(
  template: string | null | undefined,
  accountRef: string | null | undefined
): string | null {
  if (!accountRef || !isValidLinkTemplate(template)) return null;
  return template!.trim().replaceAll(ACCOUNT_ID_PLACEHOLDER, encodeURIComponent(accountRef));
}
