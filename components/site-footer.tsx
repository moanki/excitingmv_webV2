import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { FooterBadge, FooterContent, FooterLinkItem, NavbarContent } from "@/lib/site-content";

function normalizeHref(value: string) {
  return value || "#";
}

function whatsappHref(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

function mergeLinks(...groups: FooterLinkItem[][]) {
  const seen = new Set<string>();
  return groups
    .flat()
    .filter((item) => item.enabled && item.label)
    .filter((item) => {
      const key = `${item.label.toLowerCase()}-${item.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function footerLink(label: string, href: string): FooterLinkItem {
  return { label, href, enabled: true, external: false };
}

function footerItemWithOverrides(item: FooterLinkItem, partnerLoginHref: string): FooterLinkItem | null {
  const normalized = item.label.trim().toLowerCase();

  if (normalized === "news & updates") {
    return null;
  }

  if (normalized === "awards") {
    return { ...item, href: "/#prestigious-awards", external: false };
  }

  if (normalized === "dmc services") {
    return { ...item, href: "/#destination-management", external: false };
  }

  if (normalized === "partner login") {
    return { ...item, label: "Partner Login", href: partnerLoginHref, external: false };
  }

  return item;
}

function FooterNavLink({ item }: { item: FooterLinkItem }) {
  if (item.external) {
    return (
      <a href={normalizeHref(item.href)} target="_blank" rel="noreferrer">
        {item.label}
      </a>
    );
  }

  return <Link href={normalizeHref(item.href)}>{item.label}</Link>;
}

function BadgeLink({ item }: { item: FooterBadge }) {
  const content = item.imageUrl ? (
    <img
      src={optimizedImageUrl(item.imageUrl, { width: 220, height: 130, quality: 82, resize: "contain" })}
      alt={item.name}
      className="site-footer__badge-image"
      width={220}
      height={130}
      loading="lazy"
    />
  ) : (
    item.name
  );

  return item.href ? (
    <a href={item.href} className="site-footer__badge" target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <span className="site-footer__badge">{content}</span>
  );
}

function BadgeGroup({ title, items }: { title: string; items: FooterBadge[] }) {
  if (!items.length) return null;

  return (
    <div className="site-footer__proof-group">
      <p className="section-kicker">{title}</p>
      <div className="site-footer__badge-cloud">
        {items.map((item) => (
          <BadgeLink item={item} key={item.name} />
        ))}
      </div>
    </div>
  );
}

export function SiteFooter({ footer, navbar }: { footer: FooterContent; navbar: NavbarContent }) {
  const groupByTitle = (needle: string) =>
    footer.linkGroups.find((group) => group.enabled && group.title.toLowerCase().includes(needle))?.items ?? [];
  const partnerLoginHref = navbar.partnerLoginHref || navbar.ctaHref || "/partner/login";
  const withFooterRules = (items: FooterLinkItem[]) => {
    const seen = new Set<string>();
    return items
      .map((item) => footerItemWithOverrides(item, partnerLoginHref))
      .filter((item): item is FooterLinkItem => Boolean(item))
      .filter((item) => {
        const key = `${item.label.toLowerCase()}-${item.href}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const companyItems = withFooterRules(mergeLinks(
    groupByTitle("company"),
    [
      footerLink("About Us", "/about"),
      footerLink("DMC Services", "/#destination-management"),
      footerLink("Resorts", "/resorts"),
      footerLink("Travel Guide", "/travel-guide"),
      footerLink("Awards", "/#prestigious-awards"),
      footerLink("Contact Us", "/contact")
    ]
  )).slice(0, 6);

  const partnerItems = withFooterRules(mergeLinks(
    groupByTitle("partner"),
    [
      footerLink("Partner Login", partnerLoginHref),
      footerLink("Marketing Hub", "/partner/resources"),
      footerLink("Documents", "/partner/resources")
    ]
  ));

  const legalItems = [
    footerLink("Terms & Conditions", "#"),
    footerLink("Privacy Policy", "#"),
    footerLink("Cookie Policy", "#")
  ];

  const mobileFooterGroups = [
    {
      title: "Destinations",
      items: [
        footerLink("Resorts", "/resorts"),
        footerLink("Hotels", "/hotels"),
        footerLink("Liveaboards", "/liveaboards"),
        footerLink("Travel Guide", "/travel-guide")
      ]
    },
    {
      title: "Services",
      items: [
        footerLink("DMC Services", "/#destination-management"),
        footerLink("Partner Support", "/contact"),
        footerLink("Resort Intelligence", "/resorts"),
        footerLink("Contact Us", "/contact")
      ]
    },
    { title: "Company", items: companyItems.slice(0, 4) },
    { title: "Resources", items: partnerItems.slice(0, 4) }
  ];

  const enabledMemberships = footer.memberships.filter((item) => item.enabled && item.name);
  const enabledAwards = footer.awards.filter((item) => item.enabled && item.name);
  const footerLogoUrl = navbar.primaryLogoUrl || footer.companyLogoUrl || navbar.blackLogoUrl || navbar.whiteLogoUrl;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            {footerLogoUrl ? (
              <img
                src={optimizedImageUrl(footerLogoUrl, { width: 240, height: 160, quality: 82, resize: "contain" })}
                alt={footer.companyLabel}
                className="site-footer__logo-image"
                width={240}
                height={160}
                loading="lazy"
              />
            ) : (
              <div className="site-footer__logo">{footer.companyLabel}</div>
            )}
            <p className="site-footer__summary">{footer.description}</p>
            <div className="site-footer__social" aria-label="Social links">
              <a href="#" aria-label="LinkedIn">
                <FaLinkedinIn size={16} />
              </a>
              <a href="#" aria-label="Instagram">
                <FaInstagram size={16} />
              </a>
              <a href="#" aria-label="Facebook">
                <FaFacebookF size={16} />
              </a>
            </div>
          </div>

          <nav className="site-footer__columns" aria-label="Footer navigation">
            <div className="site-footer__column">
              <p className="section-kicker">Company</p>
              <div className="site-footer__links">
                {companyItems.map((item) => (
                  <FooterNavLink item={item} key={`${item.label}-${item.href}`} />
                ))}
              </div>
            </div>
            <div className="site-footer__column">
              <p className="section-kicker">Partner Resources</p>
              <div className="site-footer__links">
                {partnerItems.map((item) => (
                  <FooterNavLink item={item} key={`${item.label}-${item.href}`} />
                ))}
              </div>
            </div>
            <div className="site-footer__column">
              <p className="section-kicker">Legal</p>
              <div className="site-footer__links">
                {legalItems.map((item) => (
                  <FooterNavLink item={item} key={`${item.label}-${item.href}`} />
                ))}
              </div>
            </div>
          </nav>

          <nav className="site-footer__mobile-nav" aria-label="Mobile footer navigation">
            {mobileFooterGroups.map((group) => (
              <div className="site-footer__mobile-group" key={group.title}>
                <p className="section-kicker">{group.title}</p>
                <div className="site-footer__links">
                  {group.items.map((item) => (
                    <FooterNavLink item={item} key={`${group.title}-${item.label}-${item.href}`} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="site-footer__contact">
            <p className="section-kicker">Contact</p>
            <a href={`tel:${footer.contactPhone}`}>
              <Phone size={15} />
              {footer.contactPhone}
            </a>
            {footer.contactWhatsApp ? (
              <a href={whatsappHref(footer.contactWhatsApp)} target="_blank" rel="noreferrer">
                <FaWhatsapp size={15} />
                {footer.contactWhatsApp}
              </a>
            ) : null}
            <a href={`mailto:${footer.contactEmail}`}>
              <Mail size={15} />
              {footer.contactEmail}
            </a>
            <p>
              <MapPin size={15} />
              {footer.address}
            </p>
          </div>
        </div>

        <div className="site-footer__proof">
          <BadgeGroup title="Affiliates" items={enabledMemberships} />
          <BadgeGroup title="Awards" items={enabledAwards} />
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} Exciting Maldives. All rights reserved.</p>
          <p className="site-footer__made">Made in the Maldives</p>
        </div>
      </div>
    </footer>
  );
}
