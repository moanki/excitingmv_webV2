import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";

import "@/app/globals.css";
import { getFooterContent } from "@/lib/site-content";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://excitingmv-web-v2.vercel.app"),
  title: {
    default: "Exciting Maldives",
    template: "%s | Exciting Maldives"
  },
  description:
    "Luxury B2B partner platform for resort discovery, protected resources, and curated Maldives sales support."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { content: footer } = await getFooterContent("published");

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <header className="topbar">
          <div className="shell topbar-inner">
            <Link href="/" className="brand-wrap">
              <span className="brand-kicker">Luxury Travel Network</span>
              <span className="brand">Exciting Maldives</span>
            </Link>
            <nav className="nav" aria-label="Primary">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/resorts">Resorts</Link>
              <Link href="/partner/login">Partner Login</Link>
              <Link href="/admin/login">Admin Center</Link>
              <Link href="/partner/register" className="button">
                Become a Partner
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="shell footer-grid">
            <div>
              <p className="eyebrow">{footer.companyLabel}</p>
              <p>{footer.description}</p>
            </div>
            <div className="footer-links">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/partner/login">Partner Login</Link>
              <Link href="/admin/login">Admin Center</Link>
              <a href={`mailto:${footer.contactEmail}`}>{footer.contactEmail}</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
