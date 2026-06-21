"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Article, BellSimple, Compass, House, Lifebuoy, UserCircle } from "@phosphor-icons/react";

import { PartnerRegisterForm } from "@/components/partner-register-form";
import type { NavbarContent } from "@/lib/site-content";

export function SiteNavbar({ navbar }: { navbar: NavbarContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [activeMobileLabel, setActiveMobileLabel] = useState<string | null>(null);
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
    function onOpenPartnerModal() {
      setPartnerModalOpen(true);
    }

    window.addEventListener("open-partner-modal", onOpenPartnerModal);
    return () => window.removeEventListener("open-partner-modal", onOpenPartnerModal);
  }, []);

  const navItems = navbar.navItems.filter((item) => item.enabled && item.label && item.href);
  const partnerLoginHref = navbar.partnerLoginHref || navbar.ctaHref || "/partner/login";
  const mobileItems = [
    { label: "Home", href: "/", Icon: House },
    { label: "Explore", href: "/resorts", Icon: Compass, destinationRoutes: ["/resorts", "/hotels", "/liveaboards"] },
    { label: "Guide", href: "/travel-guide", Icon: Article },
    { label: "Contact", href: "/contact", Icon: Lifebuoy },
    { label: "Partners", href: partnerLoginHref, Icon: UserCircle }
  ];
  const usesHeroOverlayNav =
    pathname === "/" || /^\/(resorts|hotels|liveaboards)\/[^/]+/.test(pathname);
  const useLightNav = !usesHeroOverlayNav || scrolled;
  const navClassName = `site-nav${usesHeroOverlayNav ? " is-overlay-route" : ""}${useLightNav ? " is-scrolled is-light" : ""}`;
  const activeLogoUrl = useLightNav
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

          <Link href={partnerLoginHref} className="site-nav__mobile-portal" aria-label="Partner notifications and access">
            <BellSimple size={18} weight="regular" />
          </Link>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile primary">
        {mobileItems.map(({ Icon, ...item }) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.destinationRoutes
                ? activeMobileLabel === item.label || item.destinationRoutes.some((route) => pathname.startsWith(route))
                : item.href !== "/#newsletter" && pathname.startsWith(item.href);
          const className = `mobile-bottom-nav__item${isActive ? " is-active" : ""}`;

          return (
            <Link
              href={item.href}
              prefetch={false}
              key={item.label}
              className={className}
              onClick={() => setActiveMobileLabel(item.label === "Explore" ? item.label : null)}
            >
              <span className="mobile-bottom-nav__frame" aria-hidden="true">
                <span className="mobile-bottom-nav__bracket mobile-bottom-nav__bracket--tl" />
                <span className="mobile-bottom-nav__bracket mobile-bottom-nav__bracket--tr" />
                <span className="mobile-bottom-nav__bracket mobile-bottom-nav__bracket--bl" />
                <span className="mobile-bottom-nav__bracket mobile-bottom-nav__bracket--br" />
                <Icon className="mobile-bottom-nav__icon" size={18} weight={isActive ? "regular" : "regular"} />
              </span>
              <span className="mobile-bottom-nav__label">{item.label}</span>
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
