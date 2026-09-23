import Navbar from "@/components/Navbar";
import OnboardingGate from "@/components/Onboarding/OnboardingGate";

/**
 * Everything behind the app's chrome.
 *
 * Two things happen here that do not happen in `(onboarding)`: the navbar is
 * rendered, and OnboardingGate redirects anyone who has not settled on a
 * household yet. Both are properties of "being in the app", which is exactly
 * what this route group means.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <OnboardingGate />
      <Navbar />
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </>
  );
}
