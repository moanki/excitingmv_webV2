import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";

import "@/app/globals.css";
import { getFooterContent, getNavbarContent, getWhatsAppSettings } from "@/lib/site-content";

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
  const [{ content: navbar }, { content: footer }, { content: whatsApp }] = await Promise.all([
    getNavbarContent("published"),
    getFooterContent("published"),
    getWhatsAppSettings("published")
  ]);

  const enabledNavItems = navbar.navItems.filter((item) => item.enabled && item.label && item.href);
  const enabledLinkGroups = footer.linkGroups.filter((group) => group.enabled && group.title);
  const enabledMemberships = footer.memberships.filter((item) => item.enabled && item.name);
  const enabledAwards = footer.awards.filter((item) => item.enabled && item.name);

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <header className="topbar">
          <div className="shell topbar-inner">
            <Link href="/" className="brand-wrap">
              <span className="brand-kicker">{navbar.brandKicker}</span>
              <span className="brand">{navbar.brandLabel}</span>
            </Link>
            <nav className="nav" aria-label="Primary">
              {enabledNavItems.map((item) =>
                item.external ? (
                  <a href={item.href} key={`${item.label}-${item.href}`} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} key={`${item.label}-${item.href}`}>
                    {item.label}
                  </Link>
                )
              )}
              {navbar.ctaEnabled ? (
                <Link href={navbar.ctaHref} className="button">
                  {navbar.ctaLabel}
                </Link>
              ) : null}
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="shell footer-grid footer-grid-rich">
            <div className="footer-brand">
              <p className="eyebrow">{footer.companyLabel}</p>
              <p>{footer.description}</p>
              <div className="stack footer-contact">
                <a href={`mailto:${footer.contactEmail}`}>{footer.contactEmail}</a>
                <a href={`tel:${footer.contactPhone}`}>{footer.contactPhone}</a>
                <p>{footer.address}</p>
              </div>
            </div>
            <div className="footer-links-grid">
              {enabledLinkGroups.map((group) => (
                <div className="footer-link-group" key={group.title}>
                  <p className="eyebrow">{group.title}</p>
                  <div className="footer-links">
                    {group.items
                      .filter((item) => item.enabled && item.label && item.href)
                      .map((item) =>
                        item.external ? (
                          <a href={item.href} key={`${group.title}-${item.label}`} target="_blank" rel="noreferrer">
                            {item.label}
                          </a>
                        ) : (
                          <Link href={item.href} key={`${group.title}-${item.label}`}>
                            {item.label}
                          </Link>
                        )
                      )}
                  </div>
                </div>
              ))}
            </div>
            <div className="footer-proof">
              <div>
                <p className="eyebrow">Memberships</p>
                <div className="footer-badge-list">
                  {enabledMemberships.map((item) =>
                    item.href ? (
                      <a href={item.href} key={item.name} className="footer-badge" target="_blank" rel="noreferrer">
                        {item.name}
                      </a>
                    ) : (
                      <span key={item.name} className="footer-badge">
                        {item.name}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <p className="eyebrow">Awards</p>
                <div className="footer-badge-list">
                  {enabledAwards.map((item) =>
                    item.href ? (
                      <a href={item.href} key={item.name} className="footer-badge" target="_blank" rel="noreferrer">
                        {item.name}
                      </a>
                    ) : (
                      <span key={item.name} className="footer-badge">
                        {item.name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </footer>
        {whatsApp.enabled ? (
          <a
            href={whatsApp.link}
            className="whatsapp-float"
            target="_blank"
            rel="noreferrer"
            aria-label={whatsApp.label}
          >
            <span>{whatsApp.label}</span>
          </a>
        ) : null}
      </body>
    </html>
  );
}
