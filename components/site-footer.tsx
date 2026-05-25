import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { FooterBadge, FooterContent, FooterLinkItem, NavbarContent } from "@/lib/site-content";

function normalizeHref(value: string) {
  return value || "#";
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

  const companyItems = mergeLinks(
    groupByTitle("company"),
    [
      footerLink("About Us", "/about"),
      footerLink("DMC Services", "/services"),
      footerLink("Resorts", "/resorts"),
      footerLink("Travel Guide", "/travel-guide"),
      footerLink("Contact Us", "/contact")
    ]
  ).slice(0, 5);

  const partnerItems = mergeLinks(
    groupByTitle("resource"),
    groupByTitle("partner"),
    [
      footerLink("Partner Login", "/partner/login"),
      footerLink("Marketing Hub", "/partner/resources"),
      footerLink("Documents", "/partner/resources"),
      footerLink("News & Updates", "/travel-guide")
    ]
  );

  const legalItems = [
    footerLink("Terms & Conditions", "#"),
    footerLink("Privacy Policy", "#"),
    footerLink("Cookie Policy", "#")
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
                <Linkedin size={16} />
              </a>
              <a href="#" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="#" aria-label="Facebook">
                <Facebook size={16} />
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

          <div className="site-footer__contact">
            <p className="section-kicker">Contact</p>
            <a href={`tel:${footer.contactPhone}`}>
              <Phone size={15} />
              {footer.contactPhone}
            </a>
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
