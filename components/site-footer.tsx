import Link from "next/link";

import type { FooterContent, NavbarContent } from "@/lib/site-content";

export function SiteFooter({ footer, navbar }: { footer: FooterContent; navbar: NavbarContent }) {
  const enabledLinkGroups = footer.linkGroups.filter((group) => group.enabled && group.title);
  const enabledMemberships = footer.memberships.filter((item) => item.enabled && item.name);
  const enabledAwards = footer.awards.filter((item) => item.enabled && item.name);
  const footerLogoUrl = footer.companyLogoUrl || navbar.whiteLogoUrl;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <p className="section-kicker">Exciting Maldives</p>
            {footerLogoUrl ? (
              <img
                src={footerLogoUrl}
                alt={footer.companyLabel}
                className="site-footer__logo-image"
              />
            ) : (
              <div className="site-footer__logo">{footer.companyLabel}</div>
            )}
            <p className="site-footer__summary">{footer.description}</p>
            <div className="site-footer__contact">
              <p>{footer.address}</p>
              <a href={`tel:${footer.contactPhone}`}>{footer.contactPhone}</a>
              <a href={`mailto:${footer.contactEmail}`}>{footer.contactEmail}</a>
            </div>
          </div>

          <div className="site-footer__columns">
            {enabledLinkGroups.map((group) => (
              <div className="site-footer__column" key={group.title}>
                <p className="section-kicker">{group.title}</p>
                <div className="site-footer__links">
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

          <div className="site-footer__proof">
            {enabledMemberships.length ? (
              <div>
                <p className="section-kicker">Memberships</p>
                <div className="site-footer__badge-cloud">
                  {enabledMemberships.map((item) =>
                    item.href ? (
                      <a href={item.href} key={item.name} className="site-footer__badge" target="_blank" rel="noreferrer">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="site-footer__badge-image" />
                        ) : (
                          item.name
                        )}
                      </a>
                    ) : (
                      <span key={item.name} className="site-footer__badge">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="site-footer__badge-image" />
                        ) : (
                          item.name
                        )}
                      </span>
                    )
                  )}
                </div>
              </div>
            ) : null}

            {enabledAwards.length ? (
              <div>
                <p className="section-kicker">Awards</p>
                <div className="site-footer__badge-cloud">
                  {enabledAwards.map((item) =>
                    item.href ? (
                      <a href={item.href} key={item.name} className="site-footer__badge" target="_blank" rel="noreferrer">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="site-footer__badge-image" />
                        ) : (
                          item.name
                        )}
                      </a>
                    ) : (
                      <span key={item.name} className="site-footer__badge">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="site-footer__badge-image" />
                        ) : (
                          item.name
                        )}
                      </span>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} Exciting Maldives. A Premium B2B Travel Ecosystem.</p>
          <div className="site-footer__bottom-links">
            <Link href="/contact">Contact</Link>
            <Link href="/travel-guide">Travel Guide</Link>
            <Link href="/partner/login">Partner Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
