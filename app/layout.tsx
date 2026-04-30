import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";

import "@/app/globals.css";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
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
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <html lang="en">
        <body className={`${inter.variable} ${playfair.variable} admin-body`}>{children}</body>
      </html>
    );
  }

  const [{ content: navbar }, { content: footer }, { content: whatsApp }] = await Promise.all([
    getNavbarContent("published"),
    getFooterContent("published"),
    getWhatsAppSettings("published")
  ]);

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <SiteNavbar navbar={navbar} />
        {children}
        <SiteFooter footer={footer} navbar={navbar} />
        {whatsApp.enabled ? (
          <a
            href={whatsApp.link}
            className="whatsapp-float"
            target="_blank"
            rel="noreferrer"
            aria-label={whatsApp.label || "WhatsApp"}
          >
            {/* Official WhatsApp brand icon */}
            <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M16.003 2.667C8.638 2.667 2.667 8.638 2.667 16c0 2.34.63 4.532 1.728 6.427L2.667 29.333l7.104-1.683A13.268 13.268 0 0016.003 29.333c7.365 0 13.33-5.971 13.33-13.333 0-7.362-5.965-13.333-13.33-13.333zm0 24.267a11 11 0 01-5.59-1.524l-.4-.239-4.216.998.995-4.104-.264-.42A10.984 10.984 0 015.004 16c0-6.073 4.926-11 11-11s11 4.927 11 11c0 6.073-4.926 11-11 11zm6.04-8.214c-.331-.166-1.956-.967-2.259-1.077-.303-.11-.524-.166-.744.166-.22.331-.855 1.077-1.047 1.298-.193.22-.386.248-.717.083-.331-.166-1.396-.515-2.659-1.64-.983-.876-1.647-1.958-1.84-2.289-.193-.331-.021-.51.145-.675.149-.148.331-.386.496-.579.166-.193.22-.331.331-.552.11-.22.055-.414-.028-.579-.083-.166-.744-1.795-1.02-2.457-.268-.647-.54-.558-.744-.568-.193-.01-.414-.013-.635-.013-.22 0-.579.083-.882.414-.303.331-1.158 1.133-1.158 2.763 0 1.63 1.186 3.205 1.35 3.426.166.22 2.334 3.567 5.657 5.002.79.341 1.407.545 1.888.697.793.252 1.515.217 2.086.131.636-.095 1.956-.8 2.232-1.573.276-.773.276-1.435.193-1.573-.082-.138-.303-.22-.634-.386z" />
            </svg>
          </a>
        ) : null}
        <LiveChatWidget />
      </body>
    </html>
  );
}
