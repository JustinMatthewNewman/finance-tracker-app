/**
 * The chrome-free half of the app.
 *
 * No navbar, no side menu, no global search — a person here has no household
 * yet, so every one of those would point at data that does not exist for
 * them. The only thing to do on these routes is the thing the route is for.
 *
 * Note what is still inherited from the root layout: the providers, and
 * therefore the theme, the colour scheme and the card styling. Onboarding
 * should look like the app somebody is about to enter, not like a different
 * product.
 */
export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>;
}
