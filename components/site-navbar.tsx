"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, Hotel, Info, LogIn, Map, Ship, UserPlus } from "lucide-react";

import { PartnerRegisterForm } from "@/components/partner-register-form";
import type { NavbarContent } from "@/lib/site-content";

export function SiteNavbar({ navbar }: { navbar: NavbarContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const pathname = usePathname();

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
    { label: "Hotels", href: configuredItems.find((item) => item.label === "Hotels")?.href || "/hotels", external: false },
    { label: "Liveaboard", href: configuredItems.find((item) => item.label === "Liveaboard" || item.label === "Live Boards")?.href || "/liveaboards", external: false },
    { label: "Map", href: configuredItems.find((item) => item.label === "Map")?.href || "/#global-markets", external: false },
    { label: "Info", href: configuredItems.find((item) => item.label === "Info" || item.href === "/travel-guide")?.href || "/travel-guide", external: false }
  ];
  const partnerLoginHref = navbar.partnerLoginHref || navbar.ctaHref || "/partner/login";
  const mobileItems = [
    { ...navItems[0], Icon: Hotel },
    { ...navItems[1], Icon: Building2 },
    { ...navItems[2], Icon: Ship },
    { ...navItems[3], Icon: Map },
    { ...navItems[4], Icon: Info },
    { label: "Portal", href: partnerLoginHref, external: false, Icon: LogIn }
  ];
  const isHomepage = pathname === "/";
  const useLightNav = !isHomepage || scrolled;
  const navClassName = `site-nav${useLightNav ? " is-scrolled is-light" : ""}`;
  const activeLogoUrl = useLightNav
    ? navbar.primaryLogoUrl || navbar.blackLogoUrl || navbar.whiteLogoUrl
    : navbar.whiteLogoUrl || navbar.primaryLogoUrl || navbar.blackLogoUrl;

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
            <Link href={partnerLoginHref} className="site-nav__login">
              Partner Login
            </Link>
          ) : null}
          <button type="button" className="site-nav__cta" onClick={() => setPartnerModalOpen(true)}>
            Become a Partner
          </button>
        </nav>

        <button type="button" className="site-nav__mobile-portal" aria-label="Become a Partner" onClick={() => setPartnerModalOpen(true)}>
          <UserPlus size={18} />
        </button>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile primary">
        {mobileItems.map(({ Icon, ...item }) => (
          <Link href={item.href} key={`${item.label}-${item.href}`} className="mobile-bottom-nav__item">
            <Icon size={19} strokeWidth={1.9} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {partnerModalOpen ? (
        <div className="partner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Become a Partner">
          <div className="partner-modal-panel">
            <div className="partner-modal-header">
              <div>
                <p className="eyebrow">Become a Partner</p>
                <h2>Apply for partner access</h2>
              </div>
              <button type="button" className="partner-modal-close" onClick={() => setPartnerModalOpen(false)} aria-label="Close partner form">
                ×
              </button>
            </div>
            <PartnerRegisterForm />
          </div>
        </div>
      ) : null}
    </header>
  );
}
