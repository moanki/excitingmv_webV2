"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, Home, LockKeyhole, Mail, MapPinned } from "lucide-react";

import { PartnerRegisterForm } from "@/components/partner-register-form";
import type { NavbarContent } from "@/lib/site-content";

export function SiteNavbar({ navbar }: { navbar: NavbarContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    function onOpenPartnerModal() {
      setPartnerModalOpen(true);
    }

    window.addEventListener("open-partner-modal", onOpenPartnerModal);
    return () => window.removeEventListener("open-partner-modal", onOpenPartnerModal);
  }, []);

  const navItems = navbar.navItems.filter((item) => item.enabled && item.label && item.href);
  const partnerLoginHref = navbar.partnerLoginHref || navbar.ctaHref || "/partner/login";
  const mobileItems = [
    { label: "Home", href: "/", Icon: Home },
    { label: "Destinations", href: "/resorts", Icon: MapPinned },
    { label: "Contact", href: "/contact", Icon: Mail },
    { label: "About", href: "/about", Icon: Building2 },
    { label: "Partner", href: partnerLoginHref, Icon: LockKeyhole }
  ];
  const hasMobileHero = pathname === "/" || pathname.startsWith("/resorts") || pathname === "/about";
  const usesHeroOverlayNav =
    pathname === "/" || /^\/(resorts|hotels|liveaboards)\/[^/]+/.test(pathname);
  const useLightNav = !usesHeroOverlayNav || scrolled;
  const navClassName = `site-nav${usesHeroOverlayNav ? " is-overlay-route" : ""}${hasMobileHero ? " has-mobile-hero" : ""}${useLightNav ? " is-scrolled is-light" : ""}`;
  const activeLogoUrl = isMobile
    ? hasMobileHero && !scrolled
      ? navbar.whiteLogoUrl || navbar.primaryLogoUrl || navbar.blackLogoUrl
      : navbar.primaryLogoUrl || navbar.blackLogoUrl || navbar.whiteLogoUrl
    : useLightNav
      ? navbar.primaryLogoUrl || navbar.blackLogoUrl || navbar.whiteLogoUrl
      : navbar.whiteLogoUrl || navbar.primaryLogoUrl || navbar.blackLogoUrl;

  return (
    <>
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

          <span className="site-nav__mobile-spacer" aria-hidden="true" />

        </div>
      </header>

      <nav className="mobile-tabbar" aria-label="Mobile primary">
        {mobileItems.map(({ Icon, ...item }) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.replace("/login", ""));
          const className = `mobile-tabbar__item${isActive ? " is-active" : ""}`;

          return (
            <Link href={item.href} key={item.label} className={className}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}
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
    </>
  );
}
