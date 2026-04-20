"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { NavbarContent } from "@/lib/site-content";

export function SiteNavbar({ navbar }: { navbar: NavbarContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = navbar.navItems.filter((item) => item.enabled && item.label && item.href);
  const navClassName = `site-nav${scrolled ? " is-scrolled" : ""}`;
  const activeLogoUrl = scrolled ? navbar.blackLogoUrl || navbar.primaryLogoUrl : navbar.whiteLogoUrl || navbar.primaryLogoUrl;

  return (
    <header className={navClassName}>
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand" onClick={() => setOpen(false)}>
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt={navbar.brandLabel || "Exciting Maldives"}
              className="site-nav__brand-logo"
            />
          ) : (
            <span className="site-nav__brand-label">{navbar.brandLabel || "Exciting Maldives"}</span>
          )}
          <span className="site-nav__brand-kicker">{navbar.brandKicker || "Luxury Travel Network"}</span>
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
            <Link href={navbar.ctaHref} className="site-nav__cta">
              {navbar.ctaLabel}
            </Link>
          ) : null}
        </nav>

        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`site-nav__mobile${open ? " is-open" : ""}`}>
        <div className="site-nav__mobile-panel">
          {navItems.map((item) =>
            item.external ? (
              <a
                href={item.href}
                key={`${item.label}-${item.href}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link href={item.href} key={`${item.label}-${item.href}`} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            )
          )}
          {navbar.ctaEnabled ? (
            <Link href={navbar.ctaHref} className="site-nav__cta site-nav__cta--mobile" onClick={() => setOpen(false)}>
              {navbar.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
