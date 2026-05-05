"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Hotel, Info, LogIn, Map, Ship, UserPlus } from "lucide-react";

import type { NavbarContent } from "@/lib/site-content";

export function SiteNavbar({ navbar }: { navbar: NavbarContent }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const configuredItems = navbar.navItems.filter((item) => item.enabled && item.label && item.href);
  const navItems = [
    { label: "Resort", href: configuredItems.find((item) => item.label === "Resort" || item.label === "Resorts")?.href || "/resorts", external: false },
    { label: "Hotels", href: configuredItems.find((item) => item.label === "Hotels")?.href || "/resorts?collection=hotels", external: false },
    { label: "Live Boards", href: configuredItems.find((item) => item.label === "Live Boards")?.href || "/resorts?collection=live-boards", external: false },
    { label: "Map", href: configuredItems.find((item) => item.label === "Map")?.href || "/#global-markets", external: false },
    { label: "Info", href: configuredItems.find((item) => item.label === "Info" || item.href === "/travel-guide")?.href || "/travel-guide", external: false }
  ];
  const mobileItems = [
    { ...navItems[0], Icon: Hotel },
    { ...navItems[1], Icon: Building2 },
    { ...navItems[2], Icon: Ship },
    { ...navItems[3], Icon: Map },
    { ...navItems[4], Icon: Info },
    { label: "Portal", href: navbar.ctaHref || "/partner/login", external: false, Icon: LogIn }
  ];
  const navClassName = `site-nav${scrolled ? " is-scrolled" : ""}`;
  const activeLogoUrl = scrolled ? navbar.primaryLogoUrl || navbar.whiteLogoUrl : navbar.whiteLogoUrl || navbar.primaryLogoUrl;

  return (
    <header className={navClassName}>
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand">
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt={navbar.brandLabel || "Exciting Maldives"}
              className="site-nav__brand-logo"
            />
          ) : (
            <span className="site-nav__brand-label">{navbar.brandLabel || "Exciting Maldives"}</span>
          )}
        </Link>

        <nav className="site-nav__links" aria-label="Primary">
          {navItems.map((item) =>
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
            <Link href={navbar.ctaHref || "/partner/login"} className="site-nav__login">
              Partner Login
            </Link>
          ) : null}
          <Link href="/partner/register" className="site-nav__cta">
            Become a Partner
          </Link>
        </nav>

        <Link href="/partner/register" className="site-nav__mobile-portal" aria-label="Become a Partner">
          <UserPlus size={18} />
        </Link>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile primary">
        {mobileItems.map(({ Icon, ...item }) => (
          <Link href={item.href} key={`${item.label}-${item.href}`} className="mobile-bottom-nav__item">
            <Icon size={19} strokeWidth={1.9} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
