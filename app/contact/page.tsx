import { Mail, MapPin, Phone } from "lucide-react";

import { ContactRequestForm } from "@/components/contact-request-form";
import { getFooterContent } from "@/lib/site-content";

export default async function ContactPage() {
  const { content: footer } = await getFooterContent("published");

  return (
    <main className="public-lux-page">
      <section className="public-lux-section contact-lux">
        <div className="lux-container contact-lux__grid">
          <div className="contact-lux__copy">
            <p className="lux-eyebrow">Contact</p>
            <h1>Contact Us</h1>
            <p>
              For resort partnerships, destination management support, partner access, or curated Maldives
              travel opportunities, send us a message and our team will respond with context.
            </p>
            <div className="contact-lux__details">
              <a href={`mailto:${footer.contactEmail}`}><Mail size={18} />{footer.contactEmail}</a>
              <a href={`tel:${footer.contactPhone}`}><Phone size={18} />{footer.contactPhone}</a>
              <span><MapPin size={18} />{footer.address}</span>
            </div>
          </div>
          <div className="contact-lux__form">
            <p className="lux-eyebrow">Send a Message</p>
            <h2>How can we help?</h2>
            <ContactRequestForm />
          </div>
        </div>
      </section>
    </main>
  );
}
