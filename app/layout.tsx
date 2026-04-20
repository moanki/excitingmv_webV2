import type { Metadata } from "next";
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
        <SiteFooter footer={footer} />
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
        <LiveChatWidget />
      </body>
    </html>
  );
}
