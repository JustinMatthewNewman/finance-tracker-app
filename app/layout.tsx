import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Tracker Pro",
  description: "Household finance tracking. See what every person in the family earns and spends, month by month.",
};

/**
 * The root layout owns the document and the providers, and nothing else.
 *
 * THE NAVBAR IS NOT HERE, deliberately. It lives in the `(app)` route group's
 * layout, so that `(onboarding)` can exist without it. Onboarding has to be
 * chrome-free — somebody who has not joined a household yet cannot be handed
 * a navbar full of tabs onto data they do not have — and there are two ways
 * to arrange that. This is the structural one: the group a route belongs to
 * decides what surrounds it, checked by the router.
 *
 * The other way is a `usePathname() === "/onboarding"` early-return inside
 * Navbar. That works right up until the second chrome-free route, at which
 * point the condition becomes a list that somebody has to remember to add to,
 * and the failure mode is a navbar appearing where it should not rather than
 * anything that raises an error.
 *
 * Providers stay at the root because onboarding needs them too: it reads the
 * signed-in user through the same GetMyUser fetch every other page uses.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen flex-col overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
