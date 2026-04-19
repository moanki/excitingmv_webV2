import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://excitingmv-web-v2.vercel.app"),
  title: {
    default: "Exciting Maldives",
    template: "%s | Exciting Maldives"
  },
  description:
    "Luxury B2B partner platform for resort discovery, protected resources, and curated Maldives sales support."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="shell topbar-inner">
            <Link href="/" className="brand">
              Exciting Maldives
            </Link>
            <nav className="nav" aria-label="Primary">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/resorts">Resorts</Link>
              <Link href="/partner/login">Partner Login</Link>
              <Link href="/partner/register" className="button">
                Become a Partner
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="shell">
            <p>Luxury resort partnerships, protected trade resources, and curated Maldives expertise.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
